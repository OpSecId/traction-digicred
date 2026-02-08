/**
 * Build MarketplaceProfileCredential (unsigned) for employers.
 */

import { randomUUID } from 'crypto';
import { marketplaceContextUri, marketplaceIssuer } from '../config';
import { toDatetimeString } from '../utils/datetime';

export interface EmployerProfileInput {
  employerId: string;
  employerName: string;
  employerEmail?: string;
  industry?: string;
  website?: string;
  /** Override for credentialSubject.id (e.g. did:web for tenant). When not set, uses employerId. */
  subjectId?: string;
}

/** Build MarketplaceProfileCredential (without proof) for an employer */
export function buildEmployerProfileCredential(
  input: EmployerProfileInput
): Record<string, unknown> {
  const now = new Date();
  const validFrom = toDatetimeString(now);
  const validUntil = toDatetimeString(new Date(now.getFullYear(), 11, 31, 23, 59, 59));

  const credentialSubject: Record<string, unknown> = {
    id: input.subjectId ?? input.employerId,
    type: 'Organization',
    name: input.employerName,
    tenancyType: 'Employer',
  };
  if (input.industry) credentialSubject.industry = input.industry;
  if (input.website) credentialSubject.url = input.website;
  if (input.employerEmail) {
    credentialSubject.contactPoint = { type: 'ContactPoint', email: input.employerEmail };
  }

  const issuerObj: Record<string, unknown> = {
    id: marketplaceIssuer.id,
    name: marketplaceIssuer.name,
    ...(marketplaceIssuer.image && { image: marketplaceIssuer.image }),
    ...(marketplaceIssuer.description && { description: marketplaceIssuer.description }),
  };

  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', marketplaceContextUri],
    type: ['VerifiableCredential', 'MarketplaceProfileCredential'],
    id: `urn:uuid:${randomUUID()}`,
    issuer: issuerObj,
    validFrom,
    validUntil,
    name: 'Apply Utopia Marketplace Profile',
    description: `Verifies that ${input.employerName} is an approved employer on the Apply Utopia marketplace.`,
    credentialSubject,
  };
}
