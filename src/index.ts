import express from 'express';
import { dataSource } from './dbconfig';
import app from './server';
import os from 'os';
import cluster from 'cluster';

import {
  createProfile,
  getCacheStats,
  getProfile,
} from './controller/profile_controller';
import { checkDidAndIdentities } from './cord';
import { createRegistry, getRegistry } from './controller/registry_controller';
import {
  issueVC,
  getCredById,
  updateCred,
  revokeCred,
} from './controller/credential_controller';

const { PORT } = process.env;

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const profileRouter = express.Router({ mergeParams: true });
  const registryRouter = express.Router({ mergeParams: true });
  const credentialRouter = express.Router({ mergeParams: true });

  credentialRouter.post('/', async (req, res) => {
    return await issueVC(req, res);
  });

  credentialRouter.get('/:id', async (req, res) => {
    return await getCredById(req, res);
  });

  credentialRouter.put('/update', async (req, res) => {
    return await updateCred(req, res);
  });

  credentialRouter.post('/revoke', async (req, res) => {
    return await revokeCred(req, res);
  });

  profileRouter.post('/create', async (req, res) => {
    return await createProfile(req, res);
  });

  profileRouter.get('/:address', async (req, res) => {
    return await getProfile(req, res);
  });

  profileRouter.get('/cache/stats', async (req, res) => {
    return await getCacheStats(req, res);
  });

  registryRouter.post('/create', async (req, res) => {
    return await createRegistry(req, res);
  });

  registryRouter.get('/:id', async (req, res) => {
    return await getRegistry(req, res);
  });

  app.use('/api/v1/profile', profileRouter);
  app.use('/api/v1/registry', registryRouter);
  app.use('/api/v1/cred', credentialRouter);

  app.use((_req, res) => {
    return res.json({
      message: 'check https://docs.dhiway.com/api for details of the APIs',
    });
  });

  async function main() {
    try {
      await dataSource.initialize();
      checkDidAndIdentities();
    } catch (error) {
      console.log('error: ', error);
      throw new Error('Main error');
    }

    app.listen(PORT || 3000, () => {
      console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
    });
  }

  main().catch((e) => console.log(e));
}
