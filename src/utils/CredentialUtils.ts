export function extractCredentialFields(data: any): {
  schemaId: string;
  properties: any;
  validFrom: string,
  validUntil: string
} {
  let schemaId: string;
  let properties: any;
  let validFrom: string;
  let validUntil: string;

  if (data.credential) {
    schemaId = data.credential.schemaId;
    properties = data.credential.credentialSubject;
    validFrom = data.credential.validFrom;
    validUntil = data.credential.expirationDate;
  } else {
    schemaId = data.schemaId;
    properties = data.properties;
    validFrom = data.validFrom;
    validUntil= data.validUntil;
  }

  return {
    schemaId,
    properties,
    validFrom,
    validUntil
  };
}
