"use strict";
/**
 * Backend configuration from environment variables.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoConfig = exports.marketplaceIssuer = exports.marketplaceContextUri = exports.marketplaceBaseUrl = exports.marketplaceInnkeeperToken = exports.marketplaceAgencyConfig = void 0;
exports.tenantDidWeb = tenantDidWeb;
exports.tenantDidWebForShortId = tenantDidWebForShortId;
/** Single multitenant ACA-Py agent (Innkeeper + Marketplace plugins). Admin and tenancy operations use this. */
exports.marketplaceAgencyConfig = {
    uri: process.env.MARKETPLACE_AGENCY_URI || '',
    apiKey: process.env.MARKETPLACE_AGENCY_API_KEY || '',
};
/** Innkeeper tenant Bearer token for tenant-scoped calls (e.g. /vc/sign). Get from agent startup logs or /multitenancy/tenant/{id}/token. */
exports.marketplaceInnkeeperToken = process.env.MARKETPLACE_INNKEEPER_TOKEN || '';
/** Base URL for the marketplace API (for context resolution). Used to build MARKETPLACE_CONTEXT_URI when not set. */
exports.marketplaceBaseUrl = process.env.MARKETPLACE_BASE_URL || `http://localhost:${process.env.PORT || 5174}`;
/** Marketplace JSON-LD context URI (served at GET /ns/marketplace/v1). Second item in credential @context. */
exports.marketplaceContextUri = process.env.MARKETPLACE_CONTEXT_URI || `${exports.marketplaceBaseUrl}/ns/marketplace/v1`;
/** Derive did:web from base URL (e.g. https://marketplace.example.com → did:web:marketplace.example.com). */
function didWebFromUrl(url) {
    try {
        const u = new URL(url);
        const host = u.hostname + (u.port && !['80', '443'].includes(u.port) ? '%3A' + u.port : '');
        return `did:web:${host}`;
    }
    catch {
        return 'did:web:localhost';
    }
}
/** Derive did:web for a tenant (e.g. did:web:marketplace.example.com:tenant:uuid). */
function tenantDidWeb(tenantId) {
    const base = didWebFromUrl(exports.marketplaceBaseUrl);
    const id = tenantId.replace(/^urn:uuid:/i, '').replace(/^urn:employer:/i, '');
    return `${base}:tenant:${id}`;
}
/** Derive did:web for a tenant by short ID (e.g. did:web:marketplace.example.com:tenants:abc123). */
function tenantDidWebForShortId(shortId) {
    const base = didWebFromUrl(exports.marketplaceBaseUrl);
    return `${base}:tenants:${shortId}`;
}
/** Credential issuer (marketplace). Object with id (did:web), name, image, description. */
exports.marketplaceIssuer = {
    id: process.env.MARKETPLACE_ISSUER_ID || didWebFromUrl(exports.marketplaceBaseUrl),
    name: process.env.MARKETPLACE_ISSUER_NAME || 'Apply Utopia Marketplace',
    image: process.env.MARKETPLACE_ISSUER_IMAGE || undefined,
    description: process.env.MARKETPLACE_ISSUER_DESCRIPTION || 'The Apply Utopia marketplace for jobs, scholarships, and services.',
};
/** MongoDB connection for job postings, employer profiles, tenant requests, etc. */
exports.mongoConfig = {
    uri: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGO_DATABASE || 'marketplace',
};
