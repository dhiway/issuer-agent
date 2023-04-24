import express from "express";

import * as Cord from "@cord.network/sdk";

import {
  issuerDid,
  authorIdentity,
  issuerKeys,
  createStream,
  setupDidAndIdentities,
  getSchema,
  getRegistry,
} from "../init";

import { createConnection, getConnection } from "typeorm";
import { Regisrty } from "../entity/Registry";
const {WALLET_URL} = process.env


export async function issueCred(req: express.Request, res: express.Response) {
  const data = req.body;

  const reg = await getConnection()
    .getRepository(Regisrty)
    .createQueryBuilder("registry")
    .where("registry.id = :id", { id: data.registryId })
    .getOne();

  if (!reg) {
    return res.status(400).json({ error: "No registry" });
  }

  try {
    await issueVC(reg.authId as string, req, res);
  } catch (err) {
    console.log("error: ", err);
  }
}

export async function issueVC(
  authorization: Cord.AuthorizationId,
  req: express.Request,
  res: express.Response
) {
  const data = req.body;
  const holderDidUri = data.holderDid;

  if (!issuerDid) {
    await setupDidAndIdentities();
  }

  let schemaProp: any = undefined;
  let registryProp: any = undefined;

  if (data.schemaId) {
    const schemaId = data.schemaId ? data.schemaId : "";
    schemaProp = await getSchema(res, schemaId);
    if (!schemaProp) {
      return res.status(400).json({ result: "No Schema" });
    }
  }

  if (data.registryId) {
    const registryId = data.registryId ? data.registryId : "";
    registryProp = await getRegistry(res, registryId);
    if (!registryProp) {
      return res.status(400).json({ result: "No Registry" });
    }
  }

  let documents: any;

  const cordSchema = JSON.parse(schemaProp.cordSchema);

  try {
    const content = Cord.Content.fromSchemaAndContent(
      cordSchema,
      data.property,
      holderDidUri as Cord.DidUri,
      issuerDid?.uri
    );
    const keyUri =
      `${issuerDid.uri}${issuerDid.authentication[0].id}` as Cord.DidResourceUri;

    const registryParsed = JSON.parse(registryProp.registry);

    const document: any = await Cord.Document.fromContent({
      content,
      authorization,
      registry: registryParsed.identifier,
      signCallback: async ({ data }) => ({
        signature: issuerKeys.authentication.sign(data),
        keyType: issuerKeys.authentication.type,
        keyUri,
      }),
      options: {},
    });

    documents = document;

    try {
      await createStream(
        issuerDid.uri,
        authorIdentity,
        async ({ data }) => ({
          signature: issuerKeys.assertionMethod.sign(data),
          keyType: issuerKeys.assertionMethod.type,
        }),
        documents,
        authorization
      );
    } catch (error) {
      console.log("err: ", error);
    }
  } catch (err: any) {
    console.log("Error: ", err);
  }

  const url : any= WALLET_URL
  
  await fetch(`${url}/message/${holderDidUri}`, {
    body: JSON.stringify({
      id: data.id,
      type: data.type,
      fromDid: issuerDid.uri,
      toDid: holderDidUri,
      message: documents,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((resp) => resp.json())
    .then((data) => res.json({}))
    .catch((error) => {
      console.error(error);
      res.json({});
    });
}
