import * as Cord from '@cord.network/sdk';

const { CORD_WSS_URL, AUTHOR_URI } = process.env;

let authorIdentity: Cord.CordKeyringPair;

export async function cordConnect() {
  Cord.ConfigService.set({ submitTxResolveOn: Cord.Chain.IS_IN_BLOCK });
  await Cord.connect(CORD_WSS_URL ?? 'ws://localhost:9944');

  authorIdentity = Cord.Utils.Crypto.makeKeypairFromUri(
    AUTHOR_URI ?? '//Alice',
    'sr25519'
  );
}

export { authorIdentity };
