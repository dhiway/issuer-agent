import { Request, Response } from 'express';
import * as Vc from '@cord.network/vc-export';
import * as Cord from '@cord.network/sdk';

import { dataSource } from '../dbconfig';
import { validateCredential } from '../utils/CredentialValidationUtils';
import { parseAndFormatDate } from '../utils/DateUtils';
// import {
//   issuerDid,
//   authorIdentity,
//   addDelegateAsRegistryDelegate,
//   issuerKeysProperty,
//   delegateDid,
//   delegateSpaceAuth,
//   delegateKeysProperty,
// } from '../init';

// import { Cred } from '../entity/Cred';
// import { Schema } from '../entity/Schema';
// import { dataSource } from '../dbconfig';
import {
  extractCredentialFields,
  getVCValidity,
} from '../utils/CredentialUtils';
import { Registry } from '../entity/Registry';
import { waitForEvent } from '../utils/Events';
import { Cred } from '../entity/Cred';
import { getAccount } from '../helper';

export async function issueVC(req: Request, res: Response) {
  try {
    const api = Cord.ConfigService.get('api');
    const data = req.body;

    const validationError = validateCredential(data);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const processedData = extractCredentialFields(data);
    const vcValidityObj = getVCValidity(processedData);

    const issuerAccount = await getAccount(processedData.address);
    if (!issuerAccount) {
      return res.status(400).json({ error: 'Invalid issuerAccount' });
    }

    const registry = await dataSource.getRepository(Registry).findOne({
      where: { address: issuerAccount.address },
      select: ['registryId', 'profileId'],
    });
    console.log('\n🔄 Registry: ', registry);
    if (!registry) {
      return res.status(400).json({
        error: 'Registry not found for the provided address',
      });
    }

    const issuerDid = 'did:web:did.myn.social:' + registry.profileId;
    const holderDid = processedData.holder ?? issuerDid; // Assuming holder is the same as issuer for this example

    const newCredContent = await Vc.buildVcFromContent(
      processedData.schema as any,
      processedData.properties,
      issuerDid,
      holderDid,
      {
        ...vcValidityObj,
        metadata: data.metadata ?? {},
      }
    );

    // let proofId = 'PAN-1234';
    const vc = await Vc.addProof(
      newCredContent,
      async (data) => ({
        signature: issuerAccount.sign(data),
        keyType: issuerAccount.type,
        keyUri: issuerDid + '#' + issuerAccount.address,
      }),
      registry.registryId as string,
      issuerAccount.address,
      api,
      {
        needSDR: true,
        needEntryProof: true,
      }
      // proofId /* Optional proof-id, example PAN ID */
    );

    console.dir(vc, {
      depth: null,
      colors: true,
    });

    // Dispatch the VC to the chain
    const proof = Array.isArray(vc.proof) ? vc.proof[1] : vc.proof || {};

    await Cord.Entry.dispatchCreateEntryToChain(
      proof as unknown as Cord.IRegistryEntry,
      issuerAccount
    );

    const entryObj: any = (await waitForEvent(api, (event: any) =>
      api.events.entry.RegistryEntryCreated.is(event)
    )) as string;

    if (entryObj && entryObj.registryEntryId) {
      // Save to DB
      const cred = await dataSource.getRepository(Cred).create({
        id: vc.id,
        credId: entryObj.registryEntryId,
        address: entryObj.creator,
        profileId: entryObj.creatorProfileId,
        registryId: entryObj.registryId,
        issuerDid,
        holderDid,
        vc,
      });

      await dataSource.manager.save(cred);

      return res.status(200).json({
        result: 'success',
        credId: cred.credId,
        vc,
      });
    }
  } catch (err: any) {
    console.error('Error issuing VC:', err);
    return res.status(500).json({
      error: err.message || 'Fields do not match schema',
    });
  }

  // TODO: If holder id is set vc will be sent to wallet

  // const url: any = WALLET_URL;

  // if (url && data.type) {
  //   await fetch(`${url}/message/${holderDidUri}`, {
  //     body: JSON.stringify({
  //       id: data.id,
  //       type: data.type,
  //       fromDid: issuerDid.uri,
  //       toDid: holderDidUri,
  //       message: documents,
  //     }),
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   })
  //     .then((resp) => resp.json())
  //     .then(() => console.log('Saved to db'))
  //     .catch((error) => {
  //       console.error(error);
  //       return res.json({ result: 'VC not issued' });
  //     });
  // }

  // return res.status(200).json({ result: 'SUCCESS' });
}

