import * as Cord from '@cord.network/sdk';
import express from 'express';
import 'reflect-metadata';
import { u8aToHex } from '@cord.network/sdk';
import { createDid, getDidDocFromName } from '../init';
import { studio_encrypt } from '../identity/org';
import {  encodeAddress } from '@polkadot/util-crypto'


export async function generateDid(req: express.Request, res: express.Response) {
  const { didName } = req.body;

  try {
    const { document } = await createDid(didName);

    return res.status(200).json({
      result: {
        message: 'Successfully created did',
        document,
      },
    });
  } catch (error) {
    console.log('err: ', error);
    return res.status(400).json({ error: 'Did not created' });
  }
}

export async function didNameNewCheck(
  req: express.Request,
  res: express.Response
) {
  const id = req.params.id;
  const api = Cord.ConfigService.get('api');

  try {
    const encodedDidNameOwner = await api.call.didApi.queryByName(id);

    // Check if the DID has a linked URI
    const hasUri = encodedDidNameOwner?.isSome
      ? Boolean(
          Cord.Did.linkedInfoFromChain(encodedDidNameOwner)?.document?.uri
        )
      : false;

    return res.status(200).json({ result: hasUri });
  } catch (error) {
    console.error('Error querying DID name:', error);
    return res
      .status(400)
      .json({ success: false, message: 'Internal server error' });
  }
}

export async function getDidDoc(req: express.Request, res: express.Response) {
  try {
    const didName = req.params.id;

    const didUri = await getDidDocFromName(didName);

    return res.status(200).json({
      result: { message: 'Did Successfully fetched', didUri },
    });
  } catch (error) {
    console.error('Error in did fetch', error);
    return res
      .status(400)
      .json({ success: false, message: 'Internal server error' });
  }
}

export async function resolveDid(req: express.Request, res: express.Response) {
  try {
    const didUri = req.params.id;

    const didDoc = await Cord.Did.resolve(didUri as `did:cord:3${string}`);

    console.log('didDoc: ', didDoc);

    let didResponse: any = { ...didDoc?.document };
    if (didDoc) {
      let a = u8aToHex(didResponse.assertionMethod[0].publicKey);
      didResponse.assertionMethod[0]!.publicKeyHex = a;
      delete didResponse.assertionMethod[0]?.publicKey;
      didResponse.assertionMethod[0]!.publicKeyMultibase = 'z' + encodeAddress(a);
      console.log('didDoc2: ', didResponse);

      let b = u8aToHex(didResponse.authentication[0].publicKey);
      didResponse.authentication[0]!.publicKeyHex = b;
      didResponse.authentication[0]!.publicKeyMultibase = 'z' + encodeAddress(b);
      delete didResponse.authentication[0]?.publicKey;
    }

    return res.status(200).json({
      result: {
        message: 'Successfully fetched didUri',
        didDoc: didResponse,
      },
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(400).json({ error: 'Did resolution failed' });
  }
}
