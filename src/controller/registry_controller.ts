import express from "express";
import { getConnection } from "typeorm";

import * as Cord from "@cord.network/sdk";

import {
  setupDidAndIdentities,
  addRegistryAdminDelegate,
  authorIdentity,
  issuerDid,
  issuerKeys,
  getSchema,
} from "../init";

import { Schema } from "../entity/Schema";
import { Regisrty } from "../entity/Registry";

export let registryAuthId: any = undefined;
export let registry: any = undefined;

export async function setupRegistry(
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
    if (schemaProp) {
      return res.status(200).json({ result: "SUCCESS" });
    }
    return res.status(400).json({ result: "Not Found" });
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
  registryData.registry = registry;
  registryData.authId = registryAuthId;

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


export async function ensureStoredRegistry(
  authorAccount: Cord.CordKeyringPair,
  creator: Cord.DidUri,
  schemaUri: Cord.ISchema["$id"],
  signCallback: Cord.SignExtrinsicCallback
): Promise<Cord.IRegistry> {
  const api = Cord.ConfigService.get("api");

  const registryDetails: Cord.IContents = {
    title: "Wallet Registry",
    description: "Registry for Credentials",
  };

  const registryType: Cord.IRegistryType = {
    details: registryDetails,
    schema: schemaUri,
    creator: creator,
  };

  const txRegistry: Cord.IRegistry =
    Cord.Registry.fromRegistryProperties(registryType);

  try {
    await Cord.Registry.verifyStored(txRegistry);
    console.log("Registry already stored. Skipping creation");
    return txRegistry;
  } catch {
    console.log("Regisrty not present. Creating it now...");
    // Authorize the tx.
    const schemaId = Cord.Schema.idToChain(schemaUri);
    const tx = api.tx.registry.create(txRegistry.details, schemaId);
    const extrinsic = await Cord.Did.authorizeTx(
      creator,
      tx,
      signCallback,
      authorAccount.address
    );
    // Write to chain then return the Schema.
    await Cord.Chain.signAndSubmitTx(extrinsic, authorAccount);

    return txRegistry;
  }
}
