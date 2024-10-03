export function extractCredentialFields(data: any): {
  schemaId: string;
  properties: any;
} {
  let schemaId: string;
  let properties: any;

  if (data.credential) {
    schemaId = data.credential.cordSchemaId || data.credential.schemaId;
    properties = data.credential.credentialSubject;
  } else {
    schemaId = data.schemaId;
    properties = data.properties;
  }

  return {
    schemaId,
    properties,
  };
}
