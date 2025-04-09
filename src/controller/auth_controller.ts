import express from 'express';
import { dataSource } from '../dbconfig';
import { Account } from '../entity/Account';
import { hash } from '../utils/helper';

export async function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [authType, authToken] = authHeader.split(' ');

  const account = await dataSource.manager.findOne(Account, {
    where: {
      token: hash(authToken),
      active: true,
    },
  });

  if (authType === 'Bearer' && account) {
    req.account = account;
    next();
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
