import * as Cord from '@cord.network/sdk';

const { NETWORK_ADDRESS } = process.env;
let cordConnectPromise: Promise<void> | undefined;

export async function checkDidAndIdentities() {
  if (!cordConnectPromise) {
    cordConnectPromise = (async () => {
      const networkAddress = NETWORK_ADDRESS || 'ws://127.0.0.1:9944';
      if (!networkAddress) {
        throw new Error(
          'Network address is not defined. Please set NETWORK_ADDRESS.'
        );
      }
      Cord.ConfigService.set({ submitTxResolveOn: Cord.Chain.IS_IN_BLOCK });
      await Cord.connect(networkAddress);
      console.log(`Connected to CORD at ${networkAddress}`);
    })().catch((error) => {
      cordConnectPromise = undefined;
      throw error;
    });
  }

  return cordConnectPromise;
}
