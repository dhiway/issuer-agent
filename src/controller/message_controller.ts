import express from 'express';
import { getConnection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import * as Cord from '@cord.network/sdk';

import { Cred } from '../entity/Cred';
import { Message } from '../entity/Message';


export async function getAllMessageForDid(req: express.Request, res: express.Response) {
    /* TODO: build authentication based on did key */
    const unread = req.query.unread && req.query.unread === '0' ? false : true;
    const messages = await getConnection()
        .getRepository(Message)
        .createQueryBuilder('msg')
        .where('msg.did = :did', { did: req.params.did })
        .andWhere('msg.unread = :unread', { unread: unread })
        .getMany();

    if (!messages) {
        return res.json([]);
    }
    if (unread) {
        try {
            messages.forEach((msg) => { msg.unread = false});
            await getConnection().manager.save(messages);
        } catch (err) {
            console.log("Error: ", err);
        }
    }
    return res.json(messages);
}

export async function getMessage(req: express.Request, res: express.Response) {
    /* TODO: build authentication based on did key */
    const msg = await getConnection()
        .getRepository(Message)
        .createQueryBuilder('msg')
        .where('msg.did = :did', { did: req.params.did })
        .andWhere('msg.id = :id', { id: req.params.id })
        .getOne();

    if (!msg) {
        return res.json({});
    }
    if (msg.unread) {
        msg.unread = false;
        try {
            await getConnection().manager.save(msg);
        } catch (err) {
            console.log("error: ", err);
        }
    }
    return res.json(msg);
}


export async function receiveMessage(req: express.Request, res: express.Response) {
    const data = req.body;
    let message = new Message();
    message.id = data.id;
    message.fromDid = data.fromDid; /* TODO: check the signature */
    message.did = req.params.did;
    message.unread = true;
    message.details = data.message;
    /* TODO: expect the package as 'base64', encrypted data from sender */
    if (data.type === 'document') {
        /* insert the message into 'cred' */
        const cred = new Cred();
        const document = data.message;
        cred.identifier = document.identifier;
        cred.active = true;
        cred.userId = data.toDid;
        cred.credential = JSON.stringify(document);
        cred.hash = document.documentHash;
        cred.details = {
            meta: 'endpoint-received',
        };
        try {
            await getConnection().manager.save(cred);
        } catch (err: any) {
            console.log('Error: ', err);
        }
    }
    try {
        await getConnection().manager.save(message);
        res.json({ success: true })
    } catch (err) {
        res.status(400).json({error: err})
    }
}
