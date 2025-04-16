// filepath: d:\ANH CHUNG\Projects\ai-chat365\end-user-api\src\services\elasticsearchRagService.js
const { Client } = require('@elastic/elasticsearch');
const config = require('../config/config');
const aiService = require('./aiService');

/**
 * Elasticsearch RAG Service (Retrieval-Augmented Generation)
 * Provides advanced features for retrieving and using knowledge from Elasticsearch
 */

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

/**
 * Get relevant information from Elasticsearch knowledge base for a given query
 * Uses vector search if embedding model is available, falls back to text search
 * @param {string} query - The user query
 * @returns {string} - Relevant information for the query
 */
const getRelevantInformation = async (query) => {
  try {
    if (!query || query.trim() === '') {
      return null;
    }

    // Check if the index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      console.log('Knowledge index does not exist in Elasticsearch');
      return null;
    }

    let results = [];

    // If embedding model is available, do vector search (semantic search)
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
            size: 3 // Limit to top 3 most relevant results
          }
        });

        results = vectorResponse.hits.hits.map(hit => ({
          title: hit._source.title || '',
          content: hit._source.content,
          score: hit._score
        }));

        console.log(`Vector search found ${results.length} relevant items`);
      } catch (embeddingError) {
        console.error('Error in vector search:', embeddingError);
        // Fall back to text search if vector search fails
      }
    }

    // If no results from vector search or embedding model not available, do text search
    if (results.length === 0) {
      const textResponse = await client.search({
        index: INDEX_NAME,
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ["title^2", "content"],
              fuzziness: "AUTO"
            }
          },
          size: 3 // Limit to top 3 most relevant results
        }
      });

      results = textResponse.hits.hits.map(hit => ({
        title: hit._source.title || '',
        content: hit._source.content,
        score: hit._score
      }));
      
      console.log(`Text search found ${results.length} relevant items`);
    }

    // If no results found
    if (results.length === 0) {
      return null;
    }

    // Format the results into a single context string
    return results
      .map(result => {
        const titlePrefix = result.title ? `[${result.title}]: ` : '';
        return `${titlePrefix}${result.content}`;
      })
      .join('\n\n');

  } catch (error) {
    console.error('Error retrieving knowledge from Elasticsearch:', error);
    return null;
  }
};

/**
 * Verify the Elasticsearch connection and index
 * @returns {boolean} - Whether Elasticsearch is properly configured and accessible
 */
const verifyElasticsearchConnection = async () => {
  try {
    // Check if Elasticsearch is running
    const health = await client.cluster.health();
    
    // Check if our index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    
    return {
      connected: health.status !== 'red',
      indexExists: indexExists,
      clusterHealth: health.status
    };
  } catch (error) {
    console.error('Elasticsearch connection error:', error);
    return {
      connected: false,
      indexExists: false,
      error: error.message
    };
  }
};

module.exports = {
  getRelevantInformation,
  verifyElasticsearchConnection
};
