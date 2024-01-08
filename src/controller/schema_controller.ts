import * as Cord from '@cord.network/sdk';
import express from 'express';
import { getConnection } from 'typeorm';
import 'reflect-metadata';

import { Schema } from '../entity/Schema';
import { authorIdentity, issuerDid, issuerKeysProperty } from '../init';

const { CHAIN_SPACE_ID, CHAIN_SPACE_AUTH } = process.env;

export async function createSchema(
  req: express.Request,
  res: express.Response
) {
  try {
    const data = req.body.schema;

    if (!data || !data.properties) {
      return res.status(400).json({
        error:
          "'schema' is a required field in the form of key-value pair, with title and description",
      });
    }

    let newSchemaName = data.title + ':' + Cord.Utils.UUID.generate();
    data.title = newSchemaName;

    let schemaDetails = Cord.Schema.buildFromProperties(
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
      schemaData.schemaProperties = JSON.stringify(data.properties);
      schemaData.cordSchema = JSON.stringify(schemaDetails);
      // schemaData.requiredFields = data.required;

      await getConnection().manager.save(schemaData);
      return res.status(200).json({
        result: 'SUCCESS',
        schemaId: schemaData.id,
        identifier: schemaData.identifier,
      });
    } else {
      res.status(400).json({ error: 'SchemaDetails not created' });
    }
  } catch (error) {
    console.log('err: ', error);
    throw new Error('Schema not created');
  }
}

export async function getSchemaById(
  req: express.Request,
  res: express.Response
) {
  try {
    const schema = await getConnection()
      .getRepository(Schema)
      .createQueryBuilder('schema')
      .where('schema.id = :id', { id: req.params.id })
      .getOne();

    return res.status(200).json({ schema: schema });
  } catch (error) {
    console.log('err: ', error);
    return res.status(400).json({ status: 'Schema not found' });
  }
}
