/**
 * Test file for Elasticsearch vector search with embeddings for RAG (Retrieval Augmented Generation)
 * This file demonstrates how to use Elasticsearch for semantic search with text embeddings
 * to support a RAG system with Google Gemini.
 */

require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Initialize Google Generative AI
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
 * Create index for knowledge base with vector search capabilities
 * Note: This requires Elasticsearch with vector search plugin enabled
 */
const createKnowledgeIndex = async () => {
  try {
    const indexName = 'knowledge_base';
    const indexExists = await elasticClient.indices.exists({ index: indexName });
    
    if (!indexExists) {
      // Define the index with vector search capabilities
      const result = await elasticClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'text' },
              content: { type: 'text' },
              section: { type: 'text' },
              source: { type: 'keyword' },
              category: { type: 'keyword' },              language: { type: 'keyword' },
              // Vector field for embeddings - requires Elasticsearch 8.0+ with appropriate plugins
              embedding: {
                type: 'dense_vector',
                dims: 768, // Dimension size for Gemini embedding-001 model
                index: true,
                similarity: 'cosine'
              },
              created_at: { type: 'date' },
              updated_at: { type: 'date' }
            }
          }
        }
      });
      
      console.log('Knowledge index created:', result);
      return true;
    } else {
      console.log('Knowledge index already exists');
      return true;
    }
  } catch (error) {
    console.error('Error creating knowledge index:', error);
    return false;
  }
};

/**
 * Generate real embeddings using Google Gemini Embedding API
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
  // In a real app, you would use an actual embedding model API
  const seed = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Create a vector of dimension 768 (common for many embedding models)
  return Array.from({ length: 768 }, (_, i) => {
    // Generate a value between -1 and 1 that's seeded by both the text and position
    const val = Math.sin(seed * (i + 1) * 0.001) * 0.5 + Math.cos(i * 0.01) * 0.5;
    return parseFloat(val.toFixed(6)); // Limit decimal places to save space
  });
};

/**
 * Generate sample knowledge base data with embeddings
 */
