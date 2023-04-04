import * as Cord from "@cord.network/sdk";
import express from "express";
import { getConnection} from 'typeorm';

import { Schema } from './entity/Schema';

export async function ensureStoredSchema(
    authorAccount: Cord.CordKeyringPair,
    creator: Cord.DidUri,
    signCallback: Cord.SignExtrinsicCallback,
    req: express.Request,
    res: express.Response
): Promise<Cord.ISchema> {

    const data = req.body;

    const schemaData = new Schema();
    schemaData.name = data.name? data.name : '';
    schemaData.email = data.email? data.email: '';
    schemaData.registry = data.registry ? true : false;

    try {
        await getConnection().manager.save(schemaData);
    } catch (error) {
        console.log("SchemaData not saved in db", schemaData);
    }
    
    const api = Cord.ConfigService.get('api');

    const schema = Cord.Schema.fromProperties(
        'Email Schema',
        {
            name: {
                type: 'string',
            },
            email: {
                type: 'string',
            },
        },
        creator
    );


    try {
        await Cord.Schema.verifyStored(schema);
        console.log('Schema already stored. Skipping creation');
        return schema;
    } catch {
        console.log('Schema not present. Creating it now...');
        // Authorize the tx.
        const encodedSchema = Cord.Schema.toChain(schema);
        const tx = api.tx.schema.create(encodedSchema);
        const extrinsic = await Cord.Did.authorizeTx(
            creator,
            tx,
            signCallback,
            authorAccount.address
        );
        // Write to chain then return the Schema.
        await Cord.Chain.signAndSubmitTx(extrinsic, authorAccount);

        return schema;
    }
}