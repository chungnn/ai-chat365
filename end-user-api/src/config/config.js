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

const config = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/ai_chat365',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  jwt: {
    privateKey: privateKey,
    publicKey: publicKey,
    algorithm: 'RS256',
  },
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    password: process.env.EMAIL_PASSWORD || 'your-email-password',
    senderName: process.env.EMAIL_SENDER_NAME || 'AI Chat365',
  },
  
  // Gemini AI configuration
  geminiAI: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || '800'),
    topP: parseFloat(process.env.GEMINI_TOP_P || '0.95'),
    topK: parseInt(process.env.GEMINI_TOP_K || '40')
  },

  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'your-elastic-password',
  },
};

module.exports = config;