import { DataSource, DataSourceOptions } from 'typeorm';

const {
  TYPEORM_HOST,
  TYPEORM_PORT,
  TYPEORM_USERNAME,
  TYPEORM_PASSWORD,
  TYPEORM_DATABASE,
  TYPEORM_AUTO_SCHEMA_SYNC,
  TYPEORM_LOGGING,
  TYPEORM_ENTITIES,
  TYPEORM_MIGRATIONS,
  TYPEORM_SUBSCRIBERS,
  TYPEORM_ENTITIES_DIR,
  TYPEORM_MIGRATIONS_DIR,
  TYPEORM_SUBSCRIBERS_DIR,
  TYPEORM_POOL_MAX,
  TYPEORM_POOL_IDLE_TIMEOUT_MS,
  TYPEORM_POOL_CONNECTION_TIMEOUT_MS,
} = process.env;

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, defaultValue: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const dbConfig = {
  type: 'postgres',
  host: TYPEORM_HOST,
  port: parseNumber(TYPEORM_PORT, 5432),
  username: TYPEORM_USERNAME,
  password: TYPEORM_PASSWORD,
  database: TYPEORM_DATABASE,
  synchronize: parseBoolean(TYPEORM_AUTO_SCHEMA_SYNC, false),
  logging: parseBoolean(TYPEORM_LOGGING, false),
  entities: [TYPEORM_ENTITIES || 'dist/entity/*.js'],
  migrations: [TYPEORM_MIGRATIONS || 'dist/migration/*.js'],
  subscribers: [TYPEORM_SUBSCRIBERS || 'dist/subscriber/*.js'],
  extra: {
    max: parseNumber(TYPEORM_POOL_MAX, 2),
    idleTimeoutMillis: parseNumber(TYPEORM_POOL_IDLE_TIMEOUT_MS, 10000),
    connectionTimeoutMillis: parseNumber(
      TYPEORM_POOL_CONNECTION_TIMEOUT_MS,
      5000
    ),
  },
  cli: {
    entitiesDir: TYPEORM_ENTITIES_DIR as string,
    migrationsDir: TYPEORM_MIGRATIONS_DIR as string,
    subscribersDir: TYPEORM_SUBSCRIBERS_DIR as string,
  },
};

export const dataSource = new DataSource(dbConfig as DataSourceOptions);
