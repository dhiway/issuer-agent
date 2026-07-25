import { dataSource } from './dbconfig';
import { checkDidAndIdentities } from './cord';
import { ensureRedisConnected } from './redis_client';

let bootstrapPromise: Promise<void> | undefined;

async function initializeDataSource() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
}

export async function bootstrapApplication() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await initializeDataSource();
      await ensureRedisConnected();
      await checkDidAndIdentities();
    })().catch((error) => {
      bootstrapPromise = undefined;
      throw error;
    });
  }

  return bootstrapPromise;
}
