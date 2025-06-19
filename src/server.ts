import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
export const PORT = process.env.PORT || '3000';

app.use(bodyParser.json({ limit: '5mb' }));
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err.message === 'Invalid JSON payload') {
      return res.status(400).send({ error: 'Invalid JSON format' });
    }
    if (err.toString().includes('SyntaxError')) {
      return res.status(400).send({ error: 'Invalid JSON' });
    }
    next(err);
  }
);

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'http://localhost:5108',
  'https://studio.dhiway.com',
  'https://markdemo.dhiway.com',
  'https://studiodemo.dhiway.com',
  'https://issuer-agent-api.demo.dhiway.net',
];

const allowedDomains = [
  'localhost',
  'dhiway.com',
  'dway.io',
  'cord.network',
  'amplifyapp.com',
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      let tmp = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      if (!allowedOrigins.includes(tmp)) {
        const parts = tmp.split('/')[2]?.split('.') || [];
        const domain = parts.slice(-2).join('.');
        if (!allowedDomains.includes(domain)) {
          return callback(
            new Error(`CORS policy disallows origin ${origin}`),
            false
          );
        }
      }
      callback(null, true);
    },
    optionsSuccessStatus: 200,
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

// CORS preflight handler (no path so covers all OPTIONS)
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method !== 'OPTIONS') return next();

    const origin = req.headers.origin as string | undefined;
    let tmp = origin?.endsWith('/') ? origin.slice(0, -1) : origin;

    if (tmp) {
      const parts = tmp.split('/')[2]?.split('.') || [];
      const domain = parts.slice(-2).join('.');
      if (!allowedDomains.includes(domain) && !allowedOrigins.includes(tmp)) {
        return res.status(403).send('CORS policy: Origin not allowed');
      }
    }

    res.set({
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods':
        'GET, PUT, POST, DELETE, OPTIONS, HEAD, PATCH',
      'Access-Control-Allow-Headers':
        'Content-Type, X-UserId, Accept, Authorization, user-agent, Host, X-Forwarded-For, Upgrade, Connection, X-Content-Type-Options, Content-Security-Policy, X-Frame-Options, Strict-Transport-Security',
      'Access-Control-Allow-Credentials': 'true',
    });
    res.sendStatus(204);
  }
);

export default app;
