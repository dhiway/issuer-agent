import express from "express";
import bodyParser from "body-parser";
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

import { issueCred } from "./controller/credential_controller";
import { createSchema } from "./controller/schema_controller";
import { createRegistry } from "./controller/registry_controller";
import { createConnection } from "typeorm";
import { dbConfig } from "./dbconfig";

const app = express();
export const { PORT } = process.env;

app.use(bodyParser.json({ limit: "5mb" }));
app.use(express.json());

const messageRouter = express.Router({ mergeParams: true });
const credentialRouter = express.Router({ mergeParams: true });
const schemaRouter = express.Router({ mergeParams: true });
const registryRouter = express.Router({ mergeParams: true });

credentialRouter.post("/", async (req, res) => {
  return await issueCred(req, res);
});

schemaRouter.post("/", async (req, res) => {
  return await createSchema(req, res);
});

registryRouter.post("/", async (req, res) => {
  return await createRegistry(req, res);
});

const openApiDocumentation = JSON.parse(
  fs.readFileSync('./apis.json').toString()
);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/cred", credentialRouter);
app.use("/api/v1/schema", schemaRouter);
app.use("/api/v1/registry", registryRouter);


async function main() {
  try {
    await createConnection(dbConfig);
  } catch (error) {
    console.log("error: ", error);
  }

  app.listen(PORT, () => {
    console.log(`Dhiway gateway is running at http://localhost:${PORT}`);
  });
}

main().catch((e) => console.log(e));
