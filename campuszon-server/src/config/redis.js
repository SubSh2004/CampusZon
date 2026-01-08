import { createClient } from 'redis';

let redisClient = null;
let isConnected = false;

/**
 * Connect to Redis Cloud (free tier compatible)
 * Falls back gracefully if Redis is not available
 */
export async function connectRedis() {
  // If Redis URL is not configured, skip Redis (app will work without caching)
  if (!process.env.REDIS_URL) {
    console.log('⚠️  Redis URL not configured - caching disabled (app will work without it)');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          // Give up after 3 retries
          if (retries > 3) {
            console.log('❌ Redis connection failed after 3 retries - continuing without cache');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('🔄 Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connected successfully');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('⚠️  Continuing without cache - app will work normally');
    return null;
  }
}

/**
 * Get Redis client instance
 * @returns {Object|null} Redis client or null if not connected
 */
export function getRedisClient() {
  return isConnected ? redisClient : null;
}

/**
 * Check if Redis is available and connected
 * @returns {boolean}
 */
export function isRedisAvailable() {
  return isConnected && redisClient !== null;
}

/**
 * Disconnect from Redis gracefully
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
}
