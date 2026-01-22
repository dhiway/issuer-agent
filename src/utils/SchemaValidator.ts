import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});
addFormats(ajv);

export function validateJsonSchema(schema: any) {
  const valid = ajv.validateSchema(schema);

  if (!valid) {
    return {
      valid: false,
      errors: ajv.errors?.map(
        e => `${e.instancePath || e.schemaPath} ${e.message}`
      ),
    };
  }

  return { valid: true };
}
