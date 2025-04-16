const { Client } = require('@elastic/elasticsearch');
const config = require('../config/config');
const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');

// Initialize Elasticsearch client
const client = new Client({
  node: config.elasticsearch.node,
  auth: {
    username: config.elasticsearch.username,
    password: config.elasticsearch.password
  },
  tls: {
    rejectUnauthorized: false // Only for development
  }
});

// Initialize Google Generative AI and embedding model for vector search
let embeddingModel = null;
try {
  embeddingModel = aiService.getEmbeddingModel();
} catch (error) {
  console.error('Error initializing embedding model:', error);
}

const INDEX_NAME = 'knowledge_base2';

// Get all knowledge items
exports.getAllKnowledge = async (req, res) => {
  try {
    // Check if the index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      return res.status(200).json([]);
    }

    // Get all knowledge items, sort by updatedAt descending
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query: { match_all: {} }
      },
      size: 20 // Limit to 1000 items
    }); const knowledgeItems = response.hits.hits.map(hit => ({
      id: hit._id,
      title: hit._source.title || '',
      content: hit._source.content,
      updatedAt: hit._source.updatedAt,
      createdAt: hit._source.createdAt
    }));

    return res.status(200).json(knowledgeItems);
  } catch (error) {
    console.error('Error fetching knowledge items:', error);
    return res.status(500).json({ message: 'Error fetching knowledge items' });
  }
};

// Get a single knowledge item by ID
exports.getKnowledgeById = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await client.get({
      index: INDEX_NAME,
      id
    });

    if (!response || !response._source) {
      return res.status(404).json({ message: 'Knowledge item not found' });
    } const knowledgeItem = {
      id: response._id,
      title: response._source.title || '',
      content: response._source.content,
      updatedAt: response._source.updatedAt,
      createdAt: response._source.createdAt
    };

    return res.status(200).json(knowledgeItem);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: 'Knowledge item not found' });
    }
    console.error('Error fetching knowledge item:', error);
    return res.status(500).json({ message: 'Error fetching knowledge item' });
  }
};

// Create a new knowledge item
exports.createKnowledge = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Check if index exists and create it if it doesn't
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      await createKnowledgeIndex();
    }    // Use LLM to analyze content and extract knowledge items
    let knowledgeItems = [];

    try {
      // Use the aiService to extract knowledge items
      console.log('Extracting knowledge items using AI service');
      knowledgeItems = await aiService.extractKnowledgeItems(content, title || '');
      console.log(`Extracted ${knowledgeItems.length} knowledge items from content`);
    } catch (llmError) {
      console.error('Error using LLM to extract knowledge items:', llmError);
      // Fallback to single item
      knowledgeItems = [{ title: title || '', content }];
    }


    // Use bulk API for inserting multiple knowledge items
    const operations = [];
    const createdItems = [];    // Generate embeddings and prepare bulk operations
    for (const item of knowledgeItems) {
      // Generate embedding for each item
      let embedding = null;
      if (embeddingModel) {
        try {
          // Generate embedding from combined title and content for better semantic representation
          const textToEmbed = `${item.title} ${item.content}`.trim();
          const embeddingResult = await aiService.generateEmbedding(textToEmbed);
          embedding = embeddingResult;
        } catch (embeddingError) {
          console.error('Error generating embedding:', embeddingError);
        }
      }

      const id = uuidv4();
      const timestamp = new Date().toISOString();

      const knowledgeItem = {
        title: item.title,
        content: item.content,
        embedding: embedding ? embedding : null,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Add to bulk operations
      operations.push(
        { index: { _index: INDEX_NAME, _id: id } },
        knowledgeItem
      );

      // Track created items for response
      createdItems.push({
        id,
        title: item.title,
        content: item.content,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    // Execute bulk operation if we have items
    if (operations.length > 0) {
      const bulkResponse = await client.bulk({
        refresh: true,
        operations
      });

      if (bulkResponse.errors) {
        console.error('Bulk operation had errors:', bulkResponse.items.filter(item => item.index.error));
        return res.status(500).json({
          message: 'Some knowledge items failed to index',
          success: true,
          items: createdItems.filter((_, i) => !bulkResponse.items[i].index.error),
          errors: bulkResponse.items.filter(item => item.index.error).map(item => item.index.error)
        });
      }

      return res.status(201).json({
        success: true,
        message: `Successfully created ${createdItems.length} knowledge items`,
        items: createdItems
      });
    } else {
      return res.status(400).json({ message: 'No valid knowledge items could be created' });
    }
  } catch (error) {
    console.error('Error creating knowledge item:', error);
    return res.status(500).json({ message: 'Error creating knowledge item' });
  }
};

// Update a knowledge item
exports.updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Check if the knowledge item exists
    const exists = await client.exists({ index: INDEX_NAME, id });
    if (!exists) {
      return res.status(404).json({ message: 'Knowledge item not found' });
    }

    // Generate embedding for the content
    let embedding = null;
    if (embeddingModel) {
      try {
        embedding = await embeddingModel.embedContent(content);
      } catch (embeddingError) {
        console.error('Error generating embedding:', embeddingError);
      }
    }

    const updatedKnowledgeItem = {
      title: title || '',
      content,
      embedding: embedding ? embedding.values : null,
      updatedAt: new Date().toISOString()
    };

    // Update the knowledge item
    const response = await client.update({
      index: INDEX_NAME,
      id,
      doc: updatedKnowledgeItem
    });

    // Get the updated document
    const updatedDoc = await client.get({
      index: INDEX_NAME,
      id
    });


    return res.status(200).json({
      success: true,
      message: 'Knowledge updated successfully',
      knowledge: updatedDoc._source
    }
    );
  } catch (error) {
    console.error('Error updating knowledge item:', error);
    return res.status(500).json({ message: 'Error updating knowledge item' });
  }
};

