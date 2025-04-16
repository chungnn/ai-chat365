/**
 * Test file for Elasticsearch integration
 * This file provides basic examples of how to connect to Elasticsearch,
 * create indexes, add documents, and perform searches without MongoDB dependency.
 */

require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');

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

// Create chat index (if it doesn't exist)
const createChatIndex = async () => {
  try {
    const indexExists = await elasticClient.indices.exists({ index: 'chats' });
    
    if (!indexExists) {
      const result = await elasticClient.indices.create({
        index: 'chats',
        body: {
          mappings: {
            properties: {
              sessionId: { type: 'keyword' },
              userId: { type: 'keyword' },
              userName: { type: 'text' },
              userEmail: { type: 'keyword' },
              userPhone: { type: 'keyword' },
              messages: {
                type: 'nested',
                properties: {
                  role: { type: 'keyword' },
                  content: { type: 'text' },
                  timestamp: { type: 'date' }
                }
              },
              status: { type: 'keyword' },
              priority: { type: 'keyword' },
              isTransferredToAgent: { type: 'boolean' },
              isAgentResolved: { type: 'boolean' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              metadata: {
                properties: {
                  intent: { type: 'keyword' },
                  topics: { type: 'keyword' }
                }
              }
            }
          }
        }
      });
      
      console.log('Chat index created:', result);
      return true;
    } else {
      console.log('Chat index already exists');
      return true;
    }
  } catch (error) {
    console.error('Error creating chat index:', error);
    return false;
  }
};

// Index chat data from MongoDB to Elasticsearch
const indexSampleChatData = async () => {
  try {
    // Create sample chat data
    const sampleChats = generateSampleChats(10);
    
    console.log(`Generated ${sampleChats.length} sample chats. Indexing to Elasticsearch...`);
    
    // Prepare bulk operations
    const operations = sampleChats.flatMap(chat => {
      return [
        { index: { _index: 'chats', _id: chat.id } },
        chat
      ];
    });
    
    if (operations.length > 0) {
      const result = await elasticClient.bulk({ refresh: true, operations });
      
      console.log('Bulk indexing complete:');
      console.log(`- ${result.items.length} items processed`);
      console.log(`- Took ${result.took}ms`);
      console.log(`- Errors: ${result.errors ? 'Yes' : 'No'}`);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error indexing sample chat data:', error);
    return false;
  }
};

// Perform a simple search
const searchChats = async (query) => {
  try {
    const result = await elasticClient.search({
      index: 'chats',
      body: {
        query: {
          multi_match: {
            query: query,
            fields: [
              'userName^2',
              'userEmail^2',
              'userPhone^2',
              'messages.content',
              'metadata.intent',
              'metadata.topics'
            ]
          }
        },
        highlight: {
          fields: {
            'messages.content': {},
            'userName': {},
            'userEmail': {},
            'userPhone': {}
          }
        },
        sort: [
          { createdAt: { order: 'desc' } }
        ]
      }
    });
    
    console.log(`Search results for "${query}":`);
    console.log(`- Total hits: ${result.hits.total.value}`);
    console.log('- Results:');
    
    result.hits.hits.forEach((hit, i) => {
      console.log(`  ${i + 1}. ${hit._source.userName} (${hit._source.sessionId})`);
      if (hit.highlight) {
        Object.entries(hit.highlight).forEach(([field, highlights]) => {
          console.log(`     - ${field}: ${highlights.join(' ... ')}`);
        });
      }
    });
    
    return result.hits.hits;
  } catch (error) {
    console.error('Error searching chats:', error);
    return [];
  }
};

// Generate sample chat data
const generateSampleChats = (count = 10) => {
  const users = [
    { name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0912345678' },
    { name: 'Trần Thị B', email: 'tranthib@example.com', phone: '0923456789' },
    { name: 'Lê Văn C', email: 'levanc@example.com', phone: '0934567890' },
    { name: 'Phạm Thị D', email: 'phamthid@example.com', phone: '0945678901' },
    { name: 'Hoàng Văn E', email: 'hoangvane@example.com', phone: '0956789012' }
  ];
  
  const intents = ['general_inquiry', 'technical_support', 'billing_question', 'complaint', 'feature_request'];
  const topics = ['account', 'payment', 'product', 'website', 'app', 'delivery', 'refund'];
  const statuses = ['open', 'in-progress', 'waiting', 'resolved', 'closed'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  
  const sampleMessages = [
    { content: 'Tôi cần hỗ trợ về sản phẩm của bạn', type: 'user' },
    { content: 'Tôi không thể đăng nhập vào tài khoản của mình', type: 'user' },
    { content: 'Làm thế nào để tôi thay đổi mật khẩu?', type: 'user' },
    { content: 'Tôi muốn biết thêm về dịch vụ khách hàng của bạn', type: 'user' },
    { content: 'Chất lượng sản phẩm không như mong đợi', type: 'user' },
    { content: 'Tôi có thể giúp gì cho bạn?', type: 'assistant' },
    { content: 'Vui lòng cung cấp thêm thông tin về vấn đề của bạn', type: 'assistant' },
    { content: 'Chúng tôi đang kiểm tra vấn đề này', type: 'assistant' },
    { content: 'Tôi xin lỗi vì sự bất tiện này', type: 'assistant' },
    { content: 'Cảm ơn bạn đã liên hệ với chúng tôi', type: 'assistant' },
    { content: 'Đây là bộ phận hỗ trợ kỹ thuật, tôi có thể giúp gì cho bạn?', type: 'agent' },
    { content: 'Tôi là nhân viên tư vấn, tôi sẽ giúp bạn giải quyết vấn đề', type: 'agent' },
    { content: 'Vui lòng chờ trong giây lát', type: 'agent' }
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const user = users[Math.floor(Math.random() * users.length)];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const selectedTopics = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
      topics[Math.floor(Math.random() * topics.length)]
    ).filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    
    const isTransferredToAgent = Math.random() > 0.5;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    // Generate 3-8 messages per chat
    const messageCount = Math.floor(Math.random() * 6) + 3;
    const messages = [];
    
    // Always start with a user message
    const firstMessage = { ...sampleMessages.find(m => m.type === 'user') };
    firstMessage.role = 'user';
    firstMessage.content = sampleMessages.filter(m => m.type === 'user')
      [Math.floor(Math.random() * sampleMessages.filter(m => m.type === 'user').length)].content;
    firstMessage.timestamp = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
    messages.push(firstMessage);
    
    // Add remaining messages
    for (let j = 1; j < messageCount; j++) {
      let role;
      if (j === 1) {
        role = 'assistant'; // Second message is always from assistant
      } else if (isTransferredToAgent && j > 2 && Math.random() > 0.5) {
        role = 'agent'; // Add some agent messages if transferred
      } else {
        role = ['user', 'assistant'][Math.floor(Math.random() * 2)];
      }
      
      const message = {
        role,
        content: sampleMessages.filter(m => m.type === role || (role === 'agent' && m.type === 'agent'))
          [Math.floor(Math.random() * sampleMessages.filter(m => m.type === role || (role === 'agent' && m.type === 'agent')).length)].content,
        timestamp: new Date(new Date(messages[j-1].timestamp).getTime() + Math.floor(Math.random() * 60 * 60 * 1000))
      };
      
      if (role === 'agent') {
        message.agentId = `agent-${Math.floor(Math.random() * 100) + 1}`;
        message.agentName = `Agent ${Math.floor(Math.random() * 10) + 1}`;
      }
      
      messages.push(message);
    }
    
    const now = new Date();
    const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * (now.getTime() - createdAt.getTime())));
    
    return {
      id: `chat-${i+1}`,
      sessionId: `session-${Date.now()}-${i}`,
      userId: `user-${Math.floor(Math.random() * 1000) + 1}`,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      status,
      priority,
      isTransferredToAgent,
      isAgentResolved: isTransferredToAgent && Math.random() > 0.5,
      createdAt,
      updatedAt,
      messages,
      metadata: {
        intent,
        topics: selectedTopics,
        source: 'website',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        ipAddress: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
        referrer: ['google.com', 'facebook.com', 'direct', 'bing.com'][Math.floor(Math.random() * 4)]
      }
    };
  });
};