const generateSampleKnowledgeData = async () => {
  const sampleDocs = [
    {
      title: 'Hướng dẫn sử dụng chatbot AI',
      content: 'Chatbot AI của chúng tôi có thể trả lời các câu hỏi thường gặp, hỗ trợ đặt hàng, và giải quyết các vấn đề kỹ thuật cơ bản. Để bắt đầu, bạn chỉ cần nhập câu hỏi vào ô chat và hệ thống sẽ phản hồi trong vài giây.',
      section: 'Giới thiệu',
      source: 'product_documentation',
      category: 'chatbot',
      language: 'vi'
    },
    {
      title: 'Cách đặt lại mật khẩu',
      content: 'Để đặt lại mật khẩu, vui lòng truy cập trang đăng nhập và nhấp vào "Quên mật khẩu". Nhập email đã đăng ký của bạn và làm theo hướng dẫn được gửi đến email để tạo mật khẩu mới. Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.',
      section: 'Bảo mật tài khoản',
      source: 'help_center',
      category: 'account',
      language: 'vi'
    },
    {
      title: 'Chính sách hoàn tiền',
      content: 'Chúng tôi cung cấp chính sách hoàn tiền đầy đủ trong vòng 30 ngày kể từ ngày mua hàng. Để yêu cầu hoàn tiền, vui lòng liên hệ với bộ phận hỗ trợ khách hàng và cung cấp số đơn hàng của bạn. Hoàn tiền sẽ được xử lý trong vòng 5-7 ngày làm việc.',
      section: 'Chính sách',
      source: 'terms_of_service',
      category: 'billing',
      language: 'vi'
    },
    {
      title: 'Tích hợp Google Gemini với hệ thống',
      content: 'Google Gemini có thể được tích hợp với hệ thống của bạn thông qua API chính thức. Bạn cần đăng ký API key trên Google Cloud Console, sau đó sử dụng thư viện client để gửi yêu cầu. Gemini hỗ trợ nhiều tính năng như sinh văn bản, phân tích hình ảnh, và tạo embeddings cho tìm kiếm ngữ nghĩa.',
      section: 'Tích hợp API',
      source: 'developer_docs',
      category: 'integration',
      language: 'vi'
    },
    {
      title: 'Cách sử dụng RAG với Elasticsearch',
      content: 'Retrieval Augmented Generation (RAG) kết hợp khả năng tìm kiếm thông tin với mô hình ngôn ngữ lớn. Để triển khai RAG với Elasticsearch, bạn cần lưu trữ văn bản và vector embeddings, thực hiện tìm kiếm vector khi có query, rồi truyền kết quả tìm kiếm cùng với câu hỏi gốc vào mô hình như Google Gemini để tạo câu trả lời có bối cảnh.',
      section: 'Hướng dẫn kỹ thuật',
      source: 'developer_docs',
      category: 'search',
      language: 'vi'
    },
    {
      title: 'Xử lý lỗi kết nối Elasticsearch',
      content: 'Khi gặp lỗi kết nối đến Elasticsearch, hãy kiểm tra các điểm sau: 1) Elasticsearch đang chạy và có thể truy cập từ máy chủ ứng dụng, 2) Thông tin xác thực API chính xác, 3) Cấu hình mạng cho phép kết nối đến cổng Elasticsearch (mặc định là 9200), 4) Cluster health đang ở trạng thái green hoặc yellow.',
      section: 'Xử lý sự cố',
      source: 'developer_docs',
      category: 'troubleshooting',
      language: 'vi'
    },
    {
      title: 'Sử dụng vector search trong Elasticsearch',
      content: 'Elasticsearch hỗ trợ tìm kiếm vector từ phiên bản 7.x trở lên với các cải tiến đáng kể trong phiên bản 8.x. Để sử dụng tính năng này, bạn cần định nghĩa trường kiểu dense_vector trong mapping, lưu trữ vector embeddings cho dữ liệu của bạn, và sử dụng KNN query hoặc script_score query để tìm kiếm dựa trên độ tương đồng vector.',
      section: 'Tính năng tìm kiếm',
      source: 'developer_docs',
      category: 'search',
      language: 'vi'
    },
    {
      title: 'Tối ưu hóa hiệu suất hệ thống RAG',
      content: 'Để tối ưu hóa hệ thống RAG, hãy xem xét: 1) Phân đoạn tài liệu thành các đoạn nhỏ có độ dài phù hợp, 2) Sử dụng kỹ thuật tăng cường truy vấn để cải thiện tìm kiếm, 3) Triển khai caching cho cả embeddings và kết quả tìm kiếm, 4) Sử dụng reranking để sắp xếp lại kết quả trước khi đưa vào LLM, 5) Theo dõi và đánh giá liên tục độ chính xác của hệ thống.',
      section: 'Hiệu suất',
      source: 'developer_docs',
      category: 'optimization',
      language: 'vi'
    },
    {
      title: 'Tạo embeddings với Google Gemini',
      content: 'Google Gemini cung cấp API tạo embeddings để chuyển đổi văn bản thành vector biểu diễn ngữ nghĩa. Để sử dụng, bạn cần gọi API embedTextEmbeddingGemini và truyền vào văn bản cần tạo embedding. Kết quả trả về là một vector số thực với số chiều tùy thuộc vào mô hình. Embeddings này có thể được lưu trữ trong Elasticsearch để tìm kiếm ngữ nghĩa.',
      section: 'API Reference',
      source: 'developer_docs',
      category: 'embedding',
      language: 'vi'
    },
    {
      title: 'Cấu trúc dữ liệu cho hệ thống RAG',
      content: 'Một hệ thống RAG hiệu quả cần thiết kế cấu trúc dữ liệu phù hợp. Mỗi đoạn văn bản nên có metadata đầy đủ như nguồn, ngày tạo, danh mục, và ngôn ngữ. Ngoài ra, việc lưu trữ cả văn bản gốc và vector embeddings trong cùng một tài liệu giúp đơn giản hóa quy trình tìm kiếm và truy xuất thông tin.',
      section: 'Thiết kế hệ thống',
      source: 'developer_docs',
      category: 'architecture',
      language: 'vi'
    }
  ];
  
  // Add embeddings and timestamps  return sampleDocs.map(async (doc, index) => {
    const now = new Date();
    const embedding = await generateGeminiEmbedding(doc.title + ' ' + doc.content);
    
    return {
      id: `doc-${index + 1}`,
      ...doc,
      embedding,
      created_at: new Date(now.getTime() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)),
      updated_at: now
    };
  });
};

/**
 * Index sample knowledge base data with embeddings
 */
