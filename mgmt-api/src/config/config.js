require('dotenv').config();

module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_chat365'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  server: {
    port: process.env.PORT || 4000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  admin: {
    defaultEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
    defaultPassword: process.env.ADMIN_PASSWORD || 'adminPassword123'
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'password'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'your_gemini_api_key',
  }
};
