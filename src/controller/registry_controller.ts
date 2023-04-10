import express from "express";
import { getConnection } from "typeorm";

// import * as Cord from "@cord.network/sdk";

import {
  setupDidAndIdentities,
  addRegistryAdminDelegate,
  authorIdentity,
  issuerDid,
  issuerKeys,
  getSchema,
  ensureStoredRegistry
} from "../init";

import { Schema } from "../entity/Schema";
import { Regisrty } from "../entity/Registry";

export let registryAuthId: any = undefined;
export let registry: any = undefined;

export async function createRegistry(
  req: express.Request,
  res: express.Response
) {
  const data = req.body;

  /* Checking if the issuerDid is null. If it is, it will call the setupDidAndIdentities() function. */
  if (!issuerDid) {
    await setupDidAndIdentities();
    return null;
  }

  if (data.schemaId) {
    const schemaId = data.schemaId ? data.schemaId : "";
    const schemaProp = await getSchema(res, schemaId);
    if (!schemaProp) {
      return res.status(400).json({ result: "No Schema" });
    }
  }

  const schemaValue = await getConnection()
    .getRepository(Schema)
    .createQueryBuilder("schema")
    .where("schema.id = :id", { id: data.schemaId })
    .getOne();

  registry = await ensureStoredRegistry(
    authorIdentity,
    issuerDid.uri,
    schemaValue?.schema["$id"],
    async ({ data }) => ({
      signature: issuerKeys.assertionMethod.sign(data),
      keyType: issuerKeys.assertionMethod.type,
    })
  );

  registryAuthId = await addRegistryAdminDelegate(
    authorIdentity,
    issuerDid.uri,
    registry["identifier"],
    issuerDid.uri,
    async ({ data }) => ({
      signature: issuerKeys.capabilityDelegation.sign(data),
      keyType: issuerKeys.capabilityDelegation.type,
    })
  );

  const registryData = new Regisrty();
  registryData.registry = JSON.stringify(registry);
  registryData.authId = JSON.stringify(registryAuthId);

  console.log("Registry AuthId: ", registryAuthId);
  console.log("registryyyyyy: ", registry);

  try {
    await getConnection().manager.save(registryData);
    return res
      .status(200)
      .json({ result: "SUCCESS", recordId: registryData.id });
  } catch (error) {
    return res.status(400).json({ result: "RegistryData not saved in db" });
  }
}



