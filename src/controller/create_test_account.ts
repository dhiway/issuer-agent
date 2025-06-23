import { createAccount } from '@cord.network/vc-export';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const { STASH_ACC_MNEMONIC } = process.env;

async function main() {
  // Create new account with mnemonic
  console.log(' Creating new account...');
  await cryptoWaitReady();
  const mnemonic = STASH_ACC_MNEMONIC;
  const { account } = createAccount(mnemonic);

  console.log(`✅ New account created:`);
  console.log(`  Address: ${account.address}`);
  console.log(
    `  Public Key: 0x${Buffer.from(account.publicKey).toString('hex')}`
  );
  console.log(`  Mnemonic: ${mnemonic}`);
  console.log(
    ':warning: Save the mnemonic securely! It is required to recover the account.'
  );
}
main().catch((error) => {
  console.error(
    '❌ Unexpected error:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
