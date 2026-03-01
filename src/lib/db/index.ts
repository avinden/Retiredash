import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

type DbInstance = ReturnType<typeof createDbInstance>;

function createDbInstance() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

declare const globalThis: {
  __db: DbInstance | undefined;
} & typeof global;

function getDb(): DbInstance {
  if (!globalThis.__db) {
    globalThis.__db = createDbInstance();
  }
  return globalThis.__db;
}

export const db = new Proxy({} as DbInstance, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop as keyof DbInstance];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
