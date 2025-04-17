require('dotenv').config();

const fs = require('fs');
const path = require('path');

// Read RSA keys
const privateKeyPath = path.join(__dirname, 'keys', 'private.key');
const publicKeyPath = path.join(__dirname, 'keys', 'public.key');

// Read keys or use defaults for development
let privateKey, publicKey;
try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  publicKey = fs.readFileSync(publicKeyPath, 'utf8');
} catch (error) {
  console.warn('Warning: RSA keys not found, using default JWT secret');
}

module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_chat365'
  },
  jwt: {
    privateKey: privateKey,
    publicKey: publicKey,
    algorithm: 'RS256',
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
