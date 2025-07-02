import { createAccount } from '@cord.network/vc-export';
import { cryptoWaitReady } from '@polkadot/util-crypto';

async function main() {
  console.log(' Creating new account...');
  await cryptoWaitReady();
  const { account, mnemonic } = createAccount();

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
