import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import cluster from 'node:cluster';
import os from 'node:os';

// import {
//   getCredById,
//   issueCred,
//   revokeCred,
//   updateCred,
// } from './controller/credential_controller';
import { createSchema, getSchemaById } from './controller/schema_controller';
import { createConnection } from 'typeorm';
import { dbConfig } from './dbconfig';
import { addDelegateAsRegistryDelegate } from './init';

const app = express();
export const { PORT } = process.env;

app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.json());

// const numCPUs = os.cpus().length;

// if (cluster.isMaster) {
//   console.log(`Primary ${process.pid} is running`);

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//     cluster.fork();
//   });
// } else {
// const credentialRouter = express.Router({ mergeParams: true });
const schemaRouter = express.Router({ mergeParams: true });

// credentialRouter.post('/', async (req, res) => {
//   return await issueCred(req, res);
// });
// credentialRouter.get('/:id', async (req, res) => {
//   return await getCredById(req, res);
// });
// credentialRouter.post('/revoke', async (req, res) => {
//   return await revokeCred(req, res);
// });
// credentialRouter.put('/update', async (req, res) => {
//   return await updateCred(req, res);
// });

schemaRouter.post('/', async (req, res) => {
  return await createSchema(req, res);
});
schemaRouter.get('/:id', async (req, res) => {
  return await getSchemaById(req, res);
});

const openApiDocumentation = JSON.parse(
  fs.readFileSync('./apis.json').toString()
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));
// app.use('/api/v1/cred', credentialRouter);
app.use('/api/v1/schema', schemaRouter);

async function main() {
  try {
    await createConnection(dbConfig);
  } catch (error) {
    console.log('error: ', error);
  }

  await addDelegateAsRegistryDelegate();

  app.listen(PORT, () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
  });
}

main().catch((e) => console.log(e));
// console.log(`Worker ${process.pid} started`);
// }
