import 'dotenv/config';

export type AppEnv = {
  authToken: string;
  autoMigrate: boolean;
  corsOrigin: string | string[];
  dbConnectTimeout: number;
  databaseUrl: string;
  dbMaxConnections: number;
  nodeEnv: string;
  port: number;
};

export function readEnv(source = process.env): AppEnv {
  return {
    authToken: source.AUTH_TOKEN || '',
    autoMigrate: source.DB_AUTO_MIGRATE !== 'false',
    corsOrigin: parseCorsOrigin(source.CORS_ORIGIN || '*'),
    dbConnectTimeout: toNumber(source.DB_CONNECT_TIMEOUT, 10),
    databaseUrl: source.DATABASE_URL || '',
    dbMaxConnections: toNumber(source.DB_MAX_CONNECTIONS, 5),
    nodeEnv: source.NODE_ENV || 'development',
    port: toNumber(source.PORT, 8787),
  };
}

function parseCorsOrigin(value: string): string | string[] {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '*') {
    return '*';
  }
  return trimmed
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
