import * as Cord from "@cord.network/sdk";
import express from "express";
import { getConnection } from "typeorm";

import { Schema } from "../entity/Schema";
import { authorIdentity, issuerDid, issuerKeys, setupDidAndIdentities } from "../init";

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
      error: "'schemaProperties' is a required field, with title and description",
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
  schemaData.properties = data.properties ? data.properties : "";
  schemaData.registry = data.registry ? true : false;
  schemaData.schema = schemaDetails;

  try {
    await getConnection().manager.save(schemaData);
    return res.status(200).json({ result: "SUCCESS", schemaId: schemaData.id});
  } catch (error) {
    return res.status(400).json({result: "SchemaData not saved in db"});
  }
}


export async function ensureStoredSchema(
  authorAccount: Cord.CordKeyringPair,
  creator: Cord.DidUri,
  signCallback: Cord.SignExtrinsicCallback,
  req: express.Request,
  res: express.Response
): Promise<Cord.ISchema> {
  const data = req.body;

  const api = Cord.ConfigService.get("api");

  const schema = Cord.Schema.fromProperties(
    data.title,
    data.properties,
    creator
  );

  try {
    await Cord.Schema.verifyStored(schema);
    console.log("Schema already stored. Skipping creation");
    return schema;
  } catch {
    console.log("Schema not present. Creating it now...");
    // Authorize the tx.
    const encodedSchema = Cord.Schema.toChain(schema);
    const tx = api.tx.schema.create(encodedSchema);
    const extrinsic = await Cord.Did.authorizeTx(
      creator,
      tx,
      signCallback,
      authorAccount.address
    );
    // Write to chain then return the Schema.
    await Cord.Chain.signAndSubmitTx(extrinsic, authorAccount);

    console.log("schemaaaa", schema);
    return schema;
  }
}
