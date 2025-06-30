import { createAccount } from '@cord.network/vc-export';
import { dataSource } from './dbconfig';
import { Profile } from './entity/Profile';

export async function getAccount(address: string) {
  const profile = await dataSource.getRepository(Profile).findOne({
    where: { address },
  });
  if (!profile) {
    throw new Error('Profile not found for the provided address');
  }

  const { account } = createAccount(profile.mnemonic);
  if (!account) {
    throw new Error('Failed to create account. Please try again.');
  }

  return account;
}
