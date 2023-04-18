import * as Cord from "@cord.network/sdk";
import { Crypto } from "@cord.network/utils";
import express from 'express'; 
import { getConnection } from 'typeorm';
import { Schema } from "./entity/Schema";


import {
  blake2AsU8a,
  keyExtractPath,
  keyFromPath,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  sr25519PairFromSeed,
} from "@polkadot/util-crypto";
import { Regisrty } from "./entity/Registry";

const { CORD_WSS_URL, MNEMONIC, AUTHOR_URI, AGENT_DID_NAME } = process.env;


export let authorIdentity: any = undefined;
export let issuerDid: any = undefined;
export let issuerKeys: any = undefined;

// export let emailSchema: any = undefined;

function generateKeyAgreement(mnemonic: string) {
  const secretKeyPair = sr25519PairFromSeed(mnemonicToMiniSecret(mnemonic));
  const { path } = keyExtractPath("//did//keyAgreement//0");
  const { secretKey } = keyFromPath(secretKeyPair, path, "sr25519");
  return Cord.Utils.Crypto.makeEncryptionKeypairFromSeed(
    blake2AsU8a(secretKey)
  );
}

function generateKeypairs(mnemonic = mnemonicGenerate()) {
  const keyring = new Cord.Utils.Keyring({
    ss58Format: 29,
    type: "sr25519",
  });

  const account = keyring.addFromMnemonic(mnemonic) as Cord.CordKeyringPair;
  const authentication = {
    ...account.derive("//did//0"),
    type: "sr25519",
  } as Cord.CordKeyringPair;

  const assertionMethod = {
    ...account.derive("//did//assertion//0"),
    type: "sr25519",
  } as Cord.CordKeyringPair;

  const capabilityDelegation = {
    ...account.derive("//did//delegation//0"),
    type: "sr25519",
  } as Cord.CordKeyringPair;

  const keyAgreement = generateKeyAgreement(mnemonic);

  return {
    authentication: authentication,
    keyAgreement: keyAgreement,
    assertionMethod: assertionMethod,
    capabilityDelegation: capabilityDelegation,
  };
}

export async function queryFullDid(
  didUri: Cord.DidUri
): Promise<Cord.DidDocument | null> {
  const did = await Cord.Did.resolve(didUri);
  if (did?.metadata?.deactivated) {
    console.log(`DID ${didUri} has been deleted.`);
    return null;
  } else if (did?.document === undefined) {
    console.log(`DID ${didUri} does not exist.`);
    return null;
  } else {
    return did?.document;
  }
}

export async function createDidName(
  did: Cord.DidUri,
  submitterAccount: Cord.CordKeyringPair,
  name: Cord.Did.DidName,
  signCallback: Cord.SignExtrinsicCallback
): Promise<void> {
  const api = Cord.ConfigService.get("api");

  const didNameClaimTx = await api.tx.didNames.register(name);
  const authorizedDidNameClaimTx = await Cord.Did.authorizeTx(
    did,
    didNameClaimTx,
    signCallback,
    submitterAccount.address
  );
  await Cord.Chain.signAndSubmitTx(authorizedDidNameClaimTx, submitterAccount);
}

export async function createDid(
  mnemonic: string | undefined,
  didName: string | undefined
) {
  try {
    const api = Cord.ConfigService.get("api");
    if (!mnemonic) {
      mnemonic = mnemonicGenerate(24);
    }
    const identity = generateKeypairs(mnemonic);
    const {
      authentication,
      keyAgreement,
      assertionMethod,
      capabilityDelegation,
    } = identity;
    // Get tx that will create the DID on chain and DID-URI that can be used to resolve the DID Document.
    const didUri = Cord.Did.getDidUriFromKey(authentication);
    const check = await queryFullDid(didUri);
    if (!check) {
      const didCreationTx = await Cord.Did.getStoreTx(
        {
          authentication: [authentication],
          keyAgreement: [keyAgreement],
          assertionMethod: [assertionMethod],
          capabilityDelegation: [capabilityDelegation],
          // Example service.
          service: [
            {
              id: "#my-service",
              type: ["service-type"],
              serviceEndpoint: ["https://www.example.com"],
            },
          ],
        },
        async ({ data }) => ({
          signature: authentication.sign(data),
          keyType: authentication.type,
        })
      );

      await Cord.Chain.signAndSubmitTx(didCreationTx, authorIdentity);

      /* TODO: create didName */

      if (didName) {
        try {
          await createDidName(
            didUri,
            authorIdentity,
            didName,
            async ({ data }) => ({
              signature: identity.authentication.sign(data),
              keyType: identity.authentication.type,
            })
          );
        } catch (err: any) {
          console.log("Error to interact with chain", err);
        }
      }

      const encodedDid = await api.call.did.query(Cord.Did.toChain(didUri));
      const { document } = Cord.Did.linkedInfoFromChain(encodedDid);
      if (!document) {
        throw new Error("DID was not successfully created.");
      }
      return { mnemonic, identity, document };
    } else {
      return { mnemonic, identity, document: check };
    }
  } catch (err) {
    console.log("Error: ", err);
    return null;
  }
}

