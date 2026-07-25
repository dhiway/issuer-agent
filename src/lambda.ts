import serverlessExpress from '@codegenie/serverless-express';

import { bootstrapApplication } from './bootstrap';
import { registerRoutes } from './routes';
import app from './server';

let cachedHandler: ReturnType<typeof serverlessExpress> | undefined;

async function getHandler() {
  if (!cachedHandler) {
    registerRoutes(app);
    await bootstrapApplication();
    cachedHandler = serverlessExpress({ app });
  }

  return cachedHandler;
}

export const handler = async (event: any, context: any, callback: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const handler = await getHandler();
  return handler(event, context, callback);
};
