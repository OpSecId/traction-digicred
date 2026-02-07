/**
 * SQLite database client.
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import type { DbClient, QueryResult } from './types';

export async function createSqliteClient(dbPath: string): Promise<DbClient> {
  const dir = path.dirname(dbPath);
  if (dir && dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);

  return {
    async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as T[];
      return {
        rows,
        rowCount: rows.length,
      };
    },

    async run(sql: string, params: unknown[] = []): Promise<{ rowsAffected: number; lastInsertId?: number | string }> {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      const lastInsertId =
        result.lastInsertRowid != null && result.lastInsertRowid !== BigInt(0)
          ? Number(result.lastInsertRowid)
          : undefined;
      return {
        rowsAffected: result.changes,
        lastInsertId,
      };
    },

    async close(): Promise<void> {
      db.close();
    },
  };
}
