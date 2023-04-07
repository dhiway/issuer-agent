import express from 'express';
import bodyParser from 'body-parser';
// import { cred, credentialCreate, presentationCreate, registryCreate, schemaCreate } from './demo';

import { getMessage, getAllMessageForDid, receiveMessage} from './controller/message_controller';
import { issueCred } from './controller/credential_controller';
import { createSchema } from './controller/schema_controller';
import { setupRegistry } from './controller/registry_controller';

import * as dotenv from "dotenv";
dotenv.config();

const app = express();
export const PORT = 4000 
 
app.use(bodyParser.json({ limit: '5mb' }));

app.use(express.json());

const demoRouter = express.Router({ mergeParams: true });
const messageRouter = express.Router({ mergeParams: true });
const credentialRouter = express.Router({ mergeParams: true });
const schemaRouter = express.Router({ mergeParams: true });
const registryRouter = express.Router({mergeParams: true})


// demoRouter.post('/', async (req, res) => {
//     return await cred(req, res);
// });

// demoRouter.post('/schema', async (req, res) => {
//     return await schemaCreate(req, res);
// });

// demoRouter.post('/registry', async (req, res) => {
//     return await registryCreate(req, res);
// });

// demoRouter.post('/credential', async (req, res) => {
//     return await credentialCreate(req, res);
// });

// demoRouter.post('/presentation', async (req, res) => {
//     return await presentationCreate(req, res);
// });

messageRouter.post('/:did', async (req, res) => {
    return await receiveMessage(req, res);
})
messageRouter.get('/:did', async (req, res) => {
    return await getAllMessageForDid(req, res);
})
messageRouter.get('/:did/:id', async (req, res) => {
    return await getMessage(req, res);
})

credentialRouter.post('/', async (req, res) => {
    return await issueCred(req, res);
})

schemaRouter.post('/', async (req, res) => {
    return await createSchema(req, res);
})

registryRouter.get('/', async (req, res) => {
    return await setupRegistry(req, res);
})



app.use('/api/v1/demo', demoRouter)
app.use('/api/v1/message', messageRouter);
app.use('/api/v1/cred', credentialRouter);
app.use('/api/v1/schema', schemaRouter);
app.use('/api/v1/registry', registryRouter);


app.listen(PORT,  () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
})