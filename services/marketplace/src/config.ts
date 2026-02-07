/**
 * Backend configuration from environment variables.
 */

export type DbType = 'postgres' | 'sqlite';

export const dbConfig = {
  type: (process.env.DATABASE_TYPE || 'sqlite').toLowerCase() as DbType,
  /** PostgreSQL: connection URL, e.g. postgresql://user:pass@localhost:5432/marketplace */
  url: process.env.DATABASE_URL || '',
  /** SQLite: path to .db file (default: ./data/marketplace.db) */
  path: process.env.DATABASE_PATH || './data/marketplace.db',
};

export const marketplaceAdminConfig = {
  uri: process.env.MARKETPLACE_ADMIN_URI || '',
  apiKey: process.env.MARKETPLACE_ADMIN_API_KEY || '',
};

export const marketplaceTenancyConfig = {
  uri: process.env.MARKETPLACE_TENANCY_URI || '',
  apiKey: process.env.MARKETPLACE_TENANCY_API_KEY || '',
};

/** MongoDB connection for job postings, employer profiles, tenant requests, etc. */
export const mongoConfig = {
  uri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017',
  database: process.env.MONGO_DATABASE || 'marketplace',
};
