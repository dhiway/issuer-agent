import { createClient } from 'redis';

const { REDIS_URL } = process.env;

console.log(`Connecting to Redis at ${REDIS_URL}`);

const client = createClient({ url: REDIS_URL });

client.on('error', (err: any) => {
  console.error('Redis error:', err);
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Redis');
  } catch (e) {
    console.error('❌ Failed to connect to Redis:', e);
  }
})();

export default client;
