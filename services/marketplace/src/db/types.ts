/**
 * Database interface types.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  /** Run a SELECT query, returns rows */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;

  /** Run an INSERT/UPDATE/DELETE, returns affected row count */
  run(sql: string, params?: unknown[]): Promise<{ rowsAffected: number; lastInsertId?: number | string }>;

  /** Close the connection */
  close(): Promise<void>;
}
