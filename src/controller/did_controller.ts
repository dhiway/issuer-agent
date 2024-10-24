import * as Cord from '@cord.network/sdk';
import express from 'express';
import 'reflect-metadata';
import { processServiceData } from '../utils/DidValidationUtils'
import { mnemonicGenerate } from '@polkadot/util-crypto';
import {
  addDelegateAsRegistryDelegate,
  authorIdentity,
  createDidName,
} from '../init';


export async function generateDid(
  req: express.Request,
  res: express.Response
) {

  try {
    if (!authorIdentity) {
      await addDelegateAsRegistryDelegate();
    }
    const api = Cord.ConfigService.get('api');
    const mnemonic = mnemonicGenerate(24);

    const delegateKeys = Cord.Utils.Keys.generateKeypairs(mnemonic, 'sr25519');
    const {
      authentication,
      keyAgreement,
      assertionMethod,
      capabilityDelegation,
    } = delegateKeys;

    const didUri = Cord.Did.getDidUriFromKey(authentication);

    const serviceData = req.body.services[0];
    const processedService = processServiceData(serviceData);

    const didCreationTx = await Cord.Did.getStoreTx(
      {
        authentication: [authentication],
        keyAgreement: [keyAgreement],
        assertionMethod: [assertionMethod],
        capabilityDelegation: [capabilityDelegation],
        service: processedService.length > 0 ? processedService : [
          {
            id: '#my-service',
            type: ['service-type'],
            serviceEndpoint: ['https://www.example.com'],
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

    const encodedDid = await api.call.didApi.query(Cord.Did.toChain(didUri));
    const { document } = Cord.Did.linkedInfoFromChain(encodedDid);

    if (!document) {
      throw new Error('DID was not successfully created.');
    }

    return res.status(200).json({ mnemonic, delegateKeys, document });
  } catch (error) {
    console.log('err: ', error);
    return res.status(500).json({ error: 'Did not created' });
  }
}



