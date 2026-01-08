import { getRedisClient, isRedisAvailable } from '../config/redis.js';

/**
 * Cache utility with Redis
 * Falls back gracefully if Redis is not available
 */

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached data or null
 */
export async function getCache(key) {
  if (!isRedisAvailable()) return null;

  try {
    const client = getRedisClient();
    const data = await client.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null;
  }
}

/**
 * Set cache data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} Success status
 */
export async function setCache(key, data, ttl = 300) {
  if (!isRedisAvailable()) return false;

  try {
    const client = getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Cache set error:', error.message);
    return false;
  }
}

/**
 * Delete cache by key or pattern
 * @param {string} keyOrPattern - Cache key or pattern (e.g., 'items:*')
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCache(keyOrPattern) {
  if (!isRedisAvailable()) return false;

  try {
    const client = getRedisClient();
    
    // If pattern includes *, delete all matching keys
    if (keyOrPattern.includes('*')) {
      const keys = await client.keys(keyOrPattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } else {
      await client.del(keyOrPattern);
    }
    return true;
  } catch (error) {
    console.error('Cache delete error:', error.message);
    return false;
  }
}

/**
 * Clear all cache
 * @returns {Promise<boolean>} Success status
 */
export async function clearCache() {
  if (!isRedisAvailable()) return false;

  try {
    const client = getRedisClient();
    await client.flushDb();
    console.log('✅ Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Cache clear error:', error.message);
    return false;
  }
}

/**
 * Generate cache key for items listing
 * @param {string} emailDomain 
 * @param {number} page 
 * @param {string} search 
 * @returns {string}
 */
export function generateItemsCacheKey(emailDomain, page, search = '') {
  const searchPart = search ? `:search:${search}` : '';
  return `items:${emailDomain}:page:${page}${searchPart}`;
}

/**
 * Generate cache key for user data
 * @param {string} userId 
 * @returns {string}
 */
export function generateUserCacheKey(userId) {
  return `user:${userId}`;
}

/**
 * Generate cache key for token balance
 * @param {string} userId 
 * @returns {string}
 */
export function generateTokenCacheKey(userId) {
  return `tokens:${userId}`;
}

/**
 * Invalidate all cache for a specific email domain
 * @param {string} emailDomain 
 * @returns {Promise<boolean>}
 */
export async function invalidateDomainCache(emailDomain) {
  return await deleteCache(`items:${emailDomain}:*`);
}
