import * as Cord from '@cord.network/sdk';
import crypto from 'crypto';

import { Account } from '../entity/Account';

const { ENCRYPTION_PASSWORD } = process.env;

export function hash(value: string) {
  const hash = crypto.createHash('sha256');
  hash.update(value);
  return hash.digest('hex');
}

export async function getDidAndKeys(
  encryptedMnemonic: {
    salt: string;
    iv: string;
    encrypted: string;
    tag: string;
  },
  didDoc: any
) {
  let decryptedMnemonic;
  try {
    decryptedMnemonic = decryptMnemonic(
      encryptedMnemonic,
      ENCRYPTION_PASSWORD as string
    );
  } catch (err: any) {
    console.error(err.message);
  }

  if (!decryptedMnemonic) {
    throw new Error('decryptedMnemonic is undefined');
  }

  const issuerDid = JSON.parse(didDoc);
  const issuerKeysProperty = Cord.Utils.Keys.generateKeypairs(
    decryptedMnemonic,
    'sr25519'
  );

  return { issuerDid, issuerKeysProperty };
}

export function encryptMnemonic(
  mnemonic: string,
  password: string
): { salt: string; iv: string; encrypted: string; tag: string } {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(mnemonic, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    encrypted: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptMnemonic(
  encryptedData: { salt: string; iv: string; encrypted: string; tag: string },
  password: string
): string {
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  try {
    const decryptedBuffer = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decryptedBuffer.toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: incorrect password or tampered data');
  }
}
