require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const config = require('./src/config/config');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const tagRoutes = require('./src/routes/tagRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');

// Import middleware
const { authenticate } = require('./src/middleware/auth');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.server.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to Redis for Socket.IO with fallback mechanism
const setupRedis = async () => {
  try {
    const pubClient = createClient({ url: config.redis.url });
    const subClient = pubClient.duplicate();
  
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Socket.IO connected to Redis adapter');
    
    // Setup Redis error handling and reconnection
    pubClient.on('error', (err) => {
      console.error('Redis pub client error:', err);
    });
    
    subClient.on('error', (err) => {
      console.error('Redis sub client error:', err);
    });
    
    return true;
  } catch (err) {
    console.error('Failed to connect to Redis, using in-memory adapter:', err);
    return false;
  }
};

// Import socket authentication middleware
const socketService = require('./src/services/socketService');

// Middleware
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB with retry mechanism
const connectMongoDB = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(config.mongodb.uri, {
        // MongoDB connection options
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('Connected to MongoDB');
      return true;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('Failed to connect to MongoDB after multiple attempts');
  return false;
};

// Initialize server
const initializeServer = async () => {
  // Connect to MongoDB
  const dbConnected = await connectMongoDB();
  if (!dbConnected) {
    console.error('Server initialization failed: Could not connect to MongoDB');
    process.exit(1);
  }
  
  // Setup Redis for Socket.IO
  await setupRedis();
  
  // Apply authentication middleware to all socket connections
  io.use(socketService.authenticateSocket);
    // Make io instance available to routes
  app.set('io', io);  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', authenticate, adminRoutes);
  app.use('/api/chats', authenticate, chatRoutes);
  app.use('/api/tags', authenticate, tagRoutes);
  app.use('/api/categories', authenticate, categoryRoutes);
  app.use('/api/users', authenticate, require('./src/routes/userRoutes'));
  app.use('/api/url-metadata', require('./src/routes/urlMetadataRoutes'));
    // Socket.IO connections
  io.on('connection', (socket) => {
    socketService.handleSocket(socket);
    
    // If the socket is authenticated as an admin, listen for global events
    if (socket.admin) {
      // By default, have all admins join the agent-dashboard room
      socket.join('agent-dashboard');
      console.log(`Admin ${socket.admin._id} automatically joined agent-dashboard room`);
    }
  });
  
  // Set up the forwarding of new_user_message events from end-user API to all admins
  // This handler receives the event from the end-user API through Redis adapter
  io.of('/').adapter.on('message', (channel, message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'new_user_message') {
        // Forward the message to all admins in the agent-dashboard room
        // console.log('Forwarding new_user_message event to agent-dashboard');
        // io.to('agent-dashboard').emit('new_user_message', parsedMessage.data);
      }
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'up',
      time: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Error handler middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  });

  // Start server
  const PORT = config.server.port;
  server.listen(PORT, () => {
    console.log(`Management API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });
};

// Start the server
initializeServer();

module.exports = { app, server, io };
