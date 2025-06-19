import * as Cord from '@cord.network/sdk';
import { Request, Response } from 'express';
import { createAccount } from '@cord.network/vc-export';
import { blake2AsHex } from '@polkadot/util-crypto';

const { STASH_ACC_ADDRESS } = process.env;
const TRANSFER_AMOUNT = 100 * 10 ** 12; // 100 WAY for transactions

interface ProfileResponse {
  profileId: string;
  address: string;
  publicKey: string;
  mnemonic: string;
}

interface RawProfileData {
  pub_name: string;
}

async function fundAccount(
  api: any,
  accountAddress: string,
  amount: number
): Promise<void> {
  if (!STASH_ACC_ADDRESS) {
    throw new Error('STASH_ACC_ADDRESS environment variable is not set');
  }

  console.log(`💸 Funding account ${accountAddress}...`);

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Transaction timeout after 30 seconds'));
    }, 30000);

    api.tx.balances
      .transferKeepAlive(accountAddress, amount)
      .signAndSend(STASH_ACC_ADDRESS, (result: any) => {
        try {
          if (result.status.isInBlock || result.status.isFinalized) {
            clearTimeout(timeout);
            console.log(
              `✅ Account ${accountAddress} funded with ${
                amount / 10 ** 12
              } WAY`
            );
            resolve();
          }

          if (result.isError) {
            clearTimeout(timeout);
            reject(new Error(`Transaction failed: ${result.toString()}`));
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      })
      .catch((error: Error) => {
        clearTimeout(timeout);
        console.error(`❌ Failed to fund account ${accountAddress}`);
        reject(error);
      });
  });
}

async function createProfileOnChain(
  api: any,
  account: any,
  profileData: RawProfileData
): Promise<string> {
  console.log(`📝 Creating profile for ${account.address}...`);

  // Hash profile data
  const hashedProfileData: [string, string][] = Object.entries(profileData).map(
    ([key, value]) => [key, blake2AsHex(value)] as [string, string]
  );

  // Create profile on chain
  await Cord.Profile.dispatchSetProfileToChain(hashedProfileData, account);
  console.log('✅ Profile created successfully');

  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`🔍 Querying accountProfiles for ${account.address}...`);
      const profileData = await api.query.profile.accountProfiles(
        account.address
      );

      if (!profileData.isNone) {
        const profileId = profileData.unwrap().toHuman()?.toString();
        if (profileId) {
          console.log(`✅ Profile ID: ${profileId}`);
          return profileId;
        }
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries--;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `No profile found for account ${account.address} after retries`
  );
}

export async function getProfile(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const api = Cord.ConfigService.get('api');
    if (!api) {
      return res.status(500).json({
        error: 'Failed to initialize Cord API',
      });
    }

    // Create account
    const { account, mnemonic } = createAccount();
    if (!account || !mnemonic) {
      return res.status(500).json({
        error: 'Failed to create account. Please try again.',
      });
    }

    // Fund account
    await fundAccount(api, account.address, TRANSFER_AMOUNT);

    // This is optional, you can pass any raw profile data you want
    // For example, you can use the issuer's name or any other identifier
    // Here we are using a simple example with a public name
    const rawProfileData: RawProfileData = {
      pub_name: 'Issuer',
    };

    // Create profile
    const profileId = await createProfileOnChain(api, account, rawProfileData);

    // Return success response
    const response: ProfileResponse = {
      profileId,
      address: account.address,
      publicKey: `0x${Buffer.from(account.publicKey).toString('hex')}`,
      mnemonic,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error(
      '❌ Profile creation failed:',
      error instanceof Error ? error.message : error
    );

    return res.status(500).json({
      error: 'Profile creation failed',
      details:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
