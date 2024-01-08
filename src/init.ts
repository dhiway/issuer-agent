import * as Cord from '@cord.network/sdk';

import {
    blake2AsU8a,
    keyExtractPath,
    keyFromPath,
    mnemonicGenerate,
    mnemonicToMiniSecret,
    ed25519PairFromSeed,
} from '@polkadot/util-crypto';

const {
    CORD_WSS_URL,
    AUTHOR_URI,
    DESIGNER_DID_NAME,
    CHAIN_SPACE_ID,
    MNEMONIC,
    CHAIN_SPACE_AUTH,
} = process.env;

export let authorIdentity: any = undefined;

function generateKeyAgreement(mnemonic: string) {
    const secretKeyPair = ed25519PairFromSeed(mnemonicToMiniSecret(mnemonic));
    const { path } = keyExtractPath('//did//keyAgreement//0');
    const { secretKey } = keyFromPath(secretKeyPair, path, 'ed25519');
    return Cord.Utils.Crypto.makeEncryptionKeypairFromSeed(
        blake2AsU8a(secretKey)
    );
}

function generateKeypairs(mnemonic = mnemonicGenerate()) {
    const keyring = new Cord.Utils.Keyring({
        ss58Format: 29,
        type: 'ed25519',
    });

    const account = keyring.addFromMnemonic(mnemonic) as Cord.CordKeyringPair;
    const authentication = {
        ...account.derive('//did//authentication//0'),
        type: 'ed25519',
    } as Cord.CordKeyringPair;

    const assertionMethod = {
        ...account.derive('//did//assertion//0'),
        type: 'ed25519',
    } as Cord.CordKeyringPair;

    const capabilityDelegation = {
        ...account.derive('//did//delegation//0'),
        type: 'ed25519',
    } as Cord.CordKeyringPair;

    const keyAgreement = generateKeyAgreement(mnemonic);

    return {
        authentication: authentication,
        keyAgreement: keyAgreement,
        assertionMethod: assertionMethod,
        capabilityDelegation: capabilityDelegation,
    };
}

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
    await Cord.Chain.signAndSubmitTx(
        authorizedDidNameClaimTx,
        submitterAccount
    );
}

export async function createDid(
    submitterAccount: Cord.CordKeyringPair,
    didName?: string | undefined
): Promise<{
    mnemonic: string;
    delegateKeys: any;
    document: Cord.DidDocument;
}> {
    try {
        const api = Cord.ConfigService.get('api');
        const mnemonic = mnemonicGenerate(24);

        const delegateKeys = generateKeypairs(mnemonic);
        const {
            authentication,
            keyAgreement,
            assertionMethod,
            capabilityDelegation,
        } = delegateKeys;

        const didUri = Cord.Did.getDidUriFromKey(authentication);

        // Get tx that will create the DID on chain and DID-URI that can be used to resolve the DID Document.
        const didCreationTx = await Cord.Did.getStoreTx(
            {
                authentication: [authentication],
                keyAgreement: [keyAgreement],
                assertionMethod: [assertionMethod],
                capabilityDelegation: [capabilityDelegation],
                // Example service.
                service: [
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

        const encodedDid = await api.call.didApi.query(
            Cord.Did.toChain(didUri)
        );
        const { document } = Cord.Did.linkedInfoFromChain(encodedDid);

        if (!document) {
            throw new Error('DID was not successfully created.');
        }

        return { mnemonic, delegateKeys, document };
    } catch (err) {
        console.log('Error: ', err);
        throw new Error('Failed to create delegate DID');
    }
}

export async function checkDidAndIdentities(mnemonic: string): Promise<any> {
    if (!mnemonic) return null;

    if (!authorIdentity) {
        Cord.ConfigService.set({ submitTxResolveOn: Cord.Chain.IS_IN_BLOCK });
        await Cord.connect(CORD_WSS_URL ?? 'ws://localhost:9944');

        authorIdentity = Cord.Utils.Crypto.makeKeypairFromUri(
            AUTHOR_URI ?? '//Alice',
            'sr25519'
        );
    }

    const issuerKeys = generateKeypairs(mnemonic);
    const {
        authentication,
        keyAgreement,
        assertionMethod,
        capabilityDelegation,
    } = issuerKeys;

    const api = Cord.ConfigService.get('api');
    const didUri = Cord.Did.getDidUriFromKey(authentication);
    const encodedDid = await api.call.didApi.query(Cord.Did.toChain(didUri));
    const { document } = Cord.Did.linkedInfoFromChain(encodedDid);

    if (!document) {
        throw new Error('DID was not successfully created.');
    }

    return { issuerKeys, document };
}

export async function addDelegateAsRegistryDelegate() {
    try {
        /* Fetching Issuer DID and keys from given mnemonic */
        const { issuerKeys, document } = await checkDidAndIdentities(
            MNEMONIC as string
        );

        /* Creating delegate from authorIdentity. */
        const { mnemonic: delegateMnemonic, document: delegateDid } =
            await createDid(authorIdentity);

        if (!document || !issuerKeys) {
            throw new Error('Failed to create DID');
        }

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
        const delegateAuth =
            await Cord.ChainSpace.dispatchDelegateAuthorization(
                spaceAuthProperties,
                authorIdentity,
                CHAIN_SPACE_AUTH as `auth:cord:${string}`,
                async ({ data }) => ({
                    signature: issuerKeys.capabilityDelegation.sign(data),
                    keyType: issuerKeys.capabilityDelegation.type,
                })
            );

        console.log(`✅ Space Authorization added!`);

        return { delegateMnemonic, delegateAuth };
    } catch (error) {
        console.log('err: ', error);
        throw new Error('Failed to create Delegate Registry');
    }
}
