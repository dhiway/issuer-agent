// import express from "express";

// import * as Cord from "@cord.network/sdk";
// import { IDocument } from "@cord.network/sdk";

// import {
//   issuerDid,
//   authorIdentity,
//   issuerKeys,
//   createStream,
//   setupDidAndIdentities,
//   getSchema,
//   getRegistry,
//   revokeCredential,
//   updateStream,
//   getCredential,
// } from "../init";

// import { createConnection, getConnection } from "typeorm";
// import { Regisrty } from "../entity/Registry";
// import { Cred } from "../entity/Cred";
// const { WALLET_URL } = process.env;

// export async function issueCred(req: express.Request, res: express.Response) {
//   const data = req.body;

//   const reg = await getConnection()
//     .getRepository(Regisrty)
//     .createQueryBuilder("registry")
//     .where("registry.id = :id", { id: data.registryId })
//     .getOne();

//   if (!reg) {
//     return res.status(400).json({ error: "No registry" });
//   }

//   try {
//     await issueVC(reg.authId!, req, res);
//   } catch (err) {
//     console.log("error: ", err);
//   }
// }

// export async function issueVC(
//   authorization: Cord.AuthorizationId,
//   req: express.Request,
//   res: express.Response
// ) {
//   const data = req.body;
//   const holderDidUri = data.holderDid;

//   if (!issuerDid) {
//     await setupDidAndIdentities();
//   }

//   let schemaProp: any = undefined;
//   let registryProp: any = undefined;

//   if (data.schemaId) {
//     const schemaId = data.schemaId ? data.schemaId : "";
//     schemaProp = await getSchema(schemaId);
//     if (!schemaProp) {
//       return res.status(400).json({ result: "No Schema" });
//     }
//   }

//   if (data.registryId) {
//     const registryId = data.registryId ? data.registryId : "";
//     registryProp = await getRegistry(registryId);
//     if (!registryProp) {
//       return res.status(400).json({ result: "No Registry" });
//     }
//   }

//   let documents: any;

//   const cordSchema = JSON.parse(schemaProp.cordSchema);

//   try {
//     const content = Cord.Content.fromSchemaAndContent(
//       cordSchema,
//       data.property,
//       holderDidUri as Cord.DidUri,
//       issuerDid?.uri
//     );
//     const keyUri =
//       `${issuerDid.uri}${issuerDid.authentication[0].id}` as Cord.DidResourceUri;

//     const registryParsed = JSON.parse(registryProp.registryData);

//     const document: any = await Cord.Document.fromContent({
//       content,
//       authorization,
//       registry: registryParsed.identifier,
//       signCallback: async ({ data }) => ({
//         signature: issuerKeys.authentication.sign(data),
//         keyType: issuerKeys.authentication.type,
//         keyUri,
//       }),
//       options: {},
//     });

//     documents = document;

//     try {
//       await createStream(
//         issuerDid.uri,
//         authorIdentity,
//         async ({ data }) => ({
//           signature: issuerKeys.assertionMethod.sign(data),
//           keyType: issuerKeys.assertionMethod.type,
//         }),
//         documents,
//         authorization
//       );
//     } catch (error) {
//       console.log("err: ", error);
//     }
//   } catch (err: any) {
//     console.log("Error: ", err);
//   }

//   const cred = new Cred();
//   cred.identifier = documents.identifier;
//   cred.active = true;
//   cred.did = holderDidUri;
//   cred.credential = JSON.stringify(documents);
//   cred.hash = documents.documentHash;
//   cred.details = {
//     meta: "endpoint-received",
//   };

//   try {
//     await getConnection().manager.save(cred);
//   } catch (err) {
//     console.log("Error: ", err);
//   }

//   const url: any = WALLET_URL;