const indexSampleKnowledgeData = async () => {
  try {
    const sampleDocs = generateSampleKnowledgeData();
    console.log(`Generated ${sampleDocs.length} sample knowledge documents. Indexing to Elasticsearch...`);
    
    // Prepare bulk operations
    const operations = sampleDocs.flatMap(doc => [
      { index: { _index: 'knowledge_base', _id: doc.id } },
      doc
    ]);
    
    const result = await elasticClient.bulk({ refresh: true, operations });
    
    console.log('Bulk indexing complete:');
    console.log(`- ${result.items.length} items processed`);
    console.log(`- Took ${result.took}ms`);
    console.log(`- Errors: ${result.errors ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.error('Error indexing sample knowledge data:', error);
    return false;
  }
};

/**
 * Perform a keyword search (traditional full-text search)
 */
const performKeywordSearch = async (query, size = 3) => {
  try {
    const result = await elasticClient.search({
      index: 'knowledge_base',
      body: {
        query: {
          multi_match: {
            query,
            fields: ['title^2', 'content', 'section'],
            fuzziness: 'AUTO'
          }
        },
        highlight: {
          fields: {
            title: {},
            content: {}
          }
        },
        size
      }
    });
    
    console.log(`\nTraditional keyword search results for "${query}":`);
    console.log(`- Total hits: ${result.hits.total.value}`);
    console.log('- Top results:');
    
    result.hits.hits.forEach((hit, i) => {
      console.log(`  ${i + 1}. ${hit._source.title} (Score: ${hit._score.toFixed(2)})`);
      if (hit.highlight) {
        Object.entries(hit.highlight).forEach(([field, highlights]) => {
          console.log(`     - ${field}: ${highlights.join(' ... ')}`);
        });
      }
    });
    
    return result.hits.hits;
  } catch (error) {
    console.error('Error performing keyword search:', error);
    return [];
  }
};

/**
 * Perform a vector search using embeddings
 */
const performVectorSearch = async (queryText, size = 3) => {
  try {
    // In a real application, you would get this from the embedding API
    const queryVector = generateMockEmbedding(queryText);
    
    const result = await elasticClient.search({
      index: 'knowledge_base',
      body: {
        query: {
          script_score: {
            query: { match_all: {} },
            script: {
              source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
              params: { query_vector: queryVector }
            }
          }
        },
        size
      }
    });
    
    console.log(`\nVector search results for "${queryText}":`);
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
  } catch (error) {
    console.error('Error performing vector search:', error);
    return [];
  }
};

/**
 * Compare keyword search and vector search results for a given query
 */
const compareSearchMethods = async (query) => {
  console.log(`\n=== Comparing search methods for query: "${query}" ===`);
  
  // Run both search methods
  const keywordResults = await performKeywordSearch(query);
  const vectorResults = await performVectorSearch(query);
  
  // Compare results
  const keywordIds = new Set(keywordResults.map(hit => hit._id));
  const vectorIds = new Set(vectorResults.map(hit => hit._id));
  
  const commonIds = [...keywordIds].filter(id => vectorIds.has(id));
  
  console.log('\nComparison summary:');
  console.log(`- Keyword search found ${keywordIds.size} results`);
  console.log(`- Vector search found ${vectorIds.size} results`);
  console.log(`- ${commonIds.length} results appear in both searches`);
  
  if (commonIds.length > 0) {
    console.log('- Common results:');
    commonIds.forEach(id => {
      const keywordResult = keywordResults.find(hit => hit._id === id);
      console.log(`  • ${keywordResult._source.title}`);
    });
  }
  
  return {
    keywordResults,
    vectorResults,
    commonIds
  };
};

/**
 * Simulate a RAG process with retrieved documents
 */
const simulateRagProcess = async (userQuery) => {
  console.log(`\n=== Simulating RAG process for query: "${userQuery}" ===`);
  
  // Step 1: Retrieve relevant documents using vector search
  console.log('\nStep 1: Retrieving relevant documents...');
  const vectorResults = await performVectorSearch(userQuery, 3);
  
  if (vectorResults.length === 0) {
    console.log('No relevant documents found. Returning generic response.');
    return {
      answer: 'Tôi không có đủ thông tin để trả lời câu hỏi này. Vui lòng thử lại với câu hỏi khác.',
      sources: []
    };
  }
  
  // Step 2: Format retrieved contexts
  console.log('\nStep 2: Formatting contexts for the LLM...');
  const contexts = vectorResults.map(hit => ({
    content: hit._source.content,
    title: hit._source.title,
    source: hit._source.source,
    id: hit._id
  }));
  
  contexts.forEach((ctx, i) => {
    console.log(`Context ${i+1}: ${ctx.title} (${ctx.source})`);
  });
  
  // Step 3: In a real application, you would send the query and contexts to Gemini
  // Here we'll simulate the response
  console.log('\nStep 3: Generating answer with Gemini (simulated)...');
  
  // Simple simulation of answer generation
  let simulatedAnswer = `Dựa trên thông tin có sẵn, `;
  
  if (userQuery.toLowerCase().includes('rag') || userQuery.toLowerCase().includes('retrieval')) {
    simulatedAnswer += 'Retrieval Augmented Generation (RAG) là kỹ thuật kết hợp khả năng tìm kiếm thông tin với mô hình ngôn ngữ lớn. Để triển khai RAG hiệu quả, bạn cần lưu trữ văn bản và vector embeddings, thực hiện tìm kiếm vector khi có query, và truyền kết quả tìm kiếm cùng với câu hỏi vào mô hình như Google Gemini.';
  } else if (userQuery.toLowerCase().includes('elastic') || userQuery.toLowerCase().includes('tìm kiếm')) {
    simulatedAnswer += 'Elasticsearch hỗ trợ tìm kiếm vector từ phiên bản 7.x trở lên. Để sử dụng tính năng này, bạn cần định nghĩa trường kiểu dense_vector trong mapping, lưu trữ vector embeddings cho dữ liệu, và sử dụng KNN query hoặc script_score query để tìm kiếm dựa trên độ tương đồng vector.';
  } else if (userQuery.toLowerCase().includes('gemini') || userQuery.toLowerCase().includes('google')) {
    simulatedAnswer += 'Google Gemini có thể được tích hợp với hệ thống của bạn thông qua API chính thức. Bạn cần đăng ký API key, sau đó sử dụng thư viện client để gửi yêu cầu. Gemini hỗ trợ nhiều tính năng như sinh văn bản, phân tích hình ảnh, và tạo embeddings cho tìm kiếm ngữ nghĩa.';
  } else {
    simulatedAnswer += 'tôi có thể cung cấp thông tin về cách triển khai hệ thống RAG với Elasticsearch và Google Gemini. Hệ thống này kết hợp tìm kiếm ngữ nghĩa dựa trên vector embeddings với khả năng sinh văn bản của mô hình ngôn ngữ lớn để tạo ra câu trả lời chính xác và phù hợp với ngữ cảnh.';
  }
  
  console.log('\nSimulated Gemini response:');
  console.log(simulatedAnswer);
  
  // Step 4: Return the result with source attribution
  console.log('\nStep 4: Returning final answer with sources...');
  
  return {
    answer: simulatedAnswer,
    sources: contexts.map(ctx => ({
      title: ctx.title,
      id: ctx.id
    }))
  };
};

/**
 * Run the Elasticsearch RAG test
 */
const runElasticsearchRagTest = async () => {
  console.log('Starting Elasticsearch RAG test...');
  
  // Check Elasticsearch health
  const health = await checkElasticsearchHealth();
  if (!health) {
    console.error('Elasticsearch is not available. Please ensure Elasticsearch is running.');
    console.error('You can install Elasticsearch using Docker:');
    console.error('docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:8.6.0');
    return;
  }
  
  // Create knowledge base index with vector capabilities
  const indexCreated = await createKnowledgeIndex();
  if (!indexCreated) {
    console.error('Failed to create index. Exiting test.');
    return;
  }
  
  // Index sample knowledge data with embeddings
  await indexSampleKnowledgeData();
  
  // Test different search methods with various queries
  console.log('\n=== Testing different search methods ===');
  
  await compareSearchMethods('cách đặt lại mật khẩu');
  await compareSearchMethods('tích hợp Gemini');
  await compareSearchMethods('elasticsearch vector search');
  
  // Simulate a complete RAG process
  console.log('\n=== Simulating complete RAG process ===');
  
  const queries = [
    'Làm thế nào để triển khai RAG với Elasticsearch?',
    'Cách tạo embedding với Google Gemini?',
    'Tôi gặp lỗi kết nối Elasticsearch, phải làm sao?'
  ];
  
  for (const query of queries) {
    await simulateRagProcess(query);
  }
  
  console.log('\n=== Elasticsearch RAG test completed ===');
  
  // Close connection
  await elasticClient.close();
  console.log('Test finished and connections closed.');
};

// Run the test if this file is executed directly
if (require.main === module) {
  runElasticsearchRagTest().catch(err => {
    console.error('Error running Elasticsearch RAG test:', err);
    process.exit(1);
  });
}

// Export functions for use in other modules
module.exports = {
  elasticClient,
  createKnowledgeIndex,
  indexSampleKnowledgeData,
  performKeywordSearch,
  performVectorSearch,
  compareSearchMethods,
  simulateRagProcess
};
