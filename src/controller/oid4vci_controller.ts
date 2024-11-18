import express from 'express';
import { mnemonicToMiniSecret } from '@polkadot/util-crypto';
import base58 from 'bs58';
import {
  Secp256k1Key,
  Secp256k1Signature,
} from '@affinidi/tiny-lds-ecdsa-secp256k1-2019';
import * as jsigs from 'jsonld-signatures';
import { v4 as uuidv4 } from 'uuid';
import { secp256k1 } from 'ethereum-cryptography/secp256k1.js';

const mnemonic =
  'test walk nut penalty hip pave soap entry language right filter choice';

const vcTemplate: any = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      credentialSchema: {
        '@id': 'https://www.w3.org/2018/credentials#credentialSchema',
        '@type': '@id',
      },
      email: {
        '@id': 'schema-id:email',
        '@type': 'https://schema.org/Text',
      },
      studentName: {
        '@id': 'schema-id:studentName',
        '@type': 'https://schema.org/Text',
      },
      courseName: {
        '@id': 'schema-id:courseName',
        '@type': 'https://schema.org/Text',
      },
      instituteName: {
        '@id': 'schema-id:instituteName',
        '@type': 'https://schema.org/Text',
      },
      instituteLogo: {
        '@id': 'schema-id:instituteLogo',
        '@type': 'https://schema.org/Text',
      },
      dateOfCompletion: {
        '@id': 'schema-id:dateOfCompletion',
        '@type': 'https://schema.org/Text',
      },
      scoreAchieved: {
        '@id': 'schema-id:score',
        '@type': 'https://schema.org/Text',
      },
    },
  ],
  type: ['VerifiableCredential'],
};

async function signCredential(vc: any, key: any, verificationMethod: string) {
  /* suite is very important */
  const suite = new Secp256k1Signature({
    key,
    date: new Date().toISOString(),
  });

  /* this is used for signing */
  const signedDoc = await jsigs.sign(
    { ...vc },
    {
      suite,
      documentLoader: async (url: any) => {
        if (url.startsWith('https://')) {
          /* does this always work? */
          const response = await fetch(url);
          const json = await response.json();
          return {
            contextUrl: null,
            document: json,
            documentUrl: url,
          };
        }
      },
      purpose: new jsigs.purposes.AssertionProofPurpose(),
      compactProof: false,
    }
  );
  return signedDoc;
}

async function generateVC(content: any, holderDid: string) {
  let vc = { ...vcTemplate };

  const seed = mnemonicToMiniSecret(mnemonic);
  const privateKey = seed.slice(0, 32);
  const publicKey = secp256k1.getPublicKey(privateKey, true);

  const multicodecPrefixedKey = new Uint8Array([0xe7, 0x01, ...publicKey]);
  const encodedKey = base58.encode(multicodecPrefixedKey);

  const verificationMethod = `did:key:z${encodedKey}#z${encodedKey}`;
  const did = `did:key:z${encodedKey}`;

  const key = new Secp256k1Key({
    id: verificationMethod,
    controller: did,
    publicKeyHex: Buffer.from(publicKey).toString('hex'),
    privateKeyHex: Buffer.from(privateKey).toString('hex'),
  });

  vc.issuanceDate = new Date().toISOString();
  vc.holder = { id: holderDid };
  vc.id = 'cord:' + uuidv4();

  vc.credentialSubject = {
    id: holderDid,
    email: content.email,
    studentName: content.studentName,
    courseName: content.courseName,
    instituteName: content.instituteName,
    instituteLogo: content.instituteLogo,
    dateOfCompletion: content.dateOfCompletion,
    scoreAchieved: content.scoreAchieved,
  };

  vc.issuer = did;

  const signedVC = await signCredential(vc, key, verificationMethod);
  const wrappedVC = {
    credential: signedVC,
  };

  console.log('For Affinidi: \n', JSON.stringify(wrappedVC, null, 2));
  return wrappedVC;
}

// async function main() {
//   const content = {
//     email: 'amar@dhiway.com',
//     studentName: 'Amar Tumballi',
//     courseName: 'Masters in Data Analytics (Dhiway) ',
//     instituteName: 'Hogwarts University',
//     instituteLogo: '' /* TODO: send URL */,
//     dateOfCompletion: new Date().toISOString() /* TODO: make this a old date */,
//     scoreAchieved: '450/500',
//   };
//   const holderDid =
//     'did:web:oid4vci.demo.cord.network:3zKcL2oAsvZZwFA5uPxtysk5jsai2TGx4AvrpJcBYmAwzGyN';
//   await generateVC(content, holderDid);
// }

// main()
//   .then(() => console.log('\nBye! 👋 👋 👋 '))
//   .finally();

// process.on('SIGINT', async () => {
//   console.log('\nBye! 👋 👋 👋 \n');
//   //Cord.disconnect();
//   process.exit(0);
// });

export async function createVcForAffinidi(
  req: express.Request,
  res: express.Response
) {
  try {
    // Extract `content` and `holderDid` from the request body
    const { content } = req.body;
    /*
    const content = {
    email: 'amar@dhiway.com',
    studentName: 'Amar Tumballi',
    courseName: 'Masters in Data Analytics (Dhiway) ',
    instituteName: 'Hogwarts University',
    instituteLogo: '', 
    dateOfCompletion: new Date().toISOString(),
    scoreAchieved: '450/500',
    holderDid: 'did:web:oid4vci.demo.cord.network:3zKcL2oAsvZZwFA5uPxtysk5jsai2TGx4AvrpJcBYmAwzGyN'
  }; */
    console.log('content: ', content, req.body);
    const holderDid = content.holderDid;
    console.log('holderDid: ', holderDid);

    if (!content || !holderDid) {
      return res.status(400).json({
        error: 'Invalid request. `content` and `holderDid` are required.',
      });
    }

    // Generate the Verifiable Credential
    const signedVC = await generateVC(content, holderDid);
    console.log('signedVC: ', signedVC);

    // Respond with the signed VC
    res.status(200).json({
      result: {
        message: 'Verifiable Credential generated successfully',
        signedVC,
      },
    });
  } catch (error) {
    console.error('Error generating VC:', error);
    res.status(500).json({
      error: 'Failed to generate Verifiable Credential',
    });
  }
}
