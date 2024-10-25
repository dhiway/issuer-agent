import * as Cord from '@cord.network/sdk';
import express from 'express';
import 'reflect-metadata';
import { processServiceData } from '../utils/DidValidationUtils'
import { mnemonicGenerate } from '@polkadot/util-crypto';
import {
  addDelegateAsRegistryDelegate,
  authorIdentity,
  createDid
} from '../init';


export async function generateDid(
  req: express.Request,
  res: express.Response
) {

  try {
    if (!authorIdentity) {
      await addDelegateAsRegistryDelegate();
    }
    const serviceData = req.body.services[0];
    const processedService = processServiceData(serviceData);
    const { mnemonic, delegateKeys, document } = await createDid(authorIdentity, processedService);

    return res.status(200).json({ mnemonic, delegateKeys, document });
  } catch (error) {
    console.log('err: ', error);
    return res.status(500).json({ error: 'Did not created' });
  }
}



