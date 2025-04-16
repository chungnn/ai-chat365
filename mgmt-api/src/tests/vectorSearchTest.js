/**
 * Simplified test file for Elasticsearch vector search with Gemini embeddings
 * This file demonstrates how to use vector search with a specific query: "chính sách bảo hành"
 */

require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Generative AI with API key
const GOOGLE_AI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

// Configure Elasticsearch client
const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'https://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
  tls: {
    rejectUnauthorized: false // Only for development
  }
});

// Basic health check of Elasticsearch connection
const checkElasticsearchHealth = async () => {
  try {
    const health = await elasticClient.cluster.health();
    console.log('Elasticsearch health status:', health.status);
    return health;
  } catch (error) {
    console.error('Elasticsearch health check failed:', error);
    return null;
  }
};

/**
 * Generate embeddings using Google Gemini Embedding API
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<Array<number>>} - Promise resolving to an array of floating point numbers representing the embedding vector
 */
const generateGeminiEmbedding = async (text) => {
  try {
    if (!GOOGLE_AI_API_KEY) {
      console.warn('GEMINI_API_KEY not set, falling back to mock embeddings');
      return generateMockEmbedding(text);
    }

    // Gemini embedding model
    const embeddingModel = "models/embedding-001";
    const model = genAI.getGenerativeModel({ model: embeddingModel });
    
    // Get embeddings from the Gemini API
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    // Check if we received a valid embedding
    if (!embedding || !embedding.length) {
      console.warn('Empty embedding received from Gemini, falling back to mock embeddings');
      return generateMockEmbedding(text);
    }
    
    console.log(`Successfully generated Gemini embedding with ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error('Error generating Gemini embedding:', error);
    console.warn('Falling back to mock embeddings');
    return generateMockEmbedding(text);
  }
};

/**
 * Generate mock embeddings for demo purposes or as fallback
 * @param {string} text - Text to generate embeddings for
 * @returns {Array<number>} - Array of floating point numbers representing the embedding vector
 */
const generateMockEmbedding = (text) => {
  // Create a deterministic but unique vector based on the text
  const seed = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Create a vector of dimension 768 (common for many embedding models)
  return Array.from({ length: 768 }, (_, i) => {
    // Generate a value between -1 and 1 that's seeded by both the text and position
    const val = Math.sin(seed * (i + 1) * 0.001) * 0.5 + Math.cos(i * 0.01) * 0.5;
    return parseFloat(val.toFixed(6)); // Limit decimal places to save space
  });
};

/**
 * Perform a vector search using Gemini embeddings
 */
const performVectorSearch = async (queryText, size = 3) => {
  try {
    // Generate embedding for the query text using Gemini API
    console.log(`Generating Gemini embedding for query: "${queryText}"`);
    const queryVector = await generateGeminiEmbedding(queryText);
    
    console.log(`Vector has ${queryVector.length} dimensions`);
    
    // First, check if the index exists
    const indexExists = await elasticClient.indices.exists({
      index: 'knowledge_base2'
    });
    
    if (!indexExists) {
      console.error('Index "knowledge_base2" does not exist in Elasticsearch.');
      return [];
    }
    
    // Get index mapping to check field types
    const mapping = await elasticClient.indices.getMapping({
      index: 'knowledge_base2'
    });
    
    console.log('Index mapping:', JSON.stringify(mapping, null, 2));
      try {
      // Modified query to only consider documents that have the embedding field
      const result = await elasticClient.search({
        index: 'knowledge_base2',
        body: {
          query: {
            script_score: {
              // Only match documents that have the embedding field
              query: { 
                exists: { 
                  field: 'embedding' 
                } 
              },
              script: {
                source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                params: { query_vector: queryVector }
              }
            }
          },
          size
        }
      });
      
      console.log(`\nVector search results for "${queryText}" using Gemini embeddings:`);
      console.log(`- Total documents considered: ${result.hits.total.value}`);
      console.log('- Top results by semantic similarity:');
      
      result.hits.hits.forEach((hit, i) => {
        console.log(`  ${i + 1}. ${hit._source.title} (Score: ${hit._score.toFixed(2)})`);
        // Print a snippet of the content
        const contentPreview = hit._source.content.length > 100 
          ? hit._source.content.substring(0, 100) + '...' 
          : hit._source.content;
        console.log(`     ${contentPreview}`);
      });
      
      return result.hits.hits;
    } catch (searchError) {
      console.error('Search execution error:', searchError);
      
      // Try a simpler search to verify index is working
      console.log('Attempting a simple match_all query to verify index is accessible...');
      try {
        const simpleResult = await elasticClient.search({
          index: 'knowledge_base2',
          body: {
            query: { match_all: {} },
            size: 1
          }
        });
        console.log('Simple query succeeded. Index is accessible.');
        console.log('Sample document:', JSON.stringify(simpleResult.hits.hits[0], null, 2));
        
        // Check if embedding field exists in the document
        if (simpleResult.hits.total.value > 0) {
          const sampleDoc = simpleResult.hits.hits[0]._source;
          if (!sampleDoc.embedding) {
            console.error('The "embedding" field is missing in documents. Vector search cannot work.');
          } else {
            console.log(`Embedding field exists with ${sampleDoc.embedding.length} dimensions.`);
          }
        }
      } catch (simpleError) {
        console.error('Even simple query failed. Index may be corrupted or inaccessible:', simpleError);
      }
      
      throw searchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error performing vector search:', error);
    if (error.meta && error.meta.body) {
      console.error('Detailed error information:', JSON.stringify(error.meta.body, null, 2));
    }
    return [];
  }
};

/**
 * Run the simplified test for vector search
 */
const runVectorSearchTest = async () => {
  console.log('Starting vector search test with Google Gemini embeddings...');
  
  if (!GOOGLE_AI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables. The test will use mock embeddings.');
    console.warn('To use real Gemini embeddings, set GEMINI_API_KEY in your .env file or environment variables.');
  }
  
  // Check Elasticsearch health
  const health = await checkElasticsearchHealth();
  if (!health) {
    console.error('Elasticsearch is not available. Please ensure Elasticsearch is running.');
    console.error('You can install Elasticsearch using Docker:');
    console.error('docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:8.6.0');
    return;
  }
  
  // Perform vector search with the specific query
  console.log('\n=== Performing vector search for "chính sách bảo hành" ===');
  await performVectorSearch('chính sách bảo hành');
  
  // Close connection
  await elasticClient.close();
  console.log('Test finished and connections closed.');
};

// Run the test if this file is executed directly
if (require.main === module) {
  runVectorSearchTest().catch(err => {
    console.error('Error running vector search test:', err);
    process.exit(1);
  });
}

// Export functions for use in other modules
module.exports = {
  elasticClient,
  performVectorSearch,
  generateGeminiEmbedding
};
