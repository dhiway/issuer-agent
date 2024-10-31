import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import { KeyringInstance, KeyringPair } from '@polkadot/keyring/types';
import {
    mnemonicToMiniSecret,
    mnemonicGenerate,
    naclDecrypt,
    naclEncrypt,
} from '@polkadot/util-crypto';
import { stringToU8a, u8aToString, u8aToHex, hexToU8a } from '@polkadot/util';
import nacl, { BoxKeyPair } from 'tweetnacl';

export type Identity = {
    key: KeyringPair;
    boxPair: BoxKeyPair;
};

export type EncryptedString = {
    encrypt: string;
    nonce: string;
};

let studio_identity: Identity;

let keyring: KeyringInstance;

async function keyringInit() {
    await cryptoWaitReady();

    keyring = new Keyring({ type: 'sr25519', ss58Format: 29 });
}

async function generateNewKey(phrase: string) {
    if (!keyring) {
        await keyringInit();
    }
    const seed = mnemonicToMiniSecret(phrase);
    return {
        key: keyring.addFromSeed(seed),
        boxPair: nacl.box.keyPair.fromSecretKey(seed),
    };
}

export async function studio_identity_init(mnemonic: string) {
    studio_identity = await generateNewKey(mnemonic);
}

export async function org_identity_create() {
    const mnemonic = mnemonicGenerate();
    const org: [string, Identity] = [mnemonic, await generateNewKey(mnemonic)];
    return org;
}

export async function encrypt(key: Identity, u8data: Buffer) {
    //const u8data = stringToU8a(data);
    const { encrypted, nonce } = naclEncrypt(u8data, key.boxPair.secretKey);
    return { encrypt: u8aToHex(encrypted), nonce: u8aToHex(nonce) };
}

export async function decrypt(key: Identity, encrypted: EncryptedString) {
    const decrypt = naclDecrypt(
        hexToU8a(encrypted.encrypt),
        hexToU8a(encrypted.nonce),
        key.boxPair.secretKey
    );
    return decrypt;
}

export async function studio_encrypt(mnemonic: string) {
    const u8data = stringToU8a(mnemonic);
    const { encrypted, nonce } = naclEncrypt(
        u8data,
        studio_identity.boxPair.secretKey
    );
    return { encrypt: u8aToHex(encrypted), nonce: u8aToHex(nonce) };
}

export async function studio_decrypt(encrypted: EncryptedString) {
    const decrypt = naclDecrypt(
        hexToU8a(encrypted.encrypt),
        hexToU8a(encrypted.nonce),
        studio_identity.boxPair.secretKey
    );
    return u8aToString(decrypt);
}

export async function org_identity_from_mnemonic(mnemonic: string) {
    return await generateNewKey(mnemonic);
}

export async function org_identity_from_encrypted_mnemonic(
    encrypted: EncryptedString
) {
    const mnemonic = await studio_decrypt(encrypted);
    if (mnemonic) {
        return await generateNewKey(mnemonic);
    }
    return null;
}
