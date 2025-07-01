import * as Cord from '@cord.network/sdk';
import { Request, Response } from 'express';
import { CordKeyringPair } from '@cord.network/types';

import { Profile } from '../entity/Profile';
import { dataSource } from '../dbconfig';
import { Registry } from '../entity/Registry';
import { waitForEvent } from '../utils/Events';
import { getAccount } from '../helper';

export async function createRegistry(req: Request, res: Response) {
  try {
    const { schema, address } = req.body;
    const api = Cord.ConfigService.get('api');

    // 🔄 Create Registry
    console.log('\n🔄 Creating registry...');

    const issuerAccount = await getAccount(address);
    if (!issuerAccount) {
      return res.status(400).json({ error: 'Invalid issuer account' });
    }

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
      issuerAccount as CordKeyringPair
    );

    const eventData: any = (await waitForEvent(api, (event: any) =>
      api.events.registry.RegistryCreated.is(event)
    )) as string;

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
    });
  } catch (error) {
    console.error('Error creating registry:', error);
    res.status(500).json({ error: 'Failed to create registry' });
  }
}

export async function getRegistry(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Registry ID is required' });
    }
    const registry = await dataSource
      .getRepository(Registry)
      .findOne({ where: { registryId: req.params.id } });

    if (!registry) {
      return res.status(404).json({ error: 'Registry not found' });
    }

    return res.status(200).json(registry);
  } catch (error) {
    console.error('Error fetching registry:', error);
    return res.status(500).json({ error: 'Failed to fetch registry' });
  }
}
