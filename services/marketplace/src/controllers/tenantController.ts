/**
 * Tenant request controller - CRUD for onboarding requests.
 */

import { randomUUID } from 'crypto';
import { getDb } from '../db';

/** Generate short reference ID for user-facing follow-up (e.g. REQ-7K2M9) */
function generateReferenceId(): string {
  const hex = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `REQ-${hex}`;
}

export interface TenantRequestInput {
  tenantType: string;
  name: string;
  email: string;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  registrationId?: string;
  jurisdiction?: string;
  businessAddress?: string;
  website?: string;
  industry?: string;
  intendedUse?: string;
  hiringVolume?: string;
  primaryIndustries?: string;
  fundingSource?: string;
  eligibilityOverview?: string;
  accreditation?: string;
  credentialTypes?: string;
}

export interface TenantRequestRow {
  id: string;
  reference_id: string | null;
  tenant_type: string;
  name: string;
  email: string;
  contact_name: string | null;
  contact_title: string | null;
  contact_phone: string | null;
  company_name: string | null;
  registration_id: string | null;
  jurisdiction: string | null;
  business_address: string | null;
  website: string | null;
  industry: string | null;
  intended_use: string | null;
  hiring_volume: string | null;
  primary_industries: string | null;
  funding_source: string | null;
  eligibility_overview: string | null;
  accreditation: string | null;
  credential_types: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function rowToJson(row: TenantRequestRow) {
  return {
    id: row.id,
    referenceId: row.reference_id ?? undefined,
    tenantType: row.tenant_type,
    name: row.name,
    email: row.email,
    contactName: row.contact_name ?? undefined,
    contactTitle: row.contact_title ?? undefined,
    contactPhone: row.contact_phone ?? undefined,
    companyName: row.company_name ?? undefined,
    registrationId: row.registration_id ?? undefined,
    jurisdiction: row.jurisdiction ?? undefined,
    businessAddress: row.business_address ?? undefined,
    website: row.website ?? undefined,
    industry: row.industry ?? undefined,
    intendedUse: row.intended_use ?? undefined,
    hiringVolume: row.hiring_volume ?? undefined,
    primaryIndustries: row.primary_industries ?? undefined,
    fundingSource: row.funding_source ?? undefined,
    eligibilityOverview: row.eligibility_overview ?? undefined,
    accreditation: row.accreditation ?? undefined,
    credentialTypes: row.credential_types ?? undefined,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function createTenantRequest(input: TenantRequestInput) {
  const id = `urn:uuid:${randomUUID()}`;
  const referenceId = generateReferenceId();
  const submittedAt = new Date().toISOString();

  const db = await getDb();
  await db.run(
    `INSERT INTO tenant_requests (
      id, reference_id, tenant_type, name, email,
      contact_name, contact_title, contact_phone,
      company_name, registration_id, jurisdiction, business_address, website, industry,
      intended_use, hiring_volume, primary_industries, funding_source, eligibility_overview,
      accreditation, credential_types,
      status, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      referenceId,
      input.tenantType,
      input.name,
      input.email,
      input.contactName ?? null,
      input.contactTitle ?? null,
      input.contactPhone ?? null,
      input.name, // company_name = name (legal entity)
      input.registrationId ?? null,
      input.jurisdiction ?? null,
      input.businessAddress ?? null,
      input.website ?? null,
      input.industry ?? null,
      input.intendedUse ?? null,
      input.hiringVolume ?? null,
      input.primaryIndustries ?? null,
      input.fundingSource ?? null,
      input.eligibilityOverview ?? null,
      input.accreditation ?? null,
      input.credentialTypes ?? null,
      'pending',
      submittedAt,
    ]
  );

  const { rows } = await db.query<TenantRequestRow>('SELECT * FROM tenant_requests WHERE id = ?', [id]);
  if (rows.length === 0) throw new Error('Failed to fetch created tenant request');
  return rowToJson(rows[0]);
}

export async function listTenantRequests(): Promise<ReturnType<typeof rowToJson>[]> {
  const db = await getDb();
  const { rows } = await db.query<TenantRequestRow>(
    'SELECT * FROM tenant_requests ORDER BY submitted_at DESC'
  );
  return rows.map(rowToJson);
}

export async function getTenantRequestById(id: string): Promise<ReturnType<typeof rowToJson> | null> {
  const db = await getDb();
  const { rows } = await db.query<TenantRequestRow>('SELECT * FROM tenant_requests WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return rowToJson(rows[0]);
}

/** Seed demo tenant requests when DB is empty */
export async function seedTenantRequestsIfEmpty(
  demoRequests: Array<{
    id: string;
    tenantType: string;
    name: string;
    email: string;
    contactName?: string;
    contactTitle?: string;
    contactPhone?: string;
    registrationId?: string;
    jurisdiction?: string;
    businessAddress?: string;
    website?: string;
    industry?: string;
    intendedUse?: string;
    hiringVolume?: string;
    primaryIndustries?: string;
    fundingSource?: string;
    eligibilityOverview?: string;
    accreditation?: string;
    credentialTypes?: string;
    submittedAt?: string;
  }>
): Promise<void> {
  const existing = await listTenantRequests();
  if (existing.length > 0) return;

  const db = await getDb();
  for (const r of demoRequests) {
    const id = r.id;
    const referenceId = generateReferenceId();
    const submittedAt = r.submittedAt ?? new Date().toISOString();
    await db.run(
      `INSERT INTO tenant_requests (
        id, reference_id, tenant_type, name, email,
        contact_name, contact_title, contact_phone,
        company_name, registration_id, jurisdiction, business_address, website, industry,
        intended_use, hiring_volume, primary_industries, funding_source, eligibility_overview,
        accreditation, credential_types,
        status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        referenceId,
        r.tenantType,
        r.name,
        r.email,
        r.contactName ?? null,
        r.contactTitle ?? null,
        r.contactPhone ?? null,
        r.name,
        r.registrationId ?? null,
        r.jurisdiction ?? null,
        r.businessAddress ?? null,
        r.website ?? null,
        r.industry ?? null,
        r.intendedUse ?? null,
        r.hiringVolume ?? null,
        r.primaryIndustries ?? null,
        r.fundingSource ?? null,
        r.eligibilityOverview ?? null,
        r.accreditation ?? null,
        r.credentialTypes ?? null,
        'pending',
        submittedAt,
      ]
    );
  }
  console.log('Seeded', demoRequests.length, 'demo tenant requests');
}

export async function updateTenantRequestStatus(
  id: string,
  status: 'approved' | 'rejected',
  options?: { reviewedBy?: string; rejectionReason?: string }
) {
  const reviewedAt = new Date().toISOString();
  const db = await getDb();

  if (status === 'rejected' && options?.rejectionReason) {
    await db.run(
      `UPDATE tenant_requests SET status = ?, reviewed_at = ?, reviewed_by = ?, rejection_reason = ?, updated_at = ? WHERE id = ?`,
      [status, reviewedAt, options.reviewedBy ?? null, options.rejectionReason, reviewedAt, id]
    );
  } else {
    await db.run(
      `UPDATE tenant_requests SET status = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?`,
      [status, reviewedAt, options?.reviewedBy ?? null, reviewedAt, id]
    );
  }

  const { rows } = await db.query<TenantRequestRow>('SELECT * FROM tenant_requests WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return rowToJson(rows[0]);
}
