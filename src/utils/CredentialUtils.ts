import { parseAndFormatDate } from '../utils/DateUtils';


export function extractCredentialFields(data: any): {
  schema: object;
  properties: any;
  address: string;
  holder?: string;
  validFrom: string;
  validUntil: string;
} {
  const cred = data.credential || data;
  return {
    schema: cred.schema,
    properties: cred.credentialSubject || cred.properties,
    address: cred.address,
    holder: cred.holder,
    validFrom: cred.validFrom,
    validUntil: cred.expirationDate || cred.validUntil,
  };
}

export function getVCValidity(data: any): Record<string, string> {
  const validity: Record<string, string> = {};
  if (data.validFrom) {
    const from = parseAndFormatDate(data.validFrom);
    if (from) validity.validFrom = from.toISOString();
  }
  if (data.validUntil) {
    const until = parseAndFormatDate(data.validUntil);
    if (until) validity.validUntil = until.toISOString();
  }
  return validity;
}