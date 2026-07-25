import { createClient } from 'redis';

const { REDIS_URL } = process.env;

const client = createClient({ url: REDIS_URL });
let redisConnectPromise: Promise<void> | undefined;

client.on('error', (err: any) => {
  console.error('Redis error:', err);
});

export async function ensureRedisConnected() {
  if (client.isOpen) {
    return;
  }

  if (!redisConnectPromise) {
    redisConnectPromise = client
      .connect()
      .then(() => {
        console.log('Connected to Redis');
      })
      .catch((error) => {
        redisConnectPromise = undefined;
        throw error;
      });
  }

  await redisConnectPromise;
}

export default client;
