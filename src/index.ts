import express from 'express';
import { dataSource } from './dbconfig';
import { addDelegateAsRegistryDelegate } from './init';
import { createSchema, getSchemaById } from './controller/schema_controller';
import {
  documentHashOnChain,
  getCredById,
  issueVC,
  revokeCred,
  revokeDocumentHashOnChain,
  udpateDocumentHashonChain,
  updateCred,
} from './controller/credential_controller';
import { generateDid, resolveDid } from './controller/did_controller';
import app from './server';

const { PORT } = process.env;

const credentialRouter = express.Router({ mergeParams: true });
const schemaRouter = express.Router({ mergeParams: true });
const didRouter = express.Router({ mergeParams: true });
const docRouter = express.Router({ mergeParams: true });

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

didRouter.post('/create', async (req, res) => {
  return await generateDid(req, res);
});

docRouter.post("/issue", async (req, res) => {
  return await documentHashOnChain(req, res);
});

docRouter.post("/revoke", async (req, res) => {
  return await revokeDocumentHashOnChain(req, res);
});

docRouter.post("/update", async (req, res) => {
  return await udpateDocumentHashonChain(req, res);
});

app.use('/api/v1/schema', schemaRouter);
app.use('/api/v1/cred', credentialRouter);
app.use('/api/v1/did', didRouter);
app.use('/api/v1/docHash', docRouter);


app.get('/:id/did.json', async (req, res) => {
  return await resolveDid(req, res);
});

app.get('/*', async (req, res) => {
  return res.json({
    message: 'check https://docs.dhiway.com/api for details of the APIs',
  });
});

async function main() {
  try {
    await dataSource.initialize();
    addDelegateAsRegistryDelegate();
  } catch (error) {
    console.log('error: ', error);
    throw new Error('Main error');
  }

  app.listen(PORT, () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
  });
}

main().catch((e) => console.log(e));