export async function getCredById(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'Credential ID is required' });
    }

    const cred = await dataSource
      .getRepository(Cred)
      .findOne({ where: { credId: req.params.id } });

    if (!cred) {
      return res.status(400).json({ error: 'Cred not found' });
    }

    return res.status(200).json({ credential: cred });
  } catch (error) {
    console.log('Error: ', error);
    return res.status(500).json({ error: 'Error in cred fetch' });
  }
}

export async function updateCred(req: Request, res: Response) {
  try {
    const { credId, properties } = req.body;

    const api = Cord.ConfigService.get('api');
    if (!properties || typeof properties !== 'object') {
      return res.status(400).json({
        error: '"property" is a required field and should be an object',
      });
    }

    const cred = await dataSource
      .getRepository(Cred)
      .findOne({ where: { credId } });

    if (!cred) {
      return res.status(400).json({ error: 'Cred not found' });
    }

    const issuerAccount = await getAccount(cred.address as string);
    if (!issuerAccount) {
      return res.status(400).json({ error: 'Invalid issuerAccount' });
    }

    console.log(`\n❄️  Statement Updation `);

    const updatedCredContent = await Vc.updateVcFromContent(
      properties,
      cred.vc,
      undefined, // validUntil takes from existing VC
      {
        metadata: req.body.metadata ?? {},
      }
    );

    const issuerDid = cred.issuerDid;
    if (!issuerDid) {
      return res
        .status(400)
        .json({ error: 'Issuer DID not found in credential' });
    }

    let updatedVc: any = await Vc.updateAddProof(
      cred.registryId as string,
      cred.credId as string,
      updatedCredContent,
      async (data) => ({
        signature: await issuerAccount.sign(data),
        keyType: issuerAccount.type,
        keyUri: issuerDid + '#' + issuerAccount.address,
      }),
      issuerAccount.address,
      api,
      {
        needSDR: true,
        needEntryProof: true,
      }
    );

    console.dir(updatedVc, {
      depth: null,
      colors: true,
    });

    const updatedProof = updatedVc.proof ? updatedVc.proof[1] : {};
    /* TODO: Check on ideal way to pass entry-id */
    // This is required to know which entry to update
    updatedProof.registryEntryId = cred.credId;

    await Cord.Entry.dispatchUpdateEntryToChain(updatedProof, issuerAccount);

    // Update the credential in the database
    await dataSource.getRepository(Cred).update(
      {
        credId: cred.credId,
      },
      {
        vc: updatedVc,
      }
    );

    console.log('\n✅ Statement updated!');

    return res.status(200).json({
      result: 'Updated successufully',
      credId: cred.credId,
      vc: updatedVc,
    });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({ error: 'Error in updating document' });
  }
}

export async function revokeCred(req: Request, res: Response) {
  try {
    const { credId } = req.body;

    const cred = await dataSource
      .getRepository(Cred)
      .findOne({ where: { credId } });

    if (!cred) {
      return res.status(400).json({ error: 'Cred not found' });
    }

    const issuerAccount = await getAccount(cred.address as string);
    if (!issuerAccount) {
      return res.status(400).json({ error: 'Invalid issuerAccount' });
    }

    await Cord.Entry.dispatchRevokeEntryToChain(
      cred.registryId as string,
      cred.credId as string,
      issuerAccount
    );

    console.log(`✅ Statement revoked!`);

    return res.status(200).json({ result: 'Statement revoked successfully' });
  } catch (error) {
    console.log('err: ', error);
    return res.status(400).json({ err: error });
  }
}

// export async function documentHashOnChain(
//   req: express.Request,
//   res: express.Response
// ) {
//   try {
//     const fileHash = req?.body.filehash;
//     if (!fileHash) {
//       return res.status(400).json({ err: 'No file uploaded' });
//     }
//     const api = Cord.ConfigService.get('api');

//     const docProof = await Vc.getCordProofForDigest(
//       fileHash as `0x${string}`,
//       issuerDid,
//       api,
//       {
//         spaceUri: CHAIN_SPACE_ID as `space:cord:${string}`,
//       }
//     );

//     const statement1 = await Cord.Statement.dispatchRegisterToChain(
//       docProof,
//       issuerDid.uri,
//       authorIdentity,
//       CHAIN_SPACE_AUTH as `auth:cord:${string}`,
//       async ({ data }) => ({
//         signature: issuerKeysProperty.authentication.sign(data),
//         keyType: issuerKeysProperty.authentication.type,
//       })
//     );

//     const statementDetails = await api.query.statement.statements(
//       docProof.identifier
//     );
//     return res.status(200).json({
//       result: {
//         identifier: docProof.identifier,
//         blockHash: statementDetails.createdAtHash?.toString(),
//       },
//     });
//   } catch (error: any) {
//     console.log('errr: ', error);
//     return res.status(400).json({ err: error.message ? error.message : error });
//   }
// }

