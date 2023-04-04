import express from 'express';
import bodyParser from 'body-parser';
import { cred, credentialCreate, presentationCreate, registryCreate, schemaCreate } from './demo';
 
const app = express();
const PORT = 3000 
 
app.use(bodyParser.json({ limit: '5mb' }));

app.use(express.json());

const schemaRouter = express.Router({ mergeParams: true });


schemaRouter.post('/', async (req, res) => {
    return await cred(req, res);
});

schemaRouter.post('/schema', async (req, res) => {
    return await schemaCreate(req, res);
});

schemaRouter.post('/registry', async (req, res) => {
    return await registryCreate(req, res);
});

schemaRouter.post('/credential', async (req, res) => {
    return await credentialCreate(req, res);
});

schemaRouter.post('/presentation', async (req, res) => {
    return await presentationCreate(req, res);
});


app.use('/api/v3/', schemaRouter)


app.listen(PORT,  () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
})