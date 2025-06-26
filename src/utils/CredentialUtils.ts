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