// Main test function
const runElasticsearchTest = async () => {
  console.log('Starting Elasticsearch test...');
  
  // Check Elasticsearch health
  const health = await checkElasticsearchHealth();
  if (!health) {
    console.error('Elasticsearch is not available. Please ensure Elasticsearch is running.');
    console.error('You can install Elasticsearch using Docker:');
    console.error('docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.17.0');
    return;
  }
  
  // Create chat index
  const indexCreated = await createChatIndex();
  if (!indexCreated) {
    console.error('Failed to create index. Exiting test.');
    return;
  }
  
  // Index sample data
  await indexSampleChatData();
  
  // Test search with different queries
  console.log('\n--- Testing basic search ---');
  await searchChats('hỗ trợ');
  
  console.log('\n--- Testing specific query on user info ---');
  await searchChats('Nguyễn');
  
  console.log('\n--- Testing search for technical issues ---');
  await searchChats('đăng nhập');
  
  console.log('\n--- Testing search for agent messages ---');
  await searchChats('sản phẩm');
  
  console.log('\n--- Elasticsearch test completed ---');
  
  // Close connection
  await elasticClient.close();
  console.log('Test finished and connections closed.');
};

// Run the test if this file is executed directly
if (require.main === module) {
  runElasticsearchTest().catch(err => {
    console.error('Error running Elasticsearch test:', err);
    process.exit(1);
  });
}

// Export functions for use in other modules
module.exports = {
  elasticClient,
  createChatIndex,
  indexSampleChatData,
  searchChats,
  checkElasticsearchHealth
};
