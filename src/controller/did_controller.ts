import * as Cord from '@cord.network/sdk';
import express from 'express';
import 'reflect-metadata';

import { createDid } from '../init';
import { studio_encrypt } from '../identity/org';

export async function generateDid(req: express.Request, res: express.Response) {
  const { didName } = req.body;

  try {
    const { mnemonic, document } = await createDid(didName);

    return res.status(200).json({
      result: {
        message: 'Successfully created did',
        mnemonic,
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

export async function encryptMnemonic(
  req: express.Request,
  res: express.Response
) {
  try {
    const { issuerMnemonic } = req.body;

    const encryptedMnemonic = JSON.stringify(
      await studio_encrypt(issuerMnemonic)
    );

    return res.status(200).json({
      result: { message: 'Encryption Successfully', encryptedMnemonic },
    });
  } catch (error) {
    console.error('Error in encryption', error);
    return res
      .status(400)
      .json({ success: false, message: 'Internal server error' });
  }
}
