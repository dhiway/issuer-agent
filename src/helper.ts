import { getConnection } from 'typeorm';
import { Schema } from './entity/Schema';

export async function getSchema(id: string) {
  const schema = await getConnection()
    .getRepository(Schema)
    .findOne({ identifier: id });

  return schema;
}