// export async function revokeDocumentHashOnChain(
//   req: express.Request,
//   res: express.Response
// ) {
//   try {
//     const fileHash = req?.body.filehash;
//     const identifierReq = req?.body.identifier;
//     let statementUri = ``;
//     const api = Cord.ConfigService.get('api');
//     if (fileHash) {
//       const space = Cord.Identifier.uriToIdentifier(CHAIN_SPACE_ID);
//       const identifierencoded = await api.query.statement.identifierLookup(
//         fileHash as `0x${string}`,
//         space
//       );
//       const identifier = identifierencoded.toHuman();
//       const digest = fileHash.replace(/^0x/, '');
//       statementUri = `stmt:cord:${identifier}:${digest}`;
//     } else if (identifierReq) {
//       const statementDetails = await Cord.Statement.getDetailsfromChain(
//         identifierReq
//       );
//       const digest = statementDetails?.digest.replace(/^0x/, '');
//       statementUri = `${statementDetails?.uri}:${digest}`;
//     } else {
//       return res
//         .status(400)
//         .json({ err: 'File hash or identifier is required for revoke' });
//     }
//     const statementStatus = await Cord.Statement.fetchStatementDetailsfromChain(
//       statementUri as `stmt:cord:${string}`
//     );
//     if (statementStatus?.revoked) {
//       return res
//         .status(400)
//         .json({ err: 'Document is already revoked on chain' });
//     }
//     const revokeResponse = await Cord.Statement.dispatchRevokeToChain(
//       statementUri as `stmt:cord:${string}`,
//       issuerDid.uri,
//       authorIdentity,
//       CHAIN_SPACE_AUTH as `auth:cord:${string}`,
//       async ({ data }) => ({
//         signature: issuerKeysProperty.authentication.sign(data),
//         keyType: issuerKeysProperty.authentication.type,
//       })
//     );

//     const statementStatusRevoked =
//       await Cord.Statement.fetchStatementDetailsfromChain(
//         statementUri as `stmt:cord:${string}`
//       );
//     if (statementStatusRevoked?.revoked) {
//       return res.status(200).json({ result: { msg: 'Successfully revoked' } });
//     } else {
//       return res.status(400).json({ err: 'Document not revoked' });
//     }
//   } catch (error: any) {
//     console.log('errr: ', error);
//     return res.status(400).json({ err: error.message ? error.message : error });
//   }
// }

// export async function updateDocumentHashOnChain(
//   req: express.Request,
//   res: express.Response
// ) {
//   try {
//     const fileHash = req?.body.filehash;
//     const identifierReq = req?.body.identifier;
//     if (!fileHash) {
//       return res.status(400).json({ err: 'Please enter valid document' });
//     }
//     if (!identifierReq) {
//       return res.status(400).json({ err: 'Please enter valid identifier' });
//     }
//     const api = Cord.ConfigService.get('api');
//     if (!CHAIN_SPACE_ID) {
//       return res.status(400).json({ err: 'chain space id not' });
//     }
//     const statementDetails = await Cord.Statement.getDetailsfromChain(
//       identifierReq
//     );
//     if (statementDetails?.digest) {
//       const digest = statementDetails.digest.replace(/^0x/, '');
//       const elementUri = `${statementDetails.uri}:{digest}`;
//       const updatedStatementEntry = Cord.Statement.buildFromUpdateProperties(
//         elementUri as `stmt:cord:${string}`,
//         fileHash,
//         CHAIN_SPACE_ID as `space:cord:${string}`,
//         issuerDid.uri
//       );
//       console.dir(updatedStatementEntry, {
//         depth: null,
//         colors: true,
//       });

//       const updatedStatement = await Cord.Statement.dispatchUpdateToChain(
//         updatedStatementEntry,
//         issuerDid.uri,
//         authorIdentity,
//         CHAIN_SPACE_AUTH as `auth:cord:${string}`,
//         async ({ data }) => ({
//           signature: issuerKeysProperty.authentication.sign(data),
//           keyType: issuerKeysProperty.authentication.type,
//         })
//       );
//       console.log(`✅ Statement element registered - ${updatedStatement}`);

//       const updatedStatementDetails = await api.query.statement.statements(
//         updatedStatementEntry.elementUri
//       );
//       return res.status(200).json({
//         result: {
//           identifier: updatedStatementEntry.elementUri,
//           blockHash: updatedStatementDetails.createdAtHash?.toString(),
//         },
//       });
//     } else {
//       return res.status(400).json({ err: 'Unable to find the digest' });
//     }
//   } catch (error: any) {
//     console.log('errr: ', error);
//     return res.status(400).json({ err: error.message ? error.message : error });
//   }
// }