// Delete a knowledge item
exports.deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the knowledge item exists
    const exists = await client.exists({ index: INDEX_NAME, id });
    if (!exists) {
      return res.status(404).json({ message: 'Knowledge item not found' });
    }

    // Delete the knowledge item
    await client.delete({
      index: INDEX_NAME,
      id
    });

    return res.status(200).json({ message: 'Knowledge item deleted successfully' });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    return res.status(500).json({ message: 'Error deleting knowledge item' });
  }
};

// Create the knowledge base index with vector search capabilities
const createKnowledgeIndex = async () => {
  try {
    const indexExists = await client.indices.exists({ index: INDEX_NAME });

    if (!indexExists) {
      const response = await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              content: { type: 'text' },
              embedding: {
                type: 'dense_vector',
                dims: 768, // Dimensions for Gemini embedding vector
                index: true,
                similarity: 'cosine'
              },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      });

      console.log('Knowledge index created:', response);
      return response;
    } else {
      console.log('Knowledge index already exists');
      return null;
    }
  } catch (error) {
    console.error('Error creating knowledge index:', error);
    throw error;
  }
};

// Search knowledge items
exports.searchKnowledge = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Check if the index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      return res.status(200).json([]);
    }

    // If embedding model is available, do vector search
    if (embeddingModel) {
      try {
        const embedding = await embeddingModel.embedContent(query);

        // Semantic search using vector similarity
        const vectorResponse = await client.search({
          index: INDEX_NAME,
          body: {
            query: {
              script_score: {
                query: { match_all: {} },
                script: {
                  source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                  params: { query_vector: embedding.values }
                }
              }
            },
            sort: ["_score"],
            size: 10
          }
        });

        const results = vectorResponse.hits.hits.map(hit => ({
          id: hit._id,
          content: hit._source.content,
          score: hit._score,
          updatedAt: hit._source.updatedAt,
          createdAt: hit._source.createdAt
        }));

        return res.status(200).json(results);
      } catch (embeddingError) {
        console.error('Error in vector search:', embeddingError);
        // Fall back to text search if vector search fails
      }
    }

    // If embedding model is not available or failed, do text search
    const textResponse = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          match: {
            content: query
          }
        },
        size: 10
      }
    });

    const results = textResponse.hits.hits.map(hit => ({
      id: hit._id,
      content: hit._source.content,
      score: hit._score,
      updatedAt: hit._source.updatedAt,
      createdAt: hit._source.createdAt
    }));

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error searching knowledge items:', error);
    return res.status(500).json({ message: 'Error searching knowledge items' });
  }
};
