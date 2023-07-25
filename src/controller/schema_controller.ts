// import * as Cord from "@cord.network/sdk";
import express from "express";
import { getConnection } from "typeorm";
import "reflect-metadata";

import { Schema } from "../entity/Schema";
import {
  authorIdentity,
  issuerDid,
  issuerKeys,
  setupDidAndIdentities,
  ensureStoredSchema,
  getSchema,
} from "../init";

export async function createSchema(
  req: express.Request,
  res: express.Response
) {
  const data = req.body;
  let schemaDetails: any = undefined;

  if (!issuerDid) {
    await setupDidAndIdentities();
  }

  if (!data.schema || !data.schema.properties) {
    return res.status(400).json({
      error:
        "'schema' is a required field in the form of key-value pair, with title and description",
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

  if (schemaDetails) {
    const schemaData = new Schema();
    schemaData.title = data.schema.title ? data.schema.title : "";
    schemaData.description = data.schema.description
      ? data.schema.description
      : "";
    schemaData.schemaProperties = JSON.stringify(data.schema.properties);
    schemaData.cordSchema = JSON.stringify(schemaDetails);
    schemaData.identifier = schemaDetails.$id;

    try {
      await getConnection().manager.save(schemaData);
      return res.status(200).json({
        result: "SUCCESS",
        schemaId: schemaData.id,
        identifier: schemaData.identifier,
      });
    } catch (error) {
      console.log("Error: ", error);
      return res.status(400).json({ result: "SchemaData not saved in db" });
    }
  } else {
    res.status(400).json({ error: "SchemaDetails not created" });
  }
}

export async function getSchemaById(
  req: express.Request,
  res: express.Response
) {
  try {
    const schema = await getConnection()
      .getRepository(Schema)
      .createQueryBuilder("schema")
      .where("schema.id = :id", { id: req.params.id })
      .getOne();

    return res.status(200).json({ schema: schema });
  } catch (error) {
    console.log("err: ", error);
    return res.status(400).json({ status: "Schema not found" });
  }
}
