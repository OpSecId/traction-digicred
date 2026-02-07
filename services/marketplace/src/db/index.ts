/**
 * Database interface - supports PostgreSQL and SQLite.
 * Configure via DATABASE_TYPE (postgres | sqlite), DATABASE_URL, DATABASE_PATH.
 */

import { dbConfig } from '../config';
import { createPostgresClient } from './postgres';
import { createSqliteClient } from './sqlite';
import type { DbClient } from './types';

let db: DbClient | null = null;

export async function getDb(): Promise<DbClient> {
  if (db) return db;

  const { type, url, path } = dbConfig;

  if (type === 'postgres') {
    if (!url) throw new Error('DATABASE_URL is required when DATABASE_TYPE=postgres');
    db = await createPostgresClient(url);
  } else if (type === 'sqlite') {
    db = await createSqliteClient(path);
  } else {
    throw new Error(`Unknown DATABASE_TYPE: ${type}. Use 'postgres' or 'sqlite'.`);
  }

  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

export type { DbClient, QueryResult } from './types';
