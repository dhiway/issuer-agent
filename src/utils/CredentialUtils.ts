export function extractCredentialFields(data: any): {
  schemaId: string;
  properties: any;
  validFrom: string;
  validUntil: string;
} {
  const cred = data.credential || data;
  return {
    schemaId: cred.schemaId,
    properties: cred.credentialSubject || cred.properties,
    validFrom: cred.validFrom,
    validUntil: cred.expirationDate || cred.validUntil,
  };
}
