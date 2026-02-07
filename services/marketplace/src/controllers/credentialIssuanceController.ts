/**
 * Credential issuance for tenant approval.
 * Builds MarketplaceProfileCredential and signs via agent /vc/sign.
 */

import { randomUUID } from 'crypto';
import { agentRequest } from './agentClient';
import { marketplaceAdminConfig } from '../config';

export interface TenantRequestForCredential {
  id: string;
  name: string;
  email: string;
  tenantType?: string;
  industry?: string;
  website?: string;
  businessAddress?: string;
}

/** Build unsigned MarketplaceProfileCredential payload from tenant request */
export function buildMarketplaceProfileCredential(
  tenantRequest: TenantRequestForCredential
): Record<string, unknown> {
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

  const credentialSubject: Record<string, unknown> = {
    id: tenantRequest.id,
    type: 'Organization',
    name: tenantRequest.name,
    email: tenantRequest.email,
    tenantType: tenantRequest.tenantType ?? 'Employer',
  };
  if (tenantRequest.website) credentialSubject.url = tenantRequest.website;
  if (tenantRequest.industry) credentialSubject.industry = tenantRequest.industry;
  if (tenantRequest.businessAddress) {
    credentialSubject.address = {
      type: 'PostalAddress',
      streetAddress: tenantRequest.businessAddress,
    };
  }

  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://schema.org'],
    type: ['VerifiableCredential', 'MarketplaceProfileCredential'],
    id: `urn:uuid:${randomUUID()}`,
    validFrom,
    validUntil,
    name: 'Apply Utopia Marketplace Profile',
    description: `Verifies that ${tenantRequest.name} is an approved participant on the Apply Utopia marketplace.`,
    credentialSubject,
  };
}

/** Sign credential via agent /vc/sign endpoint. Returns signed credential or null if agent unavailable. */
export async function signCredential(
  credential: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  if (!marketplaceAdminConfig.uri) {
    console.warn('Marketplace admin agent not configured; skipping credential signing');
    return null;
  }
  try {
    const signed = await agentRequest<Record<string, unknown>>(
      marketplaceAdminConfig,
      '/vc/sign',
      {
        method: 'POST',
        body: JSON.stringify(credential),
      }
    );
    return signed;
  } catch (err) {
    console.error('Credential signing failed:', err);
    return null;
  }
}

/** Issue MarketplaceProfileCredential for an approved tenant request. */
export async function issueMarketplaceProfileCredential(
  tenantRequest: TenantRequestForCredential
): Promise<Record<string, unknown> | null> {
  const credential = buildMarketplaceProfileCredential(tenantRequest);
  return signCredential(credential);
}
