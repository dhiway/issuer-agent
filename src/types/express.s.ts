import { Account } from '../entity/Account';

declare module 'express' {
  export interface Request {
    account?: Account;
  }
}
