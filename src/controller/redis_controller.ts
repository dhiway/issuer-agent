import client from "../redis_client";

const { REDIS_TIMEOUT } = process.env;

export async function getOrSetCache(
  key: string,
  cb: () => Promise<any>,
  expiresInSeconds: number
) {
  try {
    // Check if data is in cache
    const cachedData = await client.get(key);
    if (cachedData) {
      console.log(`Using chached data for ${key}`);
      await client.incr('cache_hits');
      return JSON.parse(cachedData);
    }

    await client.incr('cache_misses');
    // Fetch fresh data if not in cache
    console.log(`Fetching fresh data for ${key}`);
    const freshData = await cb();
    await client.setEx(key, expiresInSeconds, JSON.stringify(freshData));
    return freshData;
  } catch (error) {
    console.error('Error accessing Redis cache:', error);
    throw error;
  }
}

export async function cacheUserData(
  key: string,
  fetchFunction: () => Promise<any>,
  expiresInSeconds?: number
) {
  const expiration = expiresInSeconds ?? parseInt(REDIS_TIMEOUT || '1800', 10);
  return await getOrSetCache(`key:${key}`, fetchFunction, expiration);
}

export async function updateRedisCache<T>(key: string, data: T) {
  try {
    await client.setEx(
      `key:${key}`,
      REDIS_TIMEOUT as any,
      JSON.stringify(data)
    );
    console.log(`Redis cache updated for key: ${key}`);
  } catch (error) {
    console.error(`Failed to update Redis cache for key: ${key}`, error);
  }
}
