import serverlessHttp from 'serverless-http';
import express from 'express';
import { dataSource } from './dbconfig';
import app from './server';
import { checkDidAndIdentities } from './cord';
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
  issueVC,
  getCredById,
  updateCred,
  revokeCred,
  createPresentation,
  documentHashOnChain,
  updateDocumentHashOnChain,
  revokeDocumentHashOnChain,
  getCredentialsByRegistry,
} from './controller/credential_controller';

// Register routes (mirrors src/index.ts without cluster)
const profileRouter = express.Router({ mergeParams: true });
const registryRouter = express.Router({ mergeParams: true });
const credentialRouter = express.Router({ mergeParams: true });
const docRouter = express.Router({ mergeParams: true });

credentialRouter.post('/', async (req, res) => issueVC(req, res));
credentialRouter.get('/:id', async (req, res) => getCredById(req, res));
credentialRouter.put('/update', async (req, res) => updateCred(req, res));
credentialRouter.post('/revoke', async (req, res) => revokeCred(req, res));
credentialRouter.post('/presentation', async (req, res) =>
  createPresentation(req, res)
);
credentialRouter.get('/list/:registryId', async (req, res) =>
  getCredentialsByRegistry(req, res)
);

profileRouter.post('/create', async (req, res) => createProfile(req, res));
profileRouter.get('/:address', async (req, res) => getProfile(req, res));
profileRouter.get('/cache/stats', async (req, res) => getCacheStats(req, res));

registryRouter.post('/create', async (req, res) => createRegistry(req, res));
registryRouter.get('/:id', async (req, res) => getRegistry(req, res));
registryRouter.get('/list/:address', async (req, res) =>
  listRegistriesByAddress(req, res)
);

docRouter.post('/issue', async (req, res) => documentHashOnChain(req, res));
docRouter.put('/update', async (req, res) =>
  updateDocumentHashOnChain(req, res)
);
docRouter.post('/revoke', async (req, res) =>
  revokeDocumentHashOnChain(req, res)
);

app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/registry', registryRouter);
app.use('/api/v1/cred', credentialRouter);
app.use('/api/v1/doc-hash', docRouter);

app.use((_req, res) => {
  return res.json({
    message: 'check https://docs.dhiway.com/api for details of the APIs',
  });
});

// Singleton initializer — runs once per Lambda instance (warm-start reuse)
let initPromise: Promise<void> | null = null;

function initialize(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await dataSource.initialize();
      await checkDidAndIdentities();
    })();
  }
  return initPromise;
}

const serverlessHandler = serverlessHttp(app);

export const handler = async (event: any, context: any) => {
  await initialize();
  return serverlessHandler(event, context);
};
