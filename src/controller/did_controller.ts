import * as Cord from '@cord.network/sdk';
import express from 'express';
import 'reflect-metadata';

import { createDid, getDidDocFromName } from '../init';
import { studio_encrypt } from '../identity/org';

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
