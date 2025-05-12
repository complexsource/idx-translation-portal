import mysql from 'mysql2/promise';
import fs from 'fs';

type MySQLConnection = {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
  sslCaPath?: string;
  useSsl?: boolean; // new flag
};

function createPool(connection: MySQLConnection) {
  const config: mysql.PoolOptions = {
    host: connection.host,
    user: connection.user,
    password: connection.password ?? '',
    database: connection.database,
    port: connection.port || 3306,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  };

  // Enable SSL if useSsl is true OR sslCaPath is provided
  if (connection.useSsl || connection.sslCaPath) {
    config.ssl = connection.sslCaPath
      ? {
          ca: fs.readFileSync(connection.sslCaPath, 'utf8'),
          rejectUnauthorized: true,
        }
      : {
          rejectUnauthorized: true,
        };
  }

  return mysql.createPool(config);
}

export async function executeMySQLQuery(connection: MySQLConnection, query: string, values: any[] = []): Promise<any[]> {
  const pool = createPool(connection);
  const [rows] = await pool.execute(query, values);
  await pool.end();
  return rows as any[];
}

export async function getMySQLFields(connection: MySQLConnection, table: string): Promise<string[]> {
  const pool = createPool(connection);
  try {
    const [rows] = await pool.query(`DESCRIBE \`${table}\``);
    return (rows as any[]).map((row) => row.Field);
  } catch (error) {
    console.warn(`⚠️ Failed to describe table ${table}:`, error);
    return [];
  } finally {
    await pool.end();
  }
}