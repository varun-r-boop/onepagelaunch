import { createClient } from 'redis';
import { BlockProjectData } from './types';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

// Get Redis client instance
export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
  }

  return redisClient;
}

// Cache project data in Redis
export async function cacheProject(slug: string, projectData: BlockProjectData, ttl: number = 3600) {
  try {
    const redis = await getRedisClient();
    const key = `project:${slug}`;
    
    // Store project data with TTL (default 1 hour)
    await redis.setEx(key, ttl, JSON.stringify(projectData));
    
    console.log(`Cached project data for slug: ${slug}`);
    return true;
  } catch (error) {
    console.error('Failed to cache project:', error);
    return false;
  }
}

// Get project data from Redis cache
export async function getCachedProject(slug: string): Promise<BlockProjectData | null> {
  try {
    const redis = await getRedisClient();
    const key = `project:${slug}`;
    
    const cachedData = await redis.get(key);
    
    if (!cachedData) {
      return null;
    }
    
    const projectData = JSON.parse(cachedData) as BlockProjectData;
    console.log(`Cache hit for slug: ${slug}`);
    return projectData;
  } catch (error) {
    console.error('Failed to get cached project:', error);
    return null;
  }
}

// Invalidate project cache
export async function invalidateProjectCache(slug: string) {
  try {
    const redis = await getRedisClient();
    const key = `project:${slug}`;
    
    await redis.del(key);
    console.log(`Invalidated cache for slug: ${slug}`);
    return true;
  } catch (error) {
    console.error('Failed to invalidate project cache:', error);
    return false;
  }
}

// Close Redis connection (useful for cleanup)
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
} 