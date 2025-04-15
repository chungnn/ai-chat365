const dotenv = require('dotenv');
const connectDB = require('./src/config/database');
const { initializeApp, setupServer, configureRoutes } = require('./src/config/server');
const { setupRedisAdapter } = require('./src/services/redisService');
const { initializeSocketService } = require('./src/services/socketService');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize express app
const app = initializeApp();

// Setup HTTP server and Socket.IO
const { server, io } = setupServer(app);

// Make io accessible to our routes
app.set('io', io);

// Initialize Redis adapter before starting the server
(async () => {
  const redisResult = await setupRedisAdapter(io);
  console.log(`[SOCKET DEBUG] Redis adapter setup ${redisResult.success ? 'successful' : 'failed'}`);

  if (!redisResult.success) {
    console.log('[SOCKET DEBUG] WARNING: Using in-memory adapter. This is not recommended for production with multiple instances.');
    console.log('[SOCKET DEBUG] Messages across different server instances will not be synchronized.');
  } else {
    // Store redis clients in app context
    app.set('redisPubClient', redisResult.pubClient);
    app.set('redisSubClient', redisResult.subClient);
  }
  
  // Initialize Socket.IO service
  initializeSocketService(io);
})();

// Configure all routes
configureRoutes(app);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };