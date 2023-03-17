import * as Cord from "@cord.network/sdk";
import { Crypto } from "@cord.network/utils";
import { ensureStoredSchema } from "./utils/generateSchema";
import { ensureStoredRegistry } from "./utils/generateRegistry";
import { requestCredential } from "./utils/requestCredential";
import { createPresentation } from "./utils/createPresentation";
import { createStream } from "./utils/createStream";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import {
  blake2AsU8a,
  keyExtractPath,
  keyFromPath,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  sr25519PairFromSeed,
} from "@polkadot/util-crypto";
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();

const { MNEMONIC } = process.env;

export async function schemaCreate(
  req: express.Request,
  res: express.Response
) {
  const mnemonic: any = MNEMONIC;
  const authorIdentity = Crypto.makeKeypairFromUri("//Bob", "sr25519");

  console.log(`\n❄️  Schema Creation `);

  createDid(mnemonic).then(async ({ issuerKeys, uri }) => {
    const schema = await ensureStoredSchema(
      authorIdentity,
      uri,
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod?.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      })
    );
    console.dir(schema, {
      depth: null,
      colors: true,
    });
    console.log("✅ Schema created!");
  });
}



export async function registryCreate(
  req: express.Request,
  res: express.Response
) {
  const mnemonic: any = MNEMONIC;

  const authorIdentity = Crypto.makeKeypairFromUri("//Bob", "sr25519");
  createDid(mnemonic)
    .then(async ({ issuerKeys, uri }) => {
      const schema = await ensureStoredSchema(
        authorIdentity,
        uri,
        async ({ data }) => ({
          signature: issuerKeys.assertionMethod?.sign(data),
          keyType: issuerKeys.assertionMethod.type,
        })
      );

      console.log(`\n❄️  Registry Creation `);

      const registry = await ensureStoredRegistry(
        authorIdentity,
        uri,
        schema["$id"],
        async ({ data }) => ({
          signature: issuerKeys.assertionMethod.sign(data),
          keyType: issuerKeys.assertionMethod.type,
        })
      );
      console.dir(registry, {
        depth: null,
        colors: true,
      });
      console.log("✅ Registry created!");
    })
    .catch((err) => {
      console.log(err.message);
    });
}



export async function credentialCreate(
  req: express.Request,
  res: express.Response
) {
  const mnemonic: any = MNEMONIC;
  const authorIdentity = Crypto.makeKeypairFromUri("//Bob", "sr25519");

  createDid(mnemonic).then(async ({ issuerKeys, uri }) => {
    const holderDid: any = {
      uri: "did:cord:3wpcRRjLSq75mozuBgaezq9mCd5GYGKtyfmJXkjDpTc5pxVX",
    };

    const schema = await ensureStoredSchema(
      authorIdentity,
      uri,
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod?.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      })
    );

    console.log(`\n❄️  Credential Creation `);
    const credential = requestCredential(holderDid.uri, uri, schema);
    console.dir(credential, {
      depth: null,
      colors: true,
    });
    await createStream(
      uri,
      authorIdentity,
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      }),
      credential
    );
    console.log("✅ Credential created!");
  });
}



export async function presentationCreate(
  req: express.Request,
  res: express.Response
) {
  const mnemonic: any = MNEMONIC;
  const authorIdentity = Crypto.makeKeypairFromUri("//Bob", "sr25519");

  function getChallenge(): string {
    return Cord.Utils.UUID.generate();
  }

  createDid(mnemonic).then(async ({ issuerKeys, uri }) => {
    const holderDid: any = {
      uri: "did:cord:3wpcRRjLSq75mozuBgaezq9mCd5GYGKtyfmJXkjDpTc5pxVX",
    };

    const schema = await ensureStoredSchema(
      authorIdentity,
      uri,
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod?.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      })
    );
    const credential = requestCredential(holderDid.uri, uri, schema);

    console.log(`\n❄️  Presentation Creation `);
    const challenge = getChallenge();
    const presentation = await createPresentation(
      credential,
      async (): Promise<any> => ({
        signature: "fhbjesbd333",
        keyType: "rer23r2",
        keyUri: "ewrfw34r4we",
      }),
      ["name", "id"],
      challenge
    );
    console.dir(presentation, {
      depth: null,
      colors: true,
    });
    console.log("✅ Presentation created!");
  });
}

