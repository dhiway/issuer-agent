import express from 'express';
import cluster from 'node:cluster';
import os from 'node:os';

import { dataSource } from './dbconfig';
import { addDelegateAsRegistryDelegate, checkDidAndIdentities } from './init';
import { createSchema, getSchemaById } from './controller/schema_controller';
import {
  documentHashOnChain,
  getCredById,
  issueVC,
  revokeCred,
  updateCred,
} from './controller/credential_controller';
import {
  didNameNewCheck,
  generateDid,
  getDidDoc,
  resolveDid,
} from './controller/did_controller';
import app from './server';
import { studio_identity_init } from './identity/org';

const { PORT, MNEMONIC } = process.env;

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const credentialRouter = express.Router({ mergeParams: true });
  const schemaRouter = express.Router({ mergeParams: true });
  const didRouter = express.Router({ mergeParams: true });

  credentialRouter.post('/', async (req, res) => {
    return await issueVC(req, res);
  });

  credentialRouter.get('/:id', async (req, res) => {
    return await getCredById(req, res);
  });

  credentialRouter.put('/update/:id', async (req, res) => {
    return await updateCred(req, res);
  });

  credentialRouter.post('/revoke/:id', async (req, res) => {
    return await revokeCred(req, res);
  });

  schemaRouter.post('/', async (req, res) => {
    return await createSchema(req, res);
  });

  schemaRouter.get('/:id', async (req, res) => {
    return await getSchemaById(req, res);
  });

  didRouter.get('/didName/:id', async (req, res) => {
    return await didNameNewCheck(req, res);
  });

  didRouter.post('/create', async (req, res) => {
    return await generateDid(req, res);
  });

  didRouter.get('/didFetch/:id', async (req, res) => {
    return await getDidDoc(req, res);
  });

  didRouter.get('/didDoc/:id', async (req, res) => {
    return await resolveDid(req, res);
  });

  app.use('/api/v1/schema', schemaRouter);
  app.use('/api/v1/cred', credentialRouter);
  app.use('/api/v1/did', didRouter);

  app.post('/api/v1/docHash', async (req, res) => {
    return await documentHashOnChain(req, res);
  });

  app.get('/*', async (req, res) => {
    return res.json({
      message: 'check https://docs.dhiway.com/api for details of the APIs',
    });
  });

  async function main() {
    try {
      await dataSource.initialize();
      await studio_identity_init(MNEMONIC as string);
      // await addDelegateAsRegistryDelegate();
      await checkDidAndIdentities(MNEMONIC as string);
    } catch (error) {
      console.log('error: ', error);
      throw new Error('Main error');
    }

    app.listen(PORT, () => {
      console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
    });
  }

  main().catch((e) => console.log(e));
}
