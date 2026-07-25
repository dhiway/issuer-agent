import app from './server';
import { bootstrapApplication } from './bootstrap';
import { registerRoutes } from './routes';

const { PORT } = process.env;

async function main() {
  registerRoutes(app);
  await bootstrapApplication();

  app.listen(PORT || 3000, () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT || 3000}`);
  });
}

main().catch((error) => {
  console.error('Failed to start Dhiway gateway:', error);
  process.exit(1);
});
