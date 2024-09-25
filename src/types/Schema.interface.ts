export type PropertyType =
  | StringProperty
  | NumberProperty
  | BooleanProperty
  | ArrayProperty
  | ObjectProperty;

export interface StringProperty {
  type: 'string';
  enum?: string[];
  format?: 'date' | 'time' | 'uri';
  minLength?: number;
  maxLength?: number;
}

export interface NumberProperty {
  type: 'integer' | 'number';
  enum?: number[];
  minimum?: number;
  maximum?: number;
}

export interface BooleanProperty {
  type: 'boolean';
}

export interface ArrayProperty {
  type: 'array';
  items: PropertyType;
  minItems?: number;
  maxItems?: number;
}

export interface ObjectProperty {
  type: 'object';
  properties: Record<string, PropertyType>;
  required?: string[];
}
