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

/** Single multitenant ACA-Py agent (Innkeeper + Marketplace plugins). Admin and tenancy operations use this. */
export const marketplaceAgencyConfig = {
  uri: process.env.MARKETPLACE_AGENCY_URI || '',
  apiKey: process.env.MARKETPLACE_AGENCY_API_KEY || '',
};

/** Innkeeper tenant Bearer token for tenant-scoped calls (e.g. /vc/sign). Get from agent startup logs or /multitenancy/tenant/{id}/token. */
export const marketplaceInnkeeperToken = process.env.MARKETPLACE_INNKEEPER_TOKEN || '';

/** Base URL for the marketplace API (for context resolution). Used to build MARKETPLACE_CONTEXT_URI when not set. */
export const marketplaceBaseUrl =
  process.env.MARKETPLACE_BASE_URL || `http://localhost:${process.env.PORT || 5174}`;

/** Marketplace JSON-LD context URI (served at GET /ns/marketplace/v1). Second item in credential @context. */
export const marketplaceContextUri =
  process.env.MARKETPLACE_CONTEXT_URI || `${marketplaceBaseUrl}/ns/marketplace/v1`;

/** Derive did:web from base URL (e.g. https://marketplace.example.com → did:web:marketplace.example.com). */
function didWebFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname + (u.port && !['80', '443'].includes(u.port) ? '%3A' + u.port : '');
    return `did:web:${host}`;
  } catch {
    return 'did:web:localhost';
  }
}

/** Credential issuer (marketplace). Object with id (did:web), name, image, description. */
export const marketplaceIssuer = {
  id: process.env.MARKETPLACE_ISSUER_ID || didWebFromUrl(marketplaceBaseUrl),
  name: process.env.MARKETPLACE_ISSUER_NAME || 'Apply Utopia Marketplace',
  image: process.env.MARKETPLACE_ISSUER_IMAGE || undefined,
  description: process.env.MARKETPLACE_ISSUER_DESCRIPTION || 'The Apply Utopia marketplace for jobs, scholarships, and services.',
};

/** MongoDB connection for job postings, employer profiles, tenant requests, etc. */
export const mongoConfig = {
  uri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017',
  database: process.env.MONGO_DATABASE || 'marketplace',
};