//   if (url && data.type) {
//     await fetch(`${url}/message/${holderDidUri}`, {
//       body: JSON.stringify({
//         id: data.id,
//         type: data.type,
//         fromDid: issuerDid.uri,
//         toDid: holderDidUri,
//         message: documents,
//       }),
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     })
//       .then((resp) => resp.json())
//       .then(() => console.log("Saved to db"))
//       .catch((error) => {
//         console.error(error);
//         return res.json({ result: "VC not issued" });
//       });
//   }

//   return res
//     .status(200)
//     .json({ result: "SUCCESS", id: cred.id, identifier: cred.identifier });
// }

// export async function getCredById(req: express.Request, res: express.Response) {
//   try {
//     const cred = await getConnection()
//       .getRepository(Cred)
//       .createQueryBuilder("cred")
//       .where("cred.id = :id", { id: req.params.id })
//       .getOne();

//     return res.status(200).json({ credential: cred });
//   } catch (error) {
//     console.log("Error: ", error);
//     return res.status(400).json({ status: "Credential not found" });
//   }
// }

// export async function revokeCred(req: express.Request, res: express.Response) {
//   const data = req.body;

//   if (!data.identifier || typeof data.identifier !== "string") {
//     return res.status(400).json({
//       error: "identifier is a required field and should be a string",
//     });
//   }

//   if (!issuerDid) {
//     await setupDidAndIdentities();
//   }

//   const cred = await getConnection()
//     .getRepository(Cred)
//     .createQueryBuilder("cred")
//     .where("cred.identifier = :identifier", { identifier: data.identifier })
//     .getOne();

//   if (!cred) {
//     return res.status(400).json({ error: "Invalid identifier" });
//   }

//   try {
//     const document = JSON.parse(cred.credential!) as IDocument;

//     await revokeCredential(
//       issuerDid.uri,
//       authorIdentity,
//       async ({ data }) => ({
//         signature: issuerKeys.assertionMethod.sign(data),
//         keyType: issuerKeys.assertionMethod.type,
//       }),
//       document,
//       false
//     );

//     console.log(`✅ Credential revoked!`);

//     return res.status(200).json({ result: "Revoked Successfully" });
//   } catch (error) {
//     console.log("err: ", error);
//     return res.status(400).json({ err: error });
//   }
// }

// export async function updateCred(req: express.Request, res: express.Response) {
//   const data = req.body;

//   try {
//     let schemaProp: any = undefined;
//     let credProp: any = undefined;

//     const updatedContent = data.property;

//     if (data.schemaId) {
//       const schemaId = data.schemaId ? data.schemaId : "";
//       schemaProp = await getSchema(schemaId);
//       if (!schemaProp) {
//         return res.status(400).json({ result: "No Schema found" });
//       }
//     }

//     if (data.credId) {
//       const credId = data.credId ? data.credId : "";
//       credProp = await getCredential(credId);
//       if (!credProp) {
//         return res.status(400).json({ result: "No Cred found" });
//       }
//     }

//     const schema = JSON.parse(schemaProp.cordSchema);
//     const document = JSON.parse(credProp.credential);

//     const keyUri =
//       `${issuerDid.uri}${issuerDid.authentication[0].id}` as Cord.DidResourceUri;

//     const updatedDocument: any = await updateStream(
//       document,
//       updatedContent,
//       schema,
//       async ({ data }) => ({
//         signature: issuerKeys.authentication.sign(data),
//         keyType: issuerKeys.authentication.type,
//         keyUri,
//       }),
//       issuerDid?.uri,
//       authorIdentity,
//       issuerKeys
//     );

//     credProp.identifier = updatedDocument.identifier;
//     credProp.credential = JSON.stringify(updatedDocument);
//     credProp.hash = updatedDocument.documentHash;
//     credProp.details = {
//       meta: "endpoint-received",
//     };

//     await getConnection().manager.save(credProp);

//     console.log("\n✅ Document updated!");

//     return res.status(200).json({
//       result: "Updated successufully",
//       identifier: credProp.identifier,
//     });
//   } catch (error) {
//     console.log("error: ", error);
//     return res.status(400).json({ err: error });
//   }
// }
