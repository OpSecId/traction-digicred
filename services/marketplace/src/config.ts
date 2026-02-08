/**
 * Backend configuration from environment variables.
 */

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

/** Derive did:web for a tenant (e.g. did:web:marketplace.example.com:tenant:uuid). */
export function tenantDidWeb(tenantId: string): string {
  const base = didWebFromUrl(marketplaceBaseUrl);
  const id = tenantId.replace(/^urn:uuid:/i, '').replace(/^urn:employer:/i, '');
  return `${base}:tenant:${id}`;
}

/** Derive did:web for a tenant by short ID (e.g. did:web:marketplace.example.com:tenants:abc123). */
export function tenantDidWebForShortId(shortId: string): string {
  const base = didWebFromUrl(marketplaceBaseUrl);
  return `${base}:tenants:${shortId}`;
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
