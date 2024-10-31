import * as Cord from '@cord.network/sdk';
import express from 'express';
import 'reflect-metadata';
import { validateSchema } from '../utils/SchemaValidationUtils';
import { extractSchemaFields } from '../utils/SchemaUtils';
import { Schema } from '../entity/Schema';

import {
  addDelegateAsRegistryDelegate,
  authorIdentity,
  issuerDid,
  issuerKeysProperty,
} from '../init';
import { dataSource } from '../dbconfig';

const { CHAIN_SPACE_ID, CHAIN_SPACE_AUTH } = process.env;

export async function createSchema(
  req: express.Request,
  res: express.Response
) {
  try {
    // if (!authorIdentity) {
    //   await addDelegateAsRegistryDelegate();
    // }

    let data = req.body.schema?.schema || req.body.schema || null;

    const validationError = validateSchema(data);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    data = extractSchemaFields(data);

    let newSchemaName = data.title + ':' + Cord.Utils.UUID.generate();
    data.title = newSchemaName;

    let schemaDetails = await Cord.Schema.buildFromProperties(
      data,
      CHAIN_SPACE_ID as `space:cord:${string}`,
      issuerDid.uri
    );

    console.dir(schemaDetails, {
      depth: null,
      colors: true,
    });

    const schemaUri = await Cord.Schema.dispatchToChain(
      schemaDetails.schema,
      issuerDid.uri,
      authorIdentity,
      CHAIN_SPACE_AUTH as `auth:cord:${string}`,
      async ({ data }) => ({
        signature: issuerKeysProperty.authentication.sign(data),
        keyType: issuerKeysProperty.authentication.type,
      })
    );
    console.log(`✅ Schema - ${schemaUri} - added!`);

    if (schemaDetails) {
      const schemaData = new Schema();
      schemaData.identifier = schemaUri;
      schemaData.title = data.title ? data.title : '';
      schemaData.description = data.description ? data.description : '';
      schemaData.schemaProperties = data.properties;
      schemaData.cordSchema = JSON.stringify(schemaDetails);
      schemaData.requiredFields = data.required;

      await dataSource.manager.save(schemaData);
      return res.status(200).json({
        result: { message: 'SUCCESS', schemaId: schemaData.identifier },
      });
    }
    return res.status(400).json({ error: 'SchemaDetails not created' });
  } catch (error) {
    console.log('err: ', error);
    return res.status(500).json({ error: 'Schema not created' });
  }
}

export async function getSchemaById(
  req: express.Request,
  res: express.Response
) {
  try {
    const schema = await dataSource
      .getRepository(Schema)
      .findOne({ where: { identifier: req.params.id } });

    if (!schema) {
      return res.status(400).json({ error: 'Schema not found' });
    }

    return res.status(200).json({ schema: schema });
  } catch (error) {
    console.log('err: ', error);
    return res.status(500).json({ error: 'Error Fetching Schema' });
  }
}
