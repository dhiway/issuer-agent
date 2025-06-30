import express from 'express';
import { dataSource } from './dbconfig';
import app from './server';

import {
  createProfile,
  getCacheStats,
  getProfile,
} from './controller/profile_controller';
import { checkDidAndIdentities } from './cord';
import { createRegistry, getRegistry } from './controller/registry_controller';
import { getCredById, issueVC, updateCred } from './controller/credential_controller';

const { PORT } = process.env;

// const didRouter = express.Router({ mergeParams: true });
// const docRouter = express.Router({ mergeParams: true });
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

// credentialRouter.post('/revoke/:id', async (req, res) => {
//   return await revokeCred(req, res);
// });

// didRouter.post('/create', async (req, res) => {
//   return await generateDid(req, res);
// });

// docRouter.post('/issue', async (req, res) => {
//   return await documentHashOnChain(req, res);
// });

// docRouter.post('/revoke', async (req, res) => {
//   return await revokeDocumentHashOnChain(req, res);
// });

// docRouter.put('/update', async (req, res) => {
//   return await updateDocumentHashOnChain(req, res);
// });

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

// app.use('/api/v1/did', didRouter);
// app.use('/api/v1/doc-hash', docRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/registry', registryRouter);
app.use('/api/v1/cred', credentialRouter);

// app.get('/:id/did.json', async (req, res) => {
//   return await resolveDid(req, res);
// });

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
