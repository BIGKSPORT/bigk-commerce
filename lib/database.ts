import { AsyncLocalStorage } from 'node:async_hooks';
import postgres from 'postgres';
import { db as sqlite } from './sqlite';
type Row = Record<string, unknown>;
type Query = (text: string, values: unknown[]) => Promise<{ rows: Row[]; changes: number }>;
const context = new AsyncLocalStorage<Query>();
let client: ReturnType<typeof postgres> | undefined;
let sqliteQueue: Promise<unknown> = Promise.resolve();
export function databaseSchema(){const schema=process.env.DATABASE_SCHEMA||'bigk';if(!['bigk','bigk_staging'].includes(schema))throw new Error('DATABASE_SCHEMA must be bigk or bigk_staging.');return schema}
export function isPostgres() {
  const provider = process.env.DATABASE_PROVIDER || 'sqlite';
  if((process.env.NETLIFY==='true'||process.env.VERCEL==='1')&&provider!=='postgres')throw new Error('Serverless deployments require DATABASE_PROVIDER=postgres; temporary SQLite cannot store admin sessions.');
  if (!['sqlite', 'postgres'].includes(provider)) throw new Error('DATABASE_PROVIDER must be sqlite or postgres.');
  if(process.env.VERCEL_ENV==='preview'&&provider==='postgres'&&databaseSchema()!=='bigk_staging')throw new Error('Preview deployments require DATABASE_SCHEMA=bigk_staging.');
  return provider === 'postgres';
}
function postgresClient() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured on the server for Supabase PostgreSQL.');
  const localTest = process.env.NODE_ENV === 'test' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname);
  return client ??= postgres(process.env.DATABASE_URL, {
    max: localTest ? 1 : 3, prepare: false, ssl: localTest ? false : { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT } : {}) },
    types: { bigint: { to: 20, from: [20], serialize: String, parse: (value: string) => { const n = Number(value); if (!Number.isSafeInteger(n)) throw new Error('Database integer exceeds safe range.'); return n; } } },
    idle_timeout: 20, connect_timeout: 10,
    connection: { search_path: databaseSchema()+',pg_catalog', statement_timeout: 15000 },
  });
}
// Only application-owned constant SQL reaches this adapter. Values stay bound.
export function postgresQuery(text: string) {
  let index = 0;
  let result = text.replace(/\?/g, () => '$' + (++index));
  result = result.replace(/\browid\b/g, 'position');
  result = result.replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(products|variants|orders|order_lines|webhook_events|sessions|rate_limits|audit|login_tokens|customer_sessions|email_outbox|club_members|club_orders|club_ledger|club_events|club_bookings|product_content|product_revisions|admin_credentials|admin_returns|media_assets|withdrawal_requests|warehouse_return_receipts|shipping_test_attempts)\b/g, '$1 '+databaseSchema()+'.$2');
  result = result.replace(/AS unitPrice\b/g, 'AS "unitPrice"').replace(/AS variantId\b/g, 'AS "variantId"');
  result = result.replace(/SET hits=hits\+1/g, 'SET hits=rate_limits.hits+1');
  if (/INSERT OR IGNORE INTO/.test(result)) result = result.replace('INSERT OR IGNORE INTO', 'INSERT INTO') + ' ON CONFLICT DO NOTHING';
  return result;
}
const sqliteQuery: Query = async (text, values) => {
  const statement = sqlite().prepare(text);
  const args = values as (string | number | null | Uint8Array)[];
  if (/^\s*SELECT\b/i.test(text)) return { rows: statement.all(...args) as Row[], changes: 0 };
  return { rows: [], changes: Number(statement.run(...args).changes) };
};
const execute: Query = async (text, values) => {
  const bound = context.getStore();
  if (bound) return bound(text, values);
  if (!isPostgres()) {
    const operation = sqliteQueue.then(() => sqliteQuery(text, values));
    sqliteQueue = operation.catch(() => {});
    return operation;
  }
  const rows = await postgresClient().unsafe(postgresQuery(text), values as never[]);
  return { rows: rows as unknown as Row[], changes: rows.count };
};
export function db() {
  return { prepare(text: string) { return {
    async all(...values: unknown[]) { return (await execute(text, values)).rows; },
    async get(...values: unknown[]) { return (await execute(text, values)).rows[0]; },
    async run(...values: unknown[]) { return { changes: (await execute(text, values)).changes }; },
  }; } };
}
export async function transaction<T>(fn: () => T | Promise<T>): Promise<T> {
  if (context.getStore()) return fn();
  if (isPostgres()) {
    return await postgresClient().begin(async sql => {
      // Serialize short write transactions across instances for a small store.
      await sql`SELECT pg_advisory_xact_lock(2049351, 1)`;
      const query: Query = async (text, values) => {
        const rows = await sql.unsafe(postgresQuery(text), values as never[]);
        return { rows: rows as unknown as Row[], changes: rows.count };
      };
      return context.run(query, fn);
    }) as T;
  }
  const operation = sqliteQueue.then(async () => {
    const sql = sqlite();
    sql.exec('BEGIN IMMEDIATE');
    try { const value = await context.run(sqliteQuery, fn); sql.exec('COMMIT'); return value; }
    catch (error) { sql.exec('ROLLBACK'); throw error; }
  });
  sqliteQueue = operation.catch(() => {});
  return operation;
}
export async function closeDatabase() { if (client) { await client.end(); client = undefined; } }
