import express from 'express';

import {
  createProfile,
  getCacheStats,
  getProfile,
} from './controller/profile_controller';
import {
  createRegistry,
  getRegistry,
  listRegistriesByAddress,
} from './controller/registry_controller';
import {
  createPresentation,
  documentHashOnChain,
  getCredById,
  getCredentialsByRegistry,
  issueVC,
  revokeCred,
  revokeDocumentHashOnChain,
  updateCred,
  updateDocumentHashOnChain,
} from './controller/credential_controller';

let routesRegistered = false;

export function registerRoutes(app: express.Express) {
  if (routesRegistered) {
    return;
  }

  const profileRouter = express.Router({ mergeParams: true });
  const registryRouter = express.Router({ mergeParams: true });
  const credentialRouter = express.Router({ mergeParams: true });
  const docRouter = express.Router({ mergeParams: true });

  credentialRouter.post('/', async (req, res) => {
    return await issueVC(req, res);
  });

  credentialRouter.get('/list/:registryId', async (req, res) => {
    return await getCredentialsByRegistry(req, res);
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

  credentialRouter.post('/presentation', async (req, res) => {
    return await createPresentation(req, res);
  });

  profileRouter.get('/cache/stats', async (req, res) => {
    return await getCacheStats(req, res);
  });

  profileRouter.post('/create', async (req, res) => {
    return await createProfile(req, res);
  });

  profileRouter.get('/:address', async (req, res) => {
    return await getProfile(req, res);
  });

  registryRouter.get('/list/:address', async (req, res) => {
    return await listRegistriesByAddress(req, res);
  });

  registryRouter.post('/create', async (req, res) => {
    return await createRegistry(req, res);
  });

  registryRouter.get('/:id', async (req, res) => {
    return await getRegistry(req, res);
  });

  docRouter.post('/issue', async (req, res) => {
    return await documentHashOnChain(req, res);
  });

  docRouter.put('/update', async (req, res) => {
    return await updateDocumentHashOnChain(req, res);
  });

  docRouter.post('/revoke', async (req, res) => {
    return await revokeDocumentHashOnChain(req, res);
  });

  app.use('/api/v1/profile', profileRouter);
  app.use('/api/v1/registry', registryRouter);
  app.use('/api/v1/cred', credentialRouter);
  app.use('/api/v1/doc-hash', docRouter);

  app.use((_req, res) => {
    return res.json({
      message: 'check https://docs.dhiway.com/api for details of the APIs',
    });
  });

  routesRegistered = true;
}
