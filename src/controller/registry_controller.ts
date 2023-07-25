import express from "express";
import { getConnection } from "typeorm";

import {
  setupDidAndIdentities,
  addRegistryAdminDelegate,
  authorIdentity,
  issuerDid,
  issuerKeys,
  getSchema,
  ensureStoredRegistry,
  getRegistry,
} from "../init";

import { Regisrty } from "../entity/Registry";

export async function createRegistry(
  req: express.Request,
  res: express.Response
) {
  const data = req.body;

  /* Checking if the issuerDid is null. If it is, it will call the setupDidAndIdentities() function. */
  if (!issuerDid) {
    await setupDidAndIdentities();
  }

  let registryAuthId: any = undefined;
  let registry: any = undefined;
  let schemaProp: any = undefined;

  if (data.schemaId) {
    const schemaId = data.schemaId ? data.schemaId : "";
    schemaProp = await getSchema(schemaId);
    if (!schemaProp) {
      return res.status(400).json({ result: "No Schema" });
    }
  }

  const schemaParsed = JSON.parse(schemaProp.cordSchema);

  try {
    registry = await ensureStoredRegistry(
      data.title,
      data.description,
      authorIdentity,
      issuerDid.uri,
      schemaParsed["$id"],
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      })
    );
  } catch (error) {
    console.log("err: ", error);
  }

  try {
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
  } catch (error) {
    console.log("err: ", error);
  }

  const registryData = new Regisrty();
  registryData.registryData = JSON.stringify(registry);
  registryData.authId = registryAuthId;
  registryData.identifier = registry.identifier;

  try {
    await getConnection().manager.save(registryData);
    return res.status(200).json({
      result: "SUCCESS",
      registryId: registryData.id,
      identifier: registryData.identifier,
    });
  } catch (error) {
    return res.status(400).json({ result: "RegistryData not saved in db" });
  }
}

export async function getRegistryById(
  req: express.Request,
  res: express.Response
) {
  try {
    const registry = await getConnection()
      .getRepository(Regisrty)
      .createQueryBuilder("registry")
      .where("registry.id = :id", { id: req.params.id })
      .getOne();

    return res.status(200).json({ registry: registry });
  } catch (error) {
    console.log("err: ", error);
    return res.status(400).json({ status: "Registry not found" });
  }
}
