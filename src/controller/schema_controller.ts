// import * as Cord from "@cord.network/sdk";
import express from "express";
import { getConnection } from "typeorm";

import { Schema } from "../entity/Schema";
import { authorIdentity, issuerDid, issuerKeys, setupDidAndIdentities, ensureStoredSchema } from "../init";

export let schemaDetails: any = undefined;


export async function createSchema(
  req: express.Request,
  res: express.Response
) {
  const data = req.body;

  if (!issuerDid) {
    await setupDidAndIdentities();
    return null;
  }

  if (!data.properties) {
    return res.status(400).json({
      error: "'properties' is a required field in the form of key-value pair, with title and description",
    });
  }

  schemaDetails = await ensureStoredSchema(
    authorIdentity,
    issuerDid.uri,
    async ({ data }) => ({
      signature: issuerKeys.assertionMethod.sign(data),
      keyType: issuerKeys.assertionMethod.type,
    }),
    req,
    res
  );

  console.log("schemadetailssss", schemaDetails);

  const schemaData = new Schema();
  schemaData.title = data.title ? data.title : "";
  schemaData.description = data.description ? data.description : "";
  schemaData.properties = data.properties ? data.properties : "";
  schemaData.registry = data.registry ? true : false;
  schemaData.schema = JSON.stringify(schemaDetails);

  try {
    await getConnection().manager.save(schemaData);
    return res.status(200).json({ result: "SUCCESS", schemaId: schemaData.id});
  } catch (error) {
    return res.status(400).json({result: "SchemaData not saved in db"});
  }
}



