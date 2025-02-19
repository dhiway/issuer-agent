import * as Cord from '@cord.network/sdk';
import { encodeAddress } from '@polkadot/util-crypto';
import { Request, Response } from 'express';
import express from 'express';
import 'reflect-metadata';

import { processServiceData } from '../utils/DidValidationUtils';
import {
  addDelegateAsRegistryDelegate,
  authorIdentity,
  createDid,
} from '../init';

const { WEB_URL } = process.env;

export async function generateDid(req: express.Request, res: express.Response) {
  try {
    if (!authorIdentity) {
      await addDelegateAsRegistryDelegate();
    }
    const serviceData = req.body.services[0];
    const processedService = processServiceData(serviceData);
    const { mnemonic, delegateKeys, document } = await createDid(
      authorIdentity,
      processedService
    );

    return res.status(200).json({ mnemonic, delegateKeys, document });
  } catch (error) {
    console.log('err: ', error);
    return res.status(500).json({ error: 'Did not created' });
  }
}

export async function resolveDid(req: Request, res: Response) {
  try {
    const didUri = `did:cord:${req.params.id}`;

    let didDoc = await resolve2Did(didUri);

    let id = didDoc.uri.replace('did:cord', `did:web:${WEB_URL}`);

    let authId;
    let assesId;

    delete didDoc.uri;
    didDoc.id = id;
    didDoc.verificationMethod = didDoc.authentication;
    didDoc.verificationMethod[0].type = 'Ed25519VerificationKey2020';
    authId = `${id}${didDoc.authentication[0].id}`;
    didDoc.verificationMethod[0].id = authId;
    didDoc.verificationMethod[0].controller = id;
    didDoc.authentication = [authId];

    // delete didDoc.authentication;
    didDoc.verificationMethod.push(didDoc.assertionMethod[0]);
    didDoc.verificationMethod[1].type = 'Ed25519VerificationKey2020';
    assesId = `${id}${didDoc.assertionMethod[0].id}`;
    didDoc.verificationMethod[1].id = assesId;
    didDoc.verificationMethod[1].controller = id;
    didDoc.assertionMethod = [assesId];
    // delete didDoc.assertionMethod;
    delete didDoc.service;
    delete didDoc.capabilityDelegation;
    delete didDoc.keyAgreement;
    /* fix the publicKey */
    console.log('document: ', didDoc);
    return res.status(200).json({
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
      ],
      ...didDoc,
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(400).json({ error: 'Did resolution failed' });
  }
}

export async function resolve2Did(didUri: string) {
  try {
    const didDoc = await Cord.Did.resolve(didUri as `did:cord:3${string}`);

    let didResponse: any = { ...didDoc?.document };
    if (didDoc) {
      let a = Cord.u8aToHex(didResponse.assertionMethod[0].publicKey);
      didResponse.assertionMethod[0]!.publicKeyHex = a;
      didResponse.assertionMethod[0]!.publicKeyMultibase =
        'z' + encodeAddress(a);
      delete didResponse.assertionMethod[0]?.publicKey;

      let b = Cord.u8aToHex(didResponse.authentication[0].publicKey);
      didResponse.authentication[0]!.publicKeyHex = b;
      didResponse.authentication[0]!.publicKeyMultibase =
        'z' + encodeAddress(b);
      delete didResponse.authentication[0]?.publicKey;
    }

    return didResponse;
  } catch (error) {
    console.log('error: ', error);
  }
}