export async function setupDidAndIdentities() {
  Cord.ConfigService.set({ submitTxResolveOn: Cord.Chain.IS_IN_BLOCK });
  await Cord.connect(CORD_WSS_URL ?? "ws://localhost:9944");

  /* Creating a keypair from the AUTHOR_URI. */
  authorIdentity = await Crypto.makeKeypairFromUri(
    AUTHOR_URI ?? "//Alice",
    "sr25519"
  );
  try {
    const didDoc = await createDid(MNEMONIC, AGENT_DID_NAME);
    if (didDoc) {
      const { document: did, identity: keys } = didDoc;
      issuerDid = did;
      issuerKeys = keys;
    } else {
      console.log("Failed to Create issuer DID");
    }
    return didDoc?.document?.uri;
  } catch (error) {
    console.log("errorcheck", error);
  }
  return null;
}

export async function addRegistryAdminDelegate(
  authorAccount: Cord.CordKeyringPair,
  creator: Cord.DidUri,
  registryUri: Cord.IRegistry["identifier"],
  adminAuthority: Cord.DidUri,
  signCallback: Cord.SignExtrinsicCallback
): Promise<Cord.AuthorizationId> {
  const api = Cord.ConfigService.get("api");

  const authId = Cord.Registry.getAuthorizationIdentifier(
    registryUri,
    adminAuthority,
    creator
  );

  try {
    await Cord.Registry.verifyAuthorization(authId);
    console.log("Registry Authorization already stored. Skipping addition");
    return authId;
  } catch {
    console.log("Regisrty Authorization not present. Creating it now...");
    // Authorize the tx.
    const registryId = Cord.Registry.uriToIdentifier(registryUri);
    const delegateId = Cord.Did.toChain(adminAuthority);
    console.log(registryId, delegateId, authId, creator);
    const tx = api.tx.registry.addAdminDelegate(registryId, delegateId);
    const extrinsic = await Cord.Did.authorizeTx(
      creator,
      tx,
      signCallback,
      authorAccount.address
    );
    // Write to chain then return the Schema.
    await Cord.Chain.signAndSubmitTx(extrinsic, authorAccount);

    return authId;
  }
}


export async function createStream(
  issuer: Cord.DidUri,
  authorAccount: Cord.CordKeyringPair,
  signCallback: Cord.SignExtrinsicCallback,
  document: Cord.IDocument,
  authorizationId: Cord.AuthorizationId
): Promise<void> {
  const api = Cord.ConfigService.get('api');

  // Create a stream object
  const { streamHash } = await Cord.Stream.fromDocument(document);
  const authorization = Cord.Registry.uriToIdentifier(authorizationId);
  const schemaId = Cord.Registry.uriToIdentifier(document?.content?.schemaId);
  const streamTx = api.tx.stream.create(streamHash, authorization, schemaId);
  const authorizedStreamTx = await Cord.Did.authorizeTx(
      issuer,
      streamTx,
      signCallback,
      authorAccount.address
  );
  await Cord.Chain.signAndSubmitTx(authorizedStreamTx, authorAccount);
}


export async function getSchema(res: express.Response, schemaId: string) {
  if (schemaId === undefined) {
    return undefined;
  }

  let schema = await getConnection().getRepository(Schema).findOne(schemaId);

  if (!schema) {
    schema = await getConnection()
      .getRepository(Schema)
      .createQueryBuilder("schema")
      .where("schema.publicId = :id", { id: schemaId })
      .getOne();
    if (!schema) {
      return null;
    }
  }

  return schema;
}


export async function getRegistry(res: express.Response, registryId: string) {
  if (registryId === undefined) {
    return undefined;
  }

  let registry = await getConnection().getRepository(Regisrty).findOne(registryId);

  if (!registry) {
    registry = await getConnection()
      .getRepository(Regisrty)
      .createQueryBuilder("registry")
      .where("registry.publicId = :id", { id: registryId })
      .getOne();
    if (!registry) {
      return null;
    }
  }

  return registry;
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
    data.schema.title,
    data.schema.properties,
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

    return schema;
  }
}


export async function ensureStoredRegistry(
  title: any,
  description: any,
  authorAccount: Cord.CordKeyringPair,
  creator: Cord.DidUri,
  schemaUri: Cord.ISchema["$id"],
  signCallback: Cord.SignExtrinsicCallback
): Promise<Cord.IRegistry> {
  const api = Cord.ConfigService.get("api");

  const registryDetails: Cord.IContents = {
    title: title,
    description: description,
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