export async function cred(req: express.Request, res: express.Response) {
  const mnemonic = mnemonicGenerate(24);

  const networkAddress = "ws://127.0.0.1:9944";
  await Cord.connect(networkAddress);
  await cryptoWaitReady();

  const authorIdentity = Crypto.makeKeypairFromUri("//Bob", "sr25519");

  // schema creation
  console.log(`\n❄️  Schema Creation `);

  createDid(mnemonic).then(async ({ issuerKeys, uri }) => {
    const issuerDid: any = {
      uri: uri,
    };
    const holderDid: any = {
      uri: "did:cord:3wpcRRjLSq75mozuBgaezq9mCd5GYGKtyfmJXkjDpTc5pxVX",
    };

    const schema = await ensureStoredSchema(
      authorIdentity,
      uri,
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod?.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      })
    );
    console.dir(schema, {
      depth: null,
      colors: true,
    });
    console.log("✅ Schema created!");

    // Step 3: Create a new Registry
    console.log(`\n❄️  Registry Creation `);

    const registry = await ensureStoredRegistry(
      authorIdentity,
      uri,
      schema["$id"],
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      })
    );
    console.dir(registry, {
      depth: null,
      colors: true,
    });
    console.log("✅ Registry created!");

    // Step 4: Create a new Credential
    console.log(`\n❄️  Credential Creation `);
    const credential = requestCredential(holderDid.uri, uri, schema);
    console.dir(credential, {
      depth: null,
      colors: true,
    });
    await createStream(
      uri,
      authorIdentity,
      async ({ data }) => ({
        signature: issuerKeys.assertionMethod.sign(data),
        keyType: issuerKeys.assertionMethod.type,
      }),
      credential
    );
    console.log("✅ Credential created!");

    // Step 5: Create a Presentation
    function getChallenge(): string {
      return Cord.Utils.UUID.generate();
    }

    console.log(`\n❄️  Presentation Creation `);
    const challenge = getChallenge();
    const presentation = await createPresentation(
      credential,
      async (): Promise<any> => ({
        signature: "fhbjesbd333",
        keyType: "rer23r2",
        keyUri: "ewrfw34r4we",
      }),
      ["name", "id"],
      challenge
    );
    console.dir(presentation, {
      depth: null,
      colors: true,
    });
    console.log("✅ Presentation created!");
    return res.json({ Status: presentation });
  });
}

export async function createDid(_mnemonic: string) {
  let issuerKeys;
  let mnemonic: string = _mnemonic;
  const networkAddress = "ws://127.0.0.1:9944";
  // Cord.ConfigService.set({ submitTxResolveOn: Cord.Chain.IS_IN_BLOCK })
  try {
    await Cord.connect(networkAddress);
  } catch (error) {
    console.log(error);
  }

  const api = Cord.ConfigService.get("api");
  const authorIdentity = Crypto.makeKeypairFromUri("//Bob", "sr25519");
  function createAccount(mnemonic = mnemonicGenerate()): {
    account: Cord.CordKeyringPair;
    mnemonic: string;
  } {
    const keyring = new Cord.Utils.Keyring({
      ss58Format: 29,
      type: "sr25519",
    });
    return {
      account: keyring.addFromMnemonic(mnemonic) as Cord.CordKeyringPair,
      mnemonic,
    };
  }

  function generateKeyAgreement(mnemonic: string) {
    const secretKeyPair = sr25519PairFromSeed(mnemonicToMiniSecret(mnemonic));
    const { path } = keyExtractPath("//did//keyAgreement//0");
    const { secretKey } = keyFromPath(secretKeyPair, path, "sr25519");
    return Cord.Utils.Crypto.makeEncryptionKeypairFromSeed(
      blake2AsU8a(secretKey)
    );
  }

  function generateKeypairs(mnemonic = mnemonicGenerate()) {
    const { account } = createAccount(mnemonic);

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

  const {
    authentication,
    keyAgreement,
    assertionMethod,
    capabilityDelegation,
  } = (issuerKeys = generateKeypairs(mnemonic));

  try {
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
      authorIdentity.address,
      async ({ data }) => ({
        signature: authentication.sign(data),
        keyType: authentication.type,
      })
    );
    await Cord.Chain.signAndSubmitTx(didCreationTx, authorIdentity);
  } catch (error) {
    console.log(error);
  }

  let documents: any;

  try {
    const didUri = Cord.Did.getDidUriFromKey(authentication);
    const encodedDid = await api.call.did.query(Cord.Did.toChain(didUri));
    const { document } = Cord.Did.linkedInfoFromChain(encodedDid);
    documents = document;

  } catch (error) {
    
  }

  return { issuerKeys: issuerKeys, uri: documents.uri };
}
