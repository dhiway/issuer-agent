import * as Cord from '@cord.network/sdk';

import { mnemonicGenerate } from '@polkadot/util-crypto';

const {
  CORD_WSS_URL,
  AUTHOR_URI,
  DESIGNER_DID_NAME,
  CHAIN_SPACE_ID,
  MNEMONIC,
  CHAIN_SPACE_AUTH,
} = process.env;

export async function createDidName(
  did: Cord.DidUri,
  submitterAccount: Cord.CordKeyringPair,
  name: Cord.Did.DidName,
  signCallback: Cord.SignExtrinsicCallback
): Promise<void> {
  const api = Cord.ConfigService.get('api');
  const didNameClaimTx = await api.tx.didNames.register(name);
  const authorizedDidNameClaimTx = await Cord.Did.authorizeTx(
    did,
    didNameClaimTx,
    signCallback,
    submitterAccount.address
  );
  await Cord.Chain.signAndSubmitTx(authorizedDidNameClaimTx, submitterAccount);
}

export async function createDid(
  submitterAccount: Cord.CordKeyringPair,
  service?: Cord.DidServiceEndpoint[],
  didName?: string | undefined
): Promise<{
  mnemonic: string;
  document: Cord.DidDocument;
}> {
  try {
    const api = Cord.ConfigService.get('api');
    const mnemonic = mnemonicGenerate(24);

    const issuerKeys = Cord.Utils.Keys.generateKeypairs(mnemonic, 'sr25519');
    const {
      authentication,
      keyAgreement,
      assertionMethod,
      capabilityDelegation,
    } = issuerKeys;

    const didUri = Cord.Did.getDidUriFromKey(authentication);

    // Get tx that will create the DID on chain and DID-URI that can be used to resolve the DID Document.
    const didCreationTx = await Cord.Did.getStoreTx(
      {
        authentication: [authentication],
        keyAgreement: [keyAgreement],
        assertionMethod: [assertionMethod],
        capabilityDelegation: [capabilityDelegation],
        service:
          Array.isArray(service) && service.length > 0
            ? service
            : [
                {
                  id: '#my-service',
                  type: ['service-type'],
                  serviceEndpoint: ['https://www.example.com'],
                },
              ],
      },
      submitterAccount.address,
      async ({ data }) => ({
        signature: authentication.sign(data),
        keyType: authentication.type,
      })
    );

    await Cord.Chain.signAndSubmitTx(didCreationTx, submitterAccount);

    if (didName) {
      try {
        await createDidName(
          didUri,
          submitterAccount,
          didName,
          async ({ data }) => ({
            signature: authentication.sign(data),
            keyType: authentication.type,
          })
        );
      } catch (err: any) {
        console.log('Error to interact with chain', err);
      }
    }

    const encodedDid = await api.call.didApi.query(Cord.Did.toChain(didUri));
    const { document } = Cord.Did.linkedInfoFromChain(encodedDid);

    if (!document) {
      throw new Error('DID was not successfully created.');
    }

    return { mnemonic, document };
  } catch (err) {
    console.log('Error: ', err);
    throw new Error('Failed to create delegate DID');
  }
}

export async function checkDidAndIdentities(mnemonic: string): Promise<any> {
  if (!mnemonic) return null;

  const issuerKeys = Cord.Utils.Keys.generateKeypairs(mnemonic, 'sr25519');
  const { authentication } = issuerKeys;

  const api = Cord.ConfigService.get('api');
  const didUri = Cord.Did.getDidUriFromKey(authentication);
  const encodedDid = await api.call.didApi.query(Cord.Did.toChain(didUri));
  const { document } = Cord.Did.linkedInfoFromChain(encodedDid);

  if (!document) {
    throw new Error('DID was not successfully created.');
  }

  return { issuerKeys, document };
}

export async function addDelegateAsRegistryDelegate(
  authorIdentity: Cord.CordKeyringPair
) {
  try {
    /* Fetching Issuer DID and keys from the given mnemonic */
    const { issuerKeys, document } = await checkDidAndIdentities(
      MNEMONIC as string
    );

    if (!document || !issuerKeys) {
      throw new Error('Failed to create DID');
    }

    /* Creating delegate from authorIdentity. */
    const { mnemonic: delegateMnemonic, document: delegateDid } =
      await createDid(authorIdentity);

    console.log(`\n❄️  Space Delegate Authorization `);
    const permission: Cord.PermissionType = Cord.Permission.ASSERT;

    const spaceAuthProperties =
      await Cord.ChainSpace.buildFromAuthorizationProperties(
        CHAIN_SPACE_ID as `space:cord:${string}`,
        delegateDid.uri,
        permission,
        document.uri
      );

    console.log(`\n❄️  Space Delegation To Chain `);
    const delegateAuth = await Cord.ChainSpace.dispatchDelegateAuthorization(
      spaceAuthProperties,
      authorIdentity,
      CHAIN_SPACE_AUTH as `auth:cord:${string}`,
      async ({ data }) => ({
        signature: issuerKeys.capabilityDelegation.sign(data),
        keyType: issuerKeys.capabilityDelegation.type,
      })
    );

    console.log(`✅ Space Authorization added!`);
    return { delegateMnemonic, delegateAuth, delegateDid };
  } catch (error) {
    console.log('err: ', error);
    throw new Error('Failed to create Delegate Registry');
  }
}
