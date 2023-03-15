import express from 'express';
import bodyParser from 'body-parser';
import { credentialCreate } from './index';
 
const app = express();
const PORT = 3000 
 
app.use(bodyParser.json({ limit: '5mb' }));

app.use(express.json());

const schemaRouter = express.Router({ mergeParams: true });

schemaRouter.post('/', async (req, res) => {
    return await credentialCreate(req, res);
});

app.use('/api/v3/schema', schemaRouter)


app.listen(PORT,  () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
})