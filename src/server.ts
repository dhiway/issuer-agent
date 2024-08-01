import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';

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
        /* Check if we should allow star/asterisk */
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

const openApiDocumentation = YAML.load('./apis.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));

export default app;
