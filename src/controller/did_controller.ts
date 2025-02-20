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
    const didDoc = await resolve2Did(didUri);

    if (!didDoc) {
      return res.status(404).json({ error: 'DID document not found' });
    }

    const webDid = didDoc.uri.replace('did:cord', `did:web:${WEB_URL}`);
    const context = [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ];

    const { authentication, assertionMethod } = didDoc;
    const verificationMethod = [];

    // Process authentication method
    if (authentication?.[0]) {
      const [authMethod] = authentication;
      delete authMethod.publicKey;
      const authEntry = createVerificationMethod(authMethod, webDid, 'auth');
      verificationMethod.push(authEntry);
      didDoc.authentication = [authEntry.id];
    }

    // Process assertion method
    if (assertionMethod?.[0]) {
      const [assertMethod] = assertionMethod;
      delete assertMethod.publicKey;
      const assertEntry = createVerificationMethod(
        assertMethod,
        webDid,
        'assert'
      );
      verificationMethod.push(assertEntry);
      didDoc.assertionMethod = [assertEntry.id];
    }

    const resolvedDocument = {
      '@context': context,
      ...didDoc,
      id: webDid,
      verificationMethod,
    };

    // Remove unwanted properties
    const {
      uri,
      service,
      capabilityDelegation,
      keyAgreement,
      ...cleanDocument
    } = resolvedDocument;

    return res.status(200).json(cleanDocument);
  } catch (error) {
    console.error('DID resolution error:', error);
    return res.status(500).json({ error: 'DID resolution failed' });
  }
}

export async function resolve2Did(didUri: string) {
  try {
    const resolved = await Cord.Did.resolve(didUri as `did:cord:3${string}`);
    if (!resolved?.document) return null;

    const processKey = (method: any) => {
      const publicKeyHex = Cord.u8aToHex(method.publicKey);
      return {
        ...method,
        publicKeyHex,
        publicKeyMultibase: `z${encodeAddress(publicKeyHex)}`,
      };
    };

    return {
      ...resolved.document,
      authentication: resolved.document.authentication?.map(processKey),
      assertionMethod: resolved.document.assertionMethod?.map(processKey),
    };
  } catch (error) {
    console.error('DID processing error:', error);
    return null;
  }
}

function createVerificationMethod(
  method: any,
  controller: string,
  type: 'auth' | 'assert'
) {
  return {
    ...method,
    type: 'Ed25519VerificationKey2020',
    id: `${controller}#${type}-key`,
    controller,
  };
}
