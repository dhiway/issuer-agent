import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { createSchema, getSchemaById } from './controller/schema_controller';
import { createConnection } from 'typeorm';
import { dbConfig } from './dbconfig';
import { addDelegateAsRegistryDelegate } from './init';
import {
  documentHashOnChain,
  getCredById,
  issueVC,
  revokeCred,
  updateCred,
} from './controller/credential_controller';
import cors from 'cors';
const app = express();
export const { PORT } = process.env;

app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.json());


const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'http://localhost:5108',
  'https://studio.dhiway.com',
  'https://markdemo.dhiway.com',
  'https://studiodemo.dhiway.com',
];


const allowedDomains = [
  'localhost',
  'dhiway.com',
  'dway.io',
  'cord.network',
  'amplifyapp.com' /* For supporting quick hosting of UI */,
];

app.use(
  cors({
      origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          let tmpOrigin = origin;

          if (origin.slice(-1) === '/') {
              tmpOrigin = origin.substring(0, origin.length - 1);
          }
          if (allowedOrigins.indexOf(tmpOrigin) === -1) {
              /* Check if we should allow star/asteric */
              const b = tmpOrigin.split('/')[2].split('.');
              const domain = `${b[b.length - 2]}.${b[b.length - 1]}`;
              if (allowedDomains.indexOf(domain) === -1) {
                  console.log(tmpOrigin, domain);
                  const msg = `The CORS policy for this site (${origin}) does not allow access from the specified Origin.`;
                  return callback(new Error(msg), false);
              }
          }
          return callback(null, true);
      },
      optionsSuccessStatus: 200, // For legacy browser support
      credentials: true,
      preflightContinue: true,
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
      allowedHeaders: [
          'Content-Type',
          'X-UserId',
          'Accept',
          'Authorization',
          'user-agent',
          'Host',
          'X-Forwarded-For',
          'Upgrade',
          'Connection',
          'X-Content-Type-Options',
          'Content-Security-Policy',
          'X-Frame-Options',
          'Strict-Transport-Security',
      ],
  })
);

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

const openApiDocumentation = YAML.load('./apis.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));
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
    await createConnection(dbConfig);

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
