import app from './server';
import express from 'express';
import { dataSource } from './dbconfig';
import { addDelegateAsRegistryDelegate } from './init';
import {
  createSchema,
  getSchemaById,
} from './controller/schema_controller';
import {
  documentHashOnChain,
  getCredById,
  issueVC,
  revokeCred,
  updateCred,
} from './controller/credential_controller';
const {
  PORT
} = process.env;

const credentialRouter = express.Router({ mergeParams: true });
const schemaRouter = express.Router({ mergeParams: true });

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

app.use('/api/v1/schema', schemaRouter);
app.use('/api/v1/cred', credentialRouter);

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
    await addDelegateAsRegistryDelegate();
  } catch (error) {
    console.log('error: ', error);
    throw new Error('Main error');
  }

  app.listen(PORT, () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
  });
}

main().catch((e) => console.log(e));
