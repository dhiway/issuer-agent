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

export async function issueCred(req: express.Request, res: express.Response) {
  const data = req.body;

  const regId = await getConnection()
    .getRepository(Regisrty)
    .createQueryBuilder("registry")
    .where("registry.id = :id", { id: data.registryId })
    .getOne();

  if (!regId) {
    return res.status(400).json({ error: "No regId" });
  }

  try {
    await issueVC(regId.authId, req, res);
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
    return null;
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

    const regist = JSON.parse(registryProp.registry);

    const document: any = await Cord.Document.fromContent({
      content,
      authorization,
      registry: regist.identifier,
      signCallback: async ({ data }) => ({
        signature: issuerKeys.assertionMethod.sign(data),
        keyType: issuerKeys.assertionMethod.type,
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
  // return document;

  const url = `http://wallet:5001/api/v1/message/${holderDidUri}`;
  await fetch(url, {
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
