import { PropertyType ,ObjectProperty} from "../types/Schema.interface";
 

export function extractSchemaFields(schema: any) {
  if (!schema || typeof schema !== 'object') {
    throw new Error("Invalid schema: Schema must be a valid object.");
  }

  
  const extractProperty = (property: any): PropertyType => {
    switch (property.type) {
      case 'string': {
        const { type, enum: enumValues, format, minLength, maxLength } = property;
        return {
          type,
          ...(enumValues && { enum: enumValues }),
          ...(format && { format }),
          ...(minLength && { minLength }),
          ...(maxLength && { maxLength })
        };
      }
      case 'integer':
      case 'number': {
        const { type, enum: enumValues, minimum, maximum } = property;
        return {
          type,
          ...(enumValues && { enum: enumValues }),
          ...(minimum && { minimum }),
          ...(maximum && { maximum })
        };
      }
      case 'array': {
        const { type, items, minItems, maxItems } = property;
        return {
          type,
          items: extractProperty(items), 
          ...(minItems && { minItems }),
          ...(maxItems && { maxItems })
        };
      }
      case 'object': {
        const { type, properties, required } = property;
        return {
          type,
          properties: Object.keys(properties).reduce((acc, key) => {
            acc[key] = extractProperty(properties[key]);
            return acc;
          }, {} as ObjectProperty['properties']), 
          ...(required && { required })
        };
      }
      case 'boolean':
        return { type: 'boolean' };
      default:
        throw new Error(`Unsupported property type: ${property.type}`);
    }
  };


  const properties = Object.keys(schema.properties || {}).reduce((acc, key) => {
    acc[key] = extractProperty(schema.properties[key]);
    return acc;
  }, {} as Record<string, PropertyType>);


  return {
    title: schema.title || schema.$id, 
    properties,
    required: schema.required || [], 
    type: 'object',
  };
}
