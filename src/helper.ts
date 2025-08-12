import { createAccount } from '@cord.network/vc-export';
import { dataSource } from './dbconfig';
import { Profile } from './entity/Profile';
import { cacheUserData } from './controller/redis_controller';
import { studio_decrypt } from './identity/org';

export async function getAccount(address: string) {
  const profile = await dataSource.getRepository(Profile).findOne({
    where: { address },
  });
  if (!profile) {
    throw new Error('Profile not found for the provided address');
  }

  const mnemonicEncrypted = profile.mnemonic as string;
  const issuerAccountMnemonic = await cacheUserData(
    mnemonicEncrypted,
    async () => {
      const decryptedMnemonic = await studio_decrypt(
        JSON.parse(mnemonicEncrypted)
      );
      if (!decryptedMnemonic) {
        throw new Error('Failed to decrypt issuer account mnemonic');
      }
      return decryptedMnemonic;
    }
  );

  // Found out that accessing account directly is faster compared to destructuring
  const account = createAccount(issuerAccountMnemonic).account;
  if (!account) {
    throw new Error('Failed to create account. Please try again.');
  }

  return account;
}
