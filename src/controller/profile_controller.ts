import * as Cord from '@cord.network/sdk';
import { createAccount } from '@cord.network/vc-export';
import { Request, Response } from 'express';
import { blake2AsHex } from '@polkadot/util-crypto';

import { cacheUserData } from './redis_controller';
import { Profile } from '../entity/Profile';
import { dataSource } from '../dbconfig';

const { STASH_ACC_MNEMONIC } = process.env;
const TRANSFER_AMOUNT = 100 * 10 ** 12; // 100 WAY for transactions

interface CreateProfileResponse {
  message: string;
  profileId: string;
  address: string;
  publicKey: string;
  mnemonic: string;
  createdAt?: number;
}

interface GetProfileResponse {
  profileId: string;
  address: string;
  exists: boolean;
  cachedAt?: number;
  source?: 'chain' | 'database' | 'cache';
}

interface RawProfileData {
  pub_name: string;
}

async function getExistingProfile(address: string): Promise<string | null> {
  return await cacheUserData(`profile_${address}`, async () => {
    console.log(`🔍 Fetching profile from chain for ${address}...`);
    const api = Cord.ConfigService.get('api');
    const profileData = await api.query.profile.accountProfiles(address);

    if (profileData.isNone) {
      return null;
    }

    const profileId = profileData.unwrap().toHuman()?.toString();
    console.log(`✅ Profile found: ${profileId}`);
    return profileId;
  });
}

async function getProfileFromDatabase(address: string): Promise<string | null> {
  try {
    console.log(`🔍 Fetching profile from database for ${address}...`);
    const profile = await dataSource.manager.findOne(Profile, {
      where: { address },
    });

    if (profile) {
      console.log(`✅ Profile found in database: ${profile.profileId}`);
      return profile.profileId as string;
    }

    console.log(`❌ No profile found in database for ${address}`);
    return null;
  } catch (error) {
    console.error(`❌ Database query failed for ${address}:`, error);
    throw error;
  }
}

async function getProfileWithFallback(address: string): Promise<{
  profileId: string | null;
  source: 'chain' | 'database' | 'cache';
}> {
  // First, try to get from chain (which includes Redis cache)
  try {
    const profileId = await getExistingProfile(address);

    if (profileId) {
      return {
        profileId,
        source: 'chain', // This could be cache or chain, but chain is the primary source
      };
    }

    // If no profile found on chain, try database fallback
    console.log(
      `⚠️ No profile found on chain for ${address}, trying database fallback...`
    );

    const dbProfileId = await getProfileFromDatabase(address);
    return {
      profileId: dbProfileId,
      source: 'database',
    };
  } catch (dbError) {
    console.error(`❌ Both chain and database fetch failed for ${address}:`, {
      dbError: dbError instanceof Error ? dbError.message : dbError,
    });

    return {
      profileId: null,
      source: 'database',
    };
  }
}

async function fundAccount(
  api: any,
  accountAddress: string,
  amount: number
): Promise<void> {
  console.log(`💸 Funding account ${accountAddress}...`);

  const stashAccount = createAccount(STASH_ACC_MNEMONIC);
  if (!stashAccount || !stashAccount.account) {
    throw new Error('Failed to create stash account');
  }

  return new Promise<void>((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Transaction timeout after 30 seconds'));
      }
    }, 30000);

    api.tx.balances
      .transferKeepAlive(accountAddress, amount)
      .signAndSend(stashAccount.account, async (result: any) => {
        try {
          if (resolved) return;

          if (result.status.isInBlock) {
            resolved = true;
            clearTimeout(timeout);
            console.log(
              `✅ Account ${accountAddress} funded with ${
                amount / 10 ** 12
              } WAY (in block)`
            );
            resolve();
          }

          if (result.isError) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(`Transaction failed: ${result.toString()}`));
          }
        } catch (error) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(error);
          }
        }
      })
      .catch((error: Error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.error(`❌ Failed to fund account ${accountAddress}`);
          reject(error);
        }
      });
  });
}

async function createProfileOnChain(
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

  // Query for profile with retry for profile ID
  let retries = 5;
  while (retries > 0) {
    try {
      const profileId = await getExistingProfile(account.address);

      if (profileId) {
        console.log(`✅ Profile ID confirmed: ${profileId}`);
        return profileId;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        error: 'Address parameter is required',
      });
    }

    // Use fallback strategy to get profile
    const { profileId, source } = await getProfileWithFallback(address);

    if (profileId) {
      return res.status(200).json({
        profileId,
        address,
        exists: true,
        cachedAt: Date.now(),
        source,
      } as GetProfileResponse);
    } else {
      return res.status(404).json({
        profileId: null,
        address,
        exists: false,
        message: 'No profile found for this address in chain or database',
        source,
      });
    }
  } catch (error) {
    console.error('❌ Failed to get profile:', error);
    return res.status(500).json({
      error: 'Failed to get profile',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function createProfile(
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

    // Create new account
    const { account, mnemonic } = createAccount();
    if (!account || !mnemonic) {
      return res.status(500).json({
        error: 'Failed to create account. Please try again.',
      });
    }

    console.log(`🚀 Creating new profile for ${account.address}`);

    // Fund account
    await fundAccount(api, account.address, TRANSFER_AMOUNT);

    const rawProfileData: RawProfileData = {
      pub_name: 'Issuer',
    };

    // Create profile
    const profileId = await createProfileOnChain(account, rawProfileData);
    console.log(`✅ Profile created with ID: ${profileId}`);

    // Save profile to database
    const profile = new Profile();
    profile.profileId = profileId;
    profile.address = account.address;
    profile.publicKey = `0x${Buffer.from(account.publicKey).toString('hex')}`;
    profile.mnemonic = mnemonic;

    await dataSource.manager.save(profile);
    console.log(`✅ Profile saved to database with ID: ${profileId}`);

    const profileResponse: CreateProfileResponse = {
      message: 'Profile created successfully',
      profileId,
      address: account.address,
      publicKey: `0x${Buffer.from(account.publicKey).toString('hex')}`,
      mnemonic,
      createdAt: Date.now(),
    };

    return res.status(201).json(profileResponse);
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

export async function getCacheStats(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const client = (await import('../redis_client')).default;

    const hits = (await client.get('cache_hits')) || '0';
    const misses = (await client.get('cache_misses')) || '0';
    const totalRequests = parseInt(hits) + parseInt(misses);
    const hitRate =
      totalRequests > 0 ? (parseInt(hits) / totalRequests) * 100 : 0;

    return res.status(200).json({
      cacheHits: parseInt(hits),
      cacheMisses: parseInt(misses),
      totalRequests,
      hitRate: `${hitRate.toFixed(2)}%`,
      timestamp: Date.now(),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get cache stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
