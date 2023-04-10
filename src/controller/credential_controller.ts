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

import { PORT } from "..";

let schemaProp: any = undefined;
let registryProp: any = undefined;

export async function issueCred(req: express.Request, res: express.Response) {
  try {
    await issueVC(authorIdentity, req, res);
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

  if (data.schemaId) {
    const schemaId = data.schemaId ? data.schemaId : "";
    const schemaProp = await getSchema(res, schemaId);
    if (!schemaProp) {
      return res.status(400).json({ result: "No Schema" });
    }
  }

  if (data.registryId) {
    const registryId = data.registryId ? data.registryId : "";
    registryProp = await getRegistry(res, registryId);
    if (!registryProp) {
      console.log("registryPropppp: ", registryProp);
      return res.status(400).json({ result: "Not Found" });
    }
  }

  let documents: any;

  try {
    const content = Cord.Content.fromSchemaAndContent(
      schemaProp.schema,
      schemaProp.properties,
      holderDidUri as Cord.DidUri,
      issuerDid?.uri
    );
    const keyUri =
      `${issuerDid.uri}${issuerDid.authentication[0].id}` as Cord.DidResourceUri;
    console.log("AuthorizationID", authorization);
    console.log("contentttt", content);

    const document: any = await Cord.Document.fromContent({
      content,
      authorization,
      registry: registryProp.registry.identifier,
      signCallback: async ({ data }) => ({
        signature: issuerKeys.assertionMethod.sign(data),
        keyType: issuerKeys.assertionMethod.type,
        keyUri,
      }),
      options: {},
    });
    console.log("documenttttt: ", document);

    documents = document;

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
  } catch (err: any) {
    console.log("Error: ", err);
  }
  // return document;

  const url = `http://localhost:${PORT}/api/v1/message/:did`;
  await fetch(url, {
    body: JSON.stringify({
      id: data.id,
      type: data.type,
      fromdid: data.fromdid,
      did: req.params.did,
      unread: true,
      details: documents,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .catch((error) => {
      console.error(error);
    });
}
