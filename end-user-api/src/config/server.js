const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const languageMiddleware = require('../middleware/language');

/**
 * Initialize the Express application with required middleware
 * @returns {Object} Express app instance
 */
const initializeApp = () => {
  // Initialize express app
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Apply language detection middleware globally
  app.use(languageMiddleware);

  return app;
};

/**
 * Set up HTTP server and Socket.IO
 * @param {Object} app - Express app instance
 * @returns {Object} Object containing server and Socket.IO instance
 */
const setupServer = (app) => {
  // Create HTTP server
  const server = http.createServer(app);
  
  // Initialize Socket.IO with CORS settings
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:8080",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  return { server, io };
};

/**
 * Configure all routes for the application
 * @param {Object} app - Express app instance
 */
const configureRoutes = (app) => {  // Routes  
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/chat', require('../routes/chatRoutes'));
  app.use('/api/url-metadata', require('../routes/urlMetadataRoutes'));
  app.use('/api/ticket', require('../routes/ticketRoutes'));
  app.use('/api/language', require('../routes/languageRoutes'));

  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to AI Sales Assistant API' });
  });

  // Error handler middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  });
};

module.exports = {
  initializeApp,
  setupServer,
  configureRoutes
};
