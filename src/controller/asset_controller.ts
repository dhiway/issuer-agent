import express from 'express';
import * as Cord from '@cord.network/sdk';
import * as Vc from '@cord.network/vc-export';
import {
  AssetCreateRequest,
  AssetCreate,
  AssetIssueRequest,
  AssetIssue,
  AssetTransferRequest,
  AssetTransfer,
} from '../entity/Asset';
import { getConnection } from 'typeorm';

const contextFields = [
  'domain',
  'action',
  'version',
  'entity_one_id',
  'entity_one_uri',
  'entity_two_id',
  'entity_two_uri',
  'transaction_id',
  'message_id',
  'timestamp',
  'ttl',
  'location',
];

const validateFields = (
  data: any,
  requiredFields: string[],
  res: express.Response
) => {
  for (const field of requiredFields) {
    if (!data.hasOwnProperty(field)) {
      res.status(400).json({ error: `Bad Request - ${field} is not provided` });
      return false;
    }
  }
  return true;
};

export async function createAsset(req: express.Request, res: express.Response) {
  const data = req.body;

  const messageFields = [
    'asset_quantity',
    'credential_hash',
    'issuer_did',
    'network_author_identity',
    'authorization',
    'asset_uri',
    'sign_call_back',
  ];

  if (!validateFields(data, ['context', 'message'], res)) return;
  if (!validateFields(data.context, contextFields, res)) return;
  if (!validateFields(data.message, messageFields, res)) return;

  try {
    const assetCreateRequest = new AssetCreateRequest();
    assetCreateRequest.data = data;
    await getConnection().manager.save(assetCreateRequest);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }

  let asssetVC;
  try {
    asssetVC = {
      verifiableCredential: {
        '@context': ['string'],
        id: 'string',
        type: ['string'],
        issuer: 'string',
        issuanceDate: '2024-06-18T04:39:21.583Z',
        expirationDate: '2024-06-18T04:39:21.583Z',
        credentialSubject: {
          id: 'string',
          bearerToken: {
            type: 'string',
            symbol: 'string',
            amount: 0,
          },
        },
        proof: {
          type: 'string',
          created: '2024-06-18T04:39:21.583Z',
          proofPurpose: 'string',
          verificationMethod: 'string',
          jws: 'string',
        },
      },
    };
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }

  try {
    const assetCreate = new AssetCreate();
    assetCreate.data = asssetVC as any;
    await getConnection().manager.save(assetCreate);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
  res.status(201).json(asssetVC);
}

export async function issueAsset(req: express.Request, res: express.Response) {
  const data = req.body;

  const messageFields = [
    'asset_id',
    'asset_owner',
    'asset_issuance_qty',
    'issuer',
    'space',
    'digest',
    'asset_uri',
    'network_author_identity',
    'authorization',
    'sign_call_back',
  ];

  if (!validateFields(data, ['context', 'message'], res)) return;
  if (!validateFields(data.context, contextFields, res)) return;
  if (!validateFields(data.message, messageFields, res)) return;

  try {
    const assetIssueRequest = new AssetIssueRequest();
    assetIssueRequest.data = data;
    await getConnection().manager.save(assetIssueRequest);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }

  let assetVcIssue;
  try {
    assetVcIssue = {
      verifiableCredential: {
        '@context': ['string'],
        id: 'string',
        type: ['string'],
        issuer: 'string',
        issuanceDate: '2024-06-18T04:39:21.583Z',
        expirationDate: '2024-06-18T04:39:21.583Z',
        credentialSubject: {
          id: 'string',
          bearerToken: {
            type: 'string',
            symbol: 'string',
            amount: 0,
          },
        },
        proof: {
          type: 'string',
          created: '2024-06-18T04:39:21.583Z',
          proofPurpose: 'string',
          verificationMethod: 'string',
          jws: 'string',
        },
      },
    };
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }

  try {
    const assetIssue = new AssetIssue();
    assetIssue.data = assetVcIssue as any;
    await getConnection().manager.save(assetIssue);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
  res.status(201).json(assetVcIssue);
}

export async function transferAsset(
  req: express.Request,
  res: express.Response
) {
  const data = req.body;

  const messageFields = [
    'asset_id',
    'asset_instance_id',
    'asset_owner',
    'new_asset_owner',
    'digest',
    'network_author_identity',
    'sign_call_back',
  ];

  if (!validateFields(data, ['context', 'message'], res)) return;
  if (!validateFields(data.context, contextFields, res)) return;
  if (!validateFields(data.message, messageFields, res)) return;

  try {
    const assetTransferRequest = new AssetTransferRequest();
    assetTransferRequest.data = data;
    await getConnection().manager.save(assetTransferRequest);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }

  let asssetVCtransfer;
  try {
    asssetVCtransfer = {
      verifiableCredential: {
        '@context': ['string'],
        id: 'string',
        type: ['string'],
        issuer: 'string',
        issuanceDate: '2024-06-18T04:39:21.583Z',
        expirationDate: '2024-06-18T04:39:21.583Z',
        credentialSubject: {
          id: 'string',
          bearerToken: {
            type: 'string',
            symbol: 'string',
            amount: 0,
          },
        },
        proof: {
          type: 'string',
          created: '2024-06-18T04:39:21.583Z',
          proofPurpose: 'string',
          verificationMethod: 'string',
          jws: 'string',
        },
      },
    };
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }

  try {
    const assetTransfer = new AssetTransfer();
    assetTransfer.data = asssetVCtransfer as any;
    await getConnection().manager.save(assetTransfer);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
  res.status(201).json(asssetVCtransfer);
}
