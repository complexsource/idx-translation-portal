import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

type MongoConnection = {
  uri?: string;
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  caPath?: string; // Optional SSL CA file
};

export async function getMongoDb(connection?: MongoConnection): Promise<Db> {
  if (cachedDb) return cachedDb;

  let uri: string;
  let options: any = {};

  // Build URI
  if (connection?.uri) {
    uri = connection.uri;
  } else if (connection?.host && connection?.user && connection?.password && connection?.database) {
    uri = `mongodb://${connection.user}:${connection.password}@${connection.host}/${connection.database}?authSource=admin`;
  } else {
    uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  }

  // Optional SSL
  if (connection?.caPath) {
    const ca = fs.readFileSync(path.resolve(connection.caPath));
    options = {
      ssl: true,
      sslValidate: true,
      sslCA: ca,
    };
  }

  const client = new MongoClient(uri, options);
  await client.connect();

  cachedClient = client;

  const dbName =
    connection?.database ||
    (connection?.uri ? new URL(connection.uri).pathname.replace(/^\//, '') : null) ||
    process.env.MONGODB_DB ||
    'test';

  cachedDb = client.db(dbName);
  console.log('Connected to MongoDB database:', dbName);

  return cachedDb;
}