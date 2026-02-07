/**
 * Employer profile controller - MarketplaceProfileCredential for employers.
 * Creates profile credential (no proof) when employer first creates a job.
 */

import { randomUUID } from 'crypto';
import { getDb } from '../db';

export interface EmployerProfileInput {
  employerId: string;
  employerName: string;
  employerEmail?: string;
  industry?: string;
  website?: string;
}

/** Build MarketplaceProfileCredential (without proof) for an employer */
export function buildEmployerProfileCredential(
  input: EmployerProfileInput
): Record<string, unknown> {
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

  const credentialSubject: Record<string, unknown> = {
    id: input.employerId,
    type: 'Organization',
    name: input.employerName,
    tenantType: 'Employer',
  };
  if (input.employerEmail) credentialSubject.email = input.employerEmail;
  if (input.industry) credentialSubject.industry = input.industry;
  if (input.website) credentialSubject.url = input.website;

  const issuerPlaceholder = input.employerId.startsWith('urn:')
    ? input.employerId
    : `urn:employer:${input.employerId}`;

  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://schema.org'],
    type: ['VerifiableCredential', 'MarketplaceProfileCredential'],
    id: `urn:uuid:${randomUUID()}`,
    issuer: issuerPlaceholder,
    validFrom,
    validUntil,
    name: 'Apply Utopia Marketplace Profile',
    description: `Verifies that ${input.employerName} is an approved employer on the Apply Utopia marketplace.`,
    credentialSubject,
  };
}

export async function getEmployerProfile(employerId: string): Promise<{
  employerId: string;
  credential: Record<string, unknown>;
} | null> {
  const db = await getDb();
  const { rows } = await db.query<{ employer_id: string; credential: string }>(
    'SELECT employer_id, credential FROM employer_profiles WHERE employer_id = ?',
    [employerId]
  );
  if (rows.length === 0) return null;
  return {
    employerId: rows[0].employer_id,
    credential: JSON.parse(rows[0].credential) as Record<string, unknown>,
  };
}

/** Create employer profile credential (used when admin approves Employer tenant). */
export async function createEmployerProfile(
  employerId: string,
  credential: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.run(
    `INSERT OR REPLACE INTO employer_profiles (employer_id, credential, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [employerId, JSON.stringify(credential), now, now]
  );
}

/** Ensure employer has a profile credential; create one (no proof) if not. Returns the credential. */
export async function ensureEmployerProfile(
  input: EmployerProfileInput
): Promise<Record<string, unknown>> {
  const existing = await getEmployerProfile(input.employerId);
  if (existing) return existing.credential;

  const credential = buildEmployerProfileCredential(input);
  const db = await getDb();
  const now = new Date().toISOString();
  await db.run(
    `INSERT INTO employer_profiles (employer_id, credential, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [input.employerId, JSON.stringify(credential), now, now]
  );
  return credential;
}
