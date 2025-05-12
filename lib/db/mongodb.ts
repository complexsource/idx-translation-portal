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
  pemPath?: string; // TLS client certificate (PEM)
  caPath?: string;  // Optional CA file (PEM)
};

export async function getMongoDb(connection?: MongoConnection): Promise<Db> {
  if (cachedDb) return cachedDb;

  let uri: string;
  const options: any = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  // Construct URI
  if (connection?.uri) {
    uri = connection.uri;
  } else if (connection?.host && connection?.user && connection?.password && connection?.database) {
    uri = `mongodb://${connection.user}:${connection.password}@${connection.host}/${connection.database}?authSource=admin`;
  } else {
    uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  }

  // TLS/SSL Options
  if (connection?.pemPath) {
    options.tls = true;
    options.tlsCertificateKeyFile = path.resolve(connection.pemPath);
  }

  if (connection?.caPath) {
    options.tlsCAFile = path.resolve(connection.caPath);
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