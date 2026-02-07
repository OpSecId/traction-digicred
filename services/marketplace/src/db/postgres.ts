/**
 * PostgreSQL database client.
 */

import { Pool, PoolClient } from 'pg';
import type { DbClient, QueryResult } from './types';

function toPgParams(sql: string, params: unknown[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function createPostgresClient(url: string): Promise<DbClient> {
  const pool = new Pool({ connectionString: url });

  const getClient = async (): Promise<PoolClient> => {
    const client = await pool.connect();
    return client;
  };

  return {
    async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
      const pgSql = toPgParams(sql, params);
      const result = await pool.query(pgSql, params);
      return {
        rows: (result.rows as T[]) || [],
        rowCount: result.rowCount ?? 0,
      };
    },

    async run(sql: string, params: unknown[] = []): Promise<{ rowsAffected: number; lastInsertId?: number | string }> {
      const pgSql = toPgParams(sql, params);
      const result = await pool.query(pgSql, params);
      const row = result.rows?.[0] as Record<string, unknown> | undefined;
      const lastInsertId = row?.id;
      return {
        rowsAffected: result.rowCount ?? 0,
        lastInsertId: lastInsertId != null ? (lastInsertId as number | string) : undefined,
      };
    },

    async close(): Promise<void> {
      await pool.end();
    },
  };
}
