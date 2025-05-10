import sql from 'mssql';

export type SQLServerConnection = {
  user: string;
  password: string;
  server: string;
  database: string;
  port?: number;
};

const poolMap = new Map<string, sql.ConnectionPool>();

function getPoolKey(conn: SQLServerConnection): string {
  return `${conn.user}@${conn.server}:${conn.port || 1433}/${conn.database}`;
}

async function getOrCreateSQLServerPool(conn: SQLServerConnection): Promise<sql.ConnectionPool> {
  const key = getPoolKey(conn);

  if (poolMap.has(key)) {
    const existing = poolMap.get(key)!;
    if (existing.connected) return existing;
    await existing.connect(); // re-connect if needed
    return existing;
  }

  const config: sql.config = {
    user: conn.user,
    password: conn.password,
    server: conn.server,
    database: conn.database,
    port: conn.port || 1433,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 10000,
    },
  };

  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  poolMap.set(key, pool);
  return pool;
}

export async function executeSQLServerQuery(
  connection: SQLServerConnection,
  query: string,
  values: any[] = []
): Promise<any[]> {
  const pool = await getOrCreateSQLServerPool(connection);
  try {
    const result = await pool.request().query(query);
    return result.recordset;
  } catch (err) {
    console.error('SQL Server Query Error:', err);
    throw new Error(`SQL Server query failed: ${err}`);
  }
}

export async function getSQLServerFields(
  connection: SQLServerConnection,
  table: string
): Promise<string[]> {
  const pool = await getOrCreateSQLServerPool(connection);
  try {
    const result = await pool
      .request()
      .query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`);
    return result.recordset.map((row: any) => row.COLUMN_NAME);
  } catch (err) {
    console.warn(`Failed to fetch fields from SQL Server table '${table}':`, err);
    return [];
  }
}