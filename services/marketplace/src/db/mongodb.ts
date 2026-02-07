/**
 * MongoDB connection for marketplace UI data: job postings, employer profiles,
 * tenant requests, credential analysis config, etc.
 */

import { MongoClient, Db } from 'mongodb';
import { mongoConfig } from '../config';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(mongoConfig.uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await client.connect();
  db = client.db(mongoConfig.database);

  return db;
}

export async function closeMongoDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
