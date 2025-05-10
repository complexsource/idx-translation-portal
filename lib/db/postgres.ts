import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export type PostgresConnection = {
  user?: string;
  host?: string;
  database?: string;
  password?: string;
  port?: number;
  connectionString?: string;
  caPath?: string; // optional SSL cert
};

const poolMap = new Map<string, Pool>();

function getPoolKey(conn: PostgresConnection): string {
  return conn.connectionString
    ? conn.connectionString
    : `${conn.user}@${conn.host}:${conn.port || 5432}/${conn.database}`;
}

function getOrCreatePool(connection: PostgresConnection): Pool {
  const key = getPoolKey(connection);

  if (!poolMap.has(key)) {
    let config: any;

    if (connection.connectionString) {
      config = { connectionString: connection.connectionString };
    } else {
      config = {
        user: connection.user,
        host: connection.host,
        database: connection.database,
        password: connection.password,
        port: connection.port || 5432,
      };
    }

    // Optional CA certificate
    if (connection.caPath) {
      const ca = fs.readFileSync(path.resolve(connection.caPath)).toString();
      config.ssl = {
        rejectUnauthorized: true,
        ca,
      };
    } else if (process.env.NODE_ENV === 'production') {
      config.ssl = { rejectUnauthorized: false };
    }

    config.max = 5;
    config.idleTimeoutMillis = 10000;
    config.statement_timeout = 10000;

    const pool = new Pool(config);
    poolMap.set(key, pool);
  }

  return poolMap.get(key)!;
}

export async function executePostgresQuery(
  connection: PostgresConnection,
  query: string,
  values: any[] = []
): Promise<any[]> {
  const pool = getOrCreatePool(connection);
  const client = await pool.connect();
  try {
    const res = await client.query(query, values);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function getPostgresFields(
  connection: PostgresConnection,
  table: string
): Promise<string[]> {
  const pool = getOrCreatePool(connection);
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [table]
    );
    return res.rows.map((row) => row.column_name);
  } catch (err) {
    console.warn(`⚠️ Failed to fetch PostgreSQL fields for table "${table}":`, err);
    return [];
  } finally {
    client.release();
  }
}