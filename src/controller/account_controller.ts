import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { Account } from '../entity/Account';
import { addDelegateAsRegistryDelegate, createDid } from '../cord';
import { authorIdentity } from '../utils/cordConfig';
import { encryptMnemonic, hash } from '../utils/helper';
import { dataSource } from '../dbconfig';

const { ENCRYPTION_PASSWORD } = process.env;

export async function accountCreate(req: Request, res: Response) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { delegateMnemonic, delegateDid, delegateAuth } =
      await addDelegateAsRegistryDelegate(authorIdentity);

    const encryptedData = encryptMnemonic(
      delegateMnemonic,
      ENCRYPTION_PASSWORD as string
    );

    const token = hash(uuidv4());

    const account = new Account();
    account.name = name;
    account.token = hash(token);
    account.active = true;
    account.mnemonic = encryptedData;
    account.authorizationId = delegateAuth;
    account.didDocument = JSON.stringify(delegateDid);

    await dataSource.manager.save(account);

    return res
      .status(201)
      .json({ message: 'Account created successfully', data: { token } });
  } catch (error) {
    console.log('err: ', error);
    return res.status(500).json({ error: 'Account not created' });
  }
}
