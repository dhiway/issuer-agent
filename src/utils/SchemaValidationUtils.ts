
export function validateSchema(data:any) {
    
    if (!data) return "'schema' is required.";
    if (!data.title && !data.$id) return "'title' or '$id' is required.";
    if (!data.description) return "'description' is required.";
    if (!data.properties) return "'properties' is required.";
    if (Object.keys(data.properties).length === 0) return "'properties' must contain at least one property.";
    return null;
  }
  