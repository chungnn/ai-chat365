const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

/**
 * Set up Redis adapter for Socket.IO
 * @param {Object} io - The Socket.IO server instance
 * @returns {Promise<Object>} - Result of the Redis adapter setup
 */
const setupRedisAdapter = async (io) => {
  try {
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

    // Create Redis clients with improved options
    const pubClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff with max 10 seconds delay
          const delay = Math.min(1000 * Math.pow(2, retries), 10000);
          console.log(`[SOCKET DEBUG] Redis reconnecting in ${delay}ms...`);
          return delay;
        }
      }
    });

    const subClient = pubClient.duplicate();

    // Set up event handlers for both clients
    pubClient.on('error', (err) => {
      console.error('[SOCKET DEBUG] Redis pub client error:', err);
    });

    pubClient.on('connect', () => {
      console.log('[SOCKET DEBUG] Redis pub client connected');
    });

    pubClient.on('reconnecting', () => {
      console.log('[SOCKET DEBUG] Redis pub client reconnecting...');
    });

    subClient.on('error', (err) => {
      console.error('[SOCKET DEBUG] Redis sub client error:', err);
    });

    subClient.on('connect', () => {
      console.log('[SOCKET DEBUG] Redis sub client connected');
    });

    subClient.on('reconnecting', () => {
      console.log('[SOCKET DEBUG] Redis sub client reconnecting...');
    });

    // Connect to Redis
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Create and set the adapter
    const redisAdapter = createAdapter(pubClient, subClient);
    io.adapter(redisAdapter);

    console.log('[SOCKET DEBUG] Socket.IO successfully connected to Redis adapter');

    // Handle application shutdown properly
    process.on('SIGINT', async () => {
      console.log('[SOCKET DEBUG] Gracefully shutting down Redis connections...');
      await pubClient.quit();
      await subClient.quit();
      process.exit(0);
    });

    return {
      success: true,
      pubClient,
      subClient
    };
  } catch (err) {
    console.error('[SOCKET DEBUG] Failed to connect to Redis for Socket.IO, using in-memory adapter:', err);
    console.error('[SOCKET DEBUG] Error details:', err.message);
    return {
      success: false,
      error: err
    };
  }
};

module.exports = { setupRedisAdapter };
