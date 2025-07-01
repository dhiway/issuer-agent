export function validateCredential(data: any): string | null {
  // If 'credential' is present, validate inside the 'credential'
  if (data.credential) {
    if (!data.credential.credentialSubject) {
      return "'credential.credentialSubject' is required inside 'credential'.";
    }

    if (!data.credential.cordSchemaId && !data.credential.schemaId) {
      return "'cordSchemaId' or 'schemaId' is required inside 'credential'.";
    }

    if (
      !data.credential.credentialSubject ||
      typeof data.credential.credentialSubject !== 'object'
    ) {
      return "'credential.credentialSubject' must be an object.";
    }

    if (Object.keys(data.credential.credentialSubject).length === 0) {
      return "'credential.credentialSubject' must contain at least one key-value pair.";
    }
  } else {
    // If 'credential' is not present, validate the 'schemaId' and 'properties' directly
    if (!data.schema || typeof data.schema !== 'object') {
      return "'schema' is required and must be an object.";
    }

    if (!data.properties || typeof data.properties !== 'object') {
      return "'properties' is required and must be an object.";
    }

    if (!data.address || typeof data.address !== 'string') {
      return "'address' is required and must be a string.";
    }

    if (Object.keys(data.properties).length === 0) {
      return "'properties' must contain at least one key-value pair.";
    }
  }

  return null;
}
