import express from 'express';
import * as Vc from '@cord.network/vc-export';
import * as Cord from '@cord.network/sdk';
import { validateCredential } from '../utils/CredentialValidationUtils';
import {
  issuerDid,
  authorIdentity,
  addDelegateAsRegistryDelegate,
  issuerKeysProperty,
  delegateDid,
  delegateSpaceAuth,
  delegateKeysProperty,
} from '../init';

import { Cred } from '../entity/Cred';
import { Schema } from '../entity/Schema';
import { dataSource } from '../dbconfig';
import { extractCredentialFields } from '../utils/CredentialUtils';
const { CHAIN_SPACE_ID, CHAIN_SPACE_AUTH } = process.env;

export async function issueVC(req: express.Request, res: express.Response) {
  let data = req.body;

  const api = Cord.ConfigService.get('api');
  if (!authorIdentity) {
    await addDelegateAsRegistryDelegate();
  }

  try {
    const validationError = validateCredential(data);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    data = extractCredentialFields(data);
    const schema = await dataSource
      .getRepository(Schema)
      .findOne({ where: { identifier: data.schemaId } });

    const parsedSchema = JSON.parse(schema?.cordSchema as string);

    let holder = issuerDid.uri;
    // if (data.properties.holderDid) {
    //   holder = data.properties.holderDid;
    //   delete data.properties.holderDid;
    // }
    if (data.properties.holderDid || data.properties.id) {
      holder = data.properties.holderDid || data.properties.id;
      delete data.properties.holderDid;
      delete data.properties.id;
  }
  
    const validFromDate = new Date(data.validFrom)
    const validUntilDate = new Date(data.validUntil)
    const newCredContent = await Vc.buildVcFromContent(
      parsedSchema.schema,
      data.properties,
      issuerDid,
      holder,
      {
        spaceUri: CHAIN_SPACE_ID as `space:cord:${string}`,
        schemaUri: schema?.identifier,
        validUntil: validUntilDate,
        validFrom:validFromDate
      },
    );
 
    const vc: any = await Vc.addProof(
      newCredContent,
      async (data) => ({
        signature: await issuerKeysProperty.assertionMethod.sign(data),
        keyType: issuerKeysProperty.assertionMethod.type,
        keyUri: `${issuerDid.uri}${
          issuerDid.assertionMethod![0].id
        }` as Cord.DidResourceUri,
      }),
      issuerDid,
      api,
      {
        spaceUri: CHAIN_SPACE_ID as `space:cord:${string}`,
        schemaUri: schema?.identifier,
        needSDR: true,
        needStatementProof: true
      }
    );
    console.dir(vc, {
      depth: null,
      colors: true,
    });

    const statement = await Cord.Statement.dispatchRegisterToChain(
      vc.proof[1],
      issuerDid.uri,
      authorIdentity,
      CHAIN_SPACE_AUTH as `auth:cord:${string}`,
      async ({ data }) => ({
        signature: issuerKeysProperty.authentication.sign(data),
        keyType: issuerKeysProperty.authentication.type,
      })
    );

    console.log(`✅ Statement element registered - ${statement}`);

    const cred = new Cred();
    cred.schemaId = data.schemaId;
    cred.identifier = statement;
    cred.active = true;
    cred.fromDid = issuerDid.uri;
    cred.credHash = newCredContent.credentialHash;
    cred.vc = vc;

    if (statement) {
      await dataSource.manager.save(cred);
      return res
        .status(200)
        .json({ result: 'success', identifier: cred.identifier, vc: vc });
    } else {
      return res.status(400).json({ error: 'Credential not issued' });
    }
  } catch (err) {
    console.log('Error: ', err);
    return res.status(500).json({ error: 'Fields does not match schema' });
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

export async function getCredById(req: express.Request, res: express.Response) {
  try {
    const cred = await dataSource
      .getRepository(Cred)
      .findOne({ where: { identifier: req.params.id } });

    if (!cred) {
      return res.status(400).json({ error: 'Cred not found' });
    }

    return res.status(200).json({ credential: cred });
  } catch (error) {
    console.log('Error: ', error);
    return res.status(500).json({ error: 'Error in cred fetch' });
  }
}

export async function updateCred(req: express.Request, res: express.Response) {
  const data = req.body;
  const api = Cord.ConfigService.get('api');
  if (!data.properties || typeof data.properties !== 'object') {
    return res.status(400).json({
      error: '"property" is a required field and should be an object',
    });
  }

  try {
    const cred = await dataSource
      .getRepository(Cred)
      .findOne({ where: { identifier: req.params.id } });

    if (!cred) {
      return res.status(400).json({ error: 'Cred not found' });
    }

    console.log(`\n❄️  Statement Updation `);

    const updatedCredContent = await Vc.updateVcFromContent(
      data.properties,
      cred.vc,
      undefined
    );

    let updatedVc: any = await Vc.updateAddProof(
      cred.identifier as `stmt:cord:${string}`,
      updatedCredContent,
      async (data) => ({
        signature: await issuerKeysProperty.assertionMethod.sign(data),
        keyType: issuerKeysProperty.assertionMethod.type,
        keyUri: `${issuerDid.uri}${
          issuerDid.assertionMethod![0].id
        }` as Cord.DidResourceUri,
      }),
      issuerDid,
      api,
      {
        spaceUri: CHAIN_SPACE_ID as `space:cord:${string}`,
        schemaUri: cred.schemaId,
        needSDR: true,
        needStatementProof: true,
      }
    );

    console.dir(updatedVc, {
      depth: null,
      colors: true,
    });

    const updatedStatement = await Cord.Statement.dispatchUpdateToChain(
      updatedVc.proof[1],
      issuerDid.uri,
      authorIdentity,
      CHAIN_SPACE_AUTH as `auth:cord:${string}`,
      async ({ data }) => ({
        signature: issuerKeysProperty.authentication.sign(data),
        keyType: issuerKeysProperty.authentication.type,
      })
    );

    console.log(`✅ UpdatedStatement element registered - ${updatedStatement}`);

    if (updatedStatement) {
      cred.identifier = updatedStatement;
      cred.credHash = updatedCredContent.credentialHash;
      cred.vc = updatedVc;

      await dataSource.manager.save(cred);

      console.log('\n✅ Statement updated!');

      return res.status(200).json({
        result: 'Updated successufully',
        identifier: cred.identifier,
        vc: updatedVc,
      });
    }
    return res.status(400).json({ error: 'Document not updated' });
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).json({ error: 'Error in updating document' });
  }
}

export async function revokeCred(req: express.Request, res: express.Response) {
  try {
    const cred = await dataSource
      .getRepository(Cred)
      .findOne({ where: { identifier: req.params.id } });

    if (!cred) {
      return res.status(400).json({ error: 'Invalid identifier' });
    }

    await Cord.Statement.dispatchRevokeToChain(
      cred.vc.proof[1].elementUri as `stmt:cord:${string}`,
      delegateDid.uri,
      authorIdentity,
      delegateSpaceAuth as Cord.AuthorizationUri,
      async ({ data }) => ({
        signature: delegateKeysProperty.authentication.sign(data),
        keyType: delegateKeysProperty.authentication.type,
      })
    );

    console.log(`✅ Statement revoked!`);

    return res.status(200).json({ result: 'Statement revoked successfully' });
  } catch (error) {
    console.log('err: ', error);
    return res.status(400).json({ err: error });
  }
}

export async function documentHashOnChain(
  req: express.Request,
  res: express.Response
) {
  try {
    const fileHash = req?.body.filehash;
    if (!fileHash) {
      return res.status(400).json({ err: 'No file uploaded' });
    }
    const api = Cord.ConfigService.get('api');

    const docProof = await Vc.getCordProofForDigest(
      fileHash as `0x${string}`,
      issuerDid,
      api,
      {
        spaceUri: CHAIN_SPACE_ID as `space:cord:${string}`,
      }
    );

    const statement1 = await Cord.Statement.dispatchRegisterToChain(
      docProof,
      issuerDid.uri,
      authorIdentity,
      CHAIN_SPACE_AUTH as `auth:cord:${string}`,
      async ({ data }) => ({
        signature: issuerKeysProperty.authentication.sign(data),
        keyType: issuerKeysProperty.authentication.type,
      })
    );

    const statementDetails = await api.query.statement.statements(
      docProof.identifier
    );
    return res.status(200).json({
      result: {
        identifier: docProof.identifier,
        blockHash: statementDetails.createdAtHash?.toString(),
      },
    });
  } catch (error: any) {
    console.log('errr: ', error);
    return res.status(400).json({ err: error.message ? error.message : error });
  }
}

export async function revokeDocumentHashOnChain(
  req: express.Request,
  res: express.Response
) {
  try {
    const fileHash = req?.body.filehash;
    const identifierReq = req?.body.identifier;
    let statementUri = ``;
    const api = Cord.ConfigService.get('api');
    if (fileHash) {
      const space = Cord.Identifier.uriToIdentifier(CHAIN_SPACE_ID);
      const identifierencoded = await api.query.statement.identifierLookup(
        fileHash as `0x${string}`,
        space
      );
      const identifier = identifierencoded.toHuman();
      const digest = fileHash.replace(/^0x/, '');
      statementUri = `stmt:cord:${identifier}:${digest}`;
    } else if (identifierReq) {
      const statementDetails = await Cord.Statement.getDetailsfromChain(
        identifierReq
      );
      const digest = statementDetails?.digest.replace(/^0x/, '');
      statementUri = `${statementDetails?.uri}:${digest}`;
    } else {
      return res
        .status(400)
        .json({ err: 'File hash or identifier is required for revoke' });
    }
    const statementStatus = await Cord.Statement.fetchStatementDetailsfromChain(
      statementUri as `stmt:cord:${string}`
    );
    if (statementStatus?.revoked) {
      return res
        .status(400)
        .json({ err: 'Document is already revoked on chain' });
    }
    const revokeResponse = await Cord.Statement.dispatchRevokeToChain(
      statementUri as `stmt:cord:${string}`,
      issuerDid.uri,
      authorIdentity,
      CHAIN_SPACE_AUTH as `auth:cord:${string}`,
      async ({ data }) => ({
        signature: issuerKeysProperty.authentication.sign(data),
        keyType: issuerKeysProperty.authentication.type,
      })
    );

    const statementStatusRevoked =
      await Cord.Statement.fetchStatementDetailsfromChain(
        statementUri as `stmt:cord:${string}`
      );
    if (statementStatusRevoked?.revoked) {
      return res.status(200).json({ result: { msg: 'Successfully revoked' } });
    } else {
      return res.status(400).json({ err: 'Document not revoked' });
    }
  } catch (error: any) {
    console.log('errr: ', error);
    return res.status(400).json({ err: error.message ? error.message : error });
  }
}

export async function updateDocumentHashOnChain(
  req: express.Request,
  res: express.Response
) {
  try {
    const fileHash = req?.body.filehash;
    const identifierReq = req?.body.identifier;
    if (!fileHash) {
      return res.status(400).json({ err: 'Please enter valid document' });
    }
    if (!identifierReq) {
      return res.status(400).json({ err: 'Please enter valid identifier' });
    }
    const api = Cord.ConfigService.get('api');
    if (!CHAIN_SPACE_ID) {
      return res.status(400).json({ err: 'chain space id not' });
    }
    const statementDetails = await Cord.Statement.getDetailsfromChain(
      identifierReq
    );
    if (statementDetails?.digest) {
      const digest = statementDetails.digest.replace(/^0x/, '');
      const elementUri = `${statementDetails.uri}:{digest}`;
      const updatedStatementEntry = Cord.Statement.buildFromUpdateProperties(
        elementUri as `stmt:cord:${string}`,
        fileHash,
        CHAIN_SPACE_ID as `space:cord:${string}`,
        issuerDid.uri
      );
      console.dir(updatedStatementEntry, {
        depth: null,
        colors: true,
      });

      const updatedStatement = await Cord.Statement.dispatchUpdateToChain(
        updatedStatementEntry,
        issuerDid.uri,
        authorIdentity,
        CHAIN_SPACE_AUTH as `auth:cord:${string}`,
        async ({ data }) => ({
          signature: issuerKeysProperty.authentication.sign(data),
          keyType: issuerKeysProperty.authentication.type,
        })
      );
      console.log(`✅ Statement element registered - ${updatedStatement}`);

      const updatedStatementDetails = await api.query.statement.statements(
        updatedStatementEntry.elementUri
      );
      return res.status(200).json({
        result: {
          identifier: updatedStatementEntry.elementUri,
          blockHash: updatedStatementDetails.createdAtHash?.toString(),
        },
      });
    } else {
      return res.status(400).json({ err: 'Unable to find the digest' });
    }
  } catch (error: any) {
    console.log('errr: ', error);
    return res.status(400).json({ err: error.message ? error.message : error });
  }
}
