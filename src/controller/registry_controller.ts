import * as Cord from '@cord.network/sdk';
import { Request, Response } from 'express';
import { CordKeyringPair } from '@cord.network/types';

import { Profile } from '../entity/Profile';
import { createAccount } from './profile_controller';
import { dataSource } from '../dbconfig';
import { Registry } from '../entity/Registry';

interface RegistryCreatedEventData {
  registry_: string;
  creator: string;
  profileId: string;
  [key: string]: any;
}

export async function createRegistry(req: Request, res: Response) {
  try {
    const { schema, address } = req.body;
    const api = Cord.ConfigService.get('api');

    // 🔄 Create Registry
    console.log('\n🔄 Creating registry...');

    const profile = await dataSource.getRepository(Profile).findOne({
      where: { address: address },
    });

    if (!profile) {
      return res.status(400).json({
        error: 'Profile not found for the provided address',
      });
    }

    const { mnemonic } = profile;
    if (!mnemonic) {
      return res.status(400).json({
        error: 'Mnemonic not found for the profile',
      });
    }

    const { account } = createAccount(mnemonic);
    if (!account) {
      return res.status(500).json({
        error: 'Failed to create account. Please try again.',
      });
    }
    console.log('account: ', account.address);

    const registryBlob = {
      title: 'Issuer_agent registry',
      schema: JSON.stringify(schema),
      date: new Date().toISOString(),
    };
    
    const registryStringifiedBlob = JSON.stringify(registryBlob);
    const registryTxHash = await Cord.Registry.getDigestFromRawData(
      registryStringifiedBlob
    );

    const registryProperties = await Cord.Registry.registryCreateProperties(
      registryTxHash,
      null // no blob
    );

    await Cord.Registry.dispatchCreateToChain(
      registryProperties,
      account as CordKeyringPair
    );

    const eventData = await new Promise<RegistryCreatedEventData>(
      (resolve, reject) => {
        let unsubscribe: () => void;
        api.query.system
          .events((events) => {
            events.forEach(({ phase, event }) => {
              if (
                phase.isApplyExtrinsic &&
                api.events.registry.RegistryCreated.is(event)
              ) {
                console.log(
                  "'Registry Created' Event Data",
                  event.data.toHuman()
                );
                const eventObj = event.data.toHuman();
                resolve(eventObj as RegistryCreatedEventData);
                if (unsubscribe) unsubscribe();
              }
            });
          })
          .then((unsub) => {
            unsubscribe = unsub;
          });

        setTimeout(() => {
          if (unsubscribe) unsubscribe();
          reject(new Error('Timeout: RegistryCreated event not found'));
        }, 10_000); // 10s
      }
    );

    const registry = new Registry();
    registry.registryId = eventData.registry_;
    registry.schema = schema;
    registry.address = eventData.creator;
    registry.profileId = eventData.profileId;

    await dataSource.manager.save(registry);
    console.log(`✅ Registry created with URI: ${registry.registryId}`);

    return res.status(201).json({
      message: 'Registry created successfully',
      registryId: registry.registryId,
      schema: registry.schema,
      address: registry.address,
      profileId: registry.profileId,
    });
  } catch (error) {
    console.error('Error creating registry:', error);
    res.status(500).json({ error: 'Failed to create registry' });
  }
}
