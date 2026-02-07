/**
 * Job posting controller - CRUD for employer job postings.
 * Attaches JobPostingCredential (without proof) to each posting.
 */

import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { ensureEmployerProfile } from './employerProfileController';

export interface JobPostingInput {
  employerId: string;
  employerName: string;
  employerEmail?: string;
  employerIndustry?: string;
  employerWebsite?: string;
  title: string;
  description: string;
  employmentType?: string;
  locationCity?: string;
  locationRegion?: string;
  locationCountry?: string;
  locationType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryDisplay?: string;
  skills?: string[];
  qualifications?: string[];
  benefits?: string;
  industry?: string;
  validThrough?: string;
}

export interface JobPostingRow {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  date_posted: string;
  valid_through: string | null;
  employment_type: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
  location_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_display: string | null;
  skills: string | null;
  qualifications: string | null;
  benefits: string | null;
  industry: string | null;
  credential: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Build JobPostingCredential (without proof) from job posting data. */
export function buildJobPostingCredential(
  jobId: string,
  input: JobPostingInput
): Record<string, unknown> {
  const now = new Date();
  const validFrom = now.toISOString();
  const validUntil = input.validThrough ?? new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

  const credentialSubject: Record<string, unknown> = {
    id: jobId,
    type: 'JobPosting',
    title: input.title,
    description: input.description,
    datePosted: now.toISOString(),
    validThrough: validUntil,
    hiringOrganization: {
      type: 'Organization',
      id: input.employerId,
      name: input.employerName,
    },
  };

  if (input.employmentType) credentialSubject.employmentType = input.employmentType;
  if (input.industry) credentialSubject.industry = input.industry;
  if (input.skills?.length) credentialSubject.skills = input.skills;
  if (input.qualifications?.length) credentialSubject.qualifications = input.qualifications;

  if (input.locationCity || input.locationRegion || input.locationCountry) {
    credentialSubject.jobLocation = {
      type: 'Place',
      address: {
        type: 'PostalAddress',
        ...(input.locationCity && { addressLocality: input.locationCity }),
        ...(input.locationRegion && { addressRegion: input.locationRegion }),
        ...(input.locationCountry && { addressCountry: input.locationCountry }),
      },
    };
  }

  if (input.salaryMin != null || input.salaryMax != null) {
    credentialSubject.baseSalary = {
      type: 'MonetaryAmount',
      currency: input.salaryCurrency ?? 'USD',
      value: {
        type: 'QuantitativeValue',
        ...(input.salaryMin != null && { minValue: input.salaryMin }),
        ...(input.salaryMax != null && { maxValue: input.salaryMax }),
        unitText: 'YEAR',
      },
    };
  }

  // Issuer placeholder: employer's tenant DID when available; for now use employer id
  const issuerPlaceholder = input.employerId.startsWith('urn:') ? input.employerId : `urn:employer:${input.employerId}`;

  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://schema.org'],
    type: ['VerifiableCredential', 'JobPostingCredential'],
    id: jobId,
    issuer: issuerPlaceholder,
    validFrom,
    validUntil,
    name: `${input.title} Job Posting`,
    description: `Verifiable job posting from ${input.employerName}.`,
    credentialSubject,
  };
}

function rowToJson(row: JobPostingRow) {
  return {
    id: row.id,
    employerId: row.employer_id,
    title: row.title,
    description: row.description,
    datePosted: row.date_posted,
    validThrough: row.valid_through ?? undefined,
    employmentType: row.employment_type ?? undefined,
    locationCity: row.location_city ?? undefined,
    locationRegion: row.location_region ?? undefined,
    locationCountry: row.location_country ?? undefined,
    locationType: row.location_type ?? undefined,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    salaryCurrency: row.salary_currency ?? undefined,
    salaryDisplay: row.salary_display ?? undefined,
    skills: row.skills ? (JSON.parse(row.skills) as string[]) : undefined,
    qualifications: row.qualifications ? (JSON.parse(row.qualifications) as string[]) : undefined,
    benefits: row.benefits ?? undefined,
    industry: row.industry ?? undefined,
    credential: row.credential ? (JSON.parse(row.credential) as Record<string, unknown>) : undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function createJobPosting(input: JobPostingInput) {
  // MarketplaceProfileCredential created on admin approval for Employer tenants; fallback for demo employers
  await ensureEmployerProfile({
    employerId: input.employerId,
    employerName: input.employerName,
    employerEmail: input.employerEmail,
    industry: input.employerIndustry,
    website: input.employerWebsite,
  });

  const id = `urn:uuid:${randomUUID()}`;
  const now = new Date().toISOString();

  const credential = buildJobPostingCredential(id, input);
  const credentialJson = JSON.stringify(credential);

  const db = await getDb();
  await db.run(
    `INSERT INTO job_postings (
      id, employer_id, title, description, date_posted, valid_through,
      employment_type, location_city, location_region, location_country, location_type,
      salary_min, salary_max, salary_currency, salary_display,
      skills, qualifications, benefits, industry, credential
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.employerId,
      input.title,
      input.description,
      now,
      input.validThrough ?? null,
      input.employmentType ?? null,
      input.locationCity ?? null,
      input.locationRegion ?? null,
      input.locationCountry ?? null,
      input.locationType ?? null,
      input.salaryMin ?? null,
      input.salaryMax ?? null,
      input.salaryCurrency ?? null,
      input.salaryDisplay ?? null,
      input.skills ? JSON.stringify(input.skills) : null,
      input.qualifications ? JSON.stringify(input.qualifications) : null,
      input.benefits ?? null,
      input.industry ?? null,
      credentialJson,
    ]
  );

  const { rows } = await db.query<JobPostingRow>('SELECT * FROM job_postings WHERE id = ?', [id]);
  if (rows.length === 0) throw new Error('Failed to fetch created job posting');
  return rowToJson(rows[0]);
}

export async function listJobPostingsByEmployer(employerId: string) {
  const db = await getDb();
  const { rows } = await db.query<JobPostingRow>(
    'SELECT * FROM job_postings WHERE employer_id = ? ORDER BY date_posted DESC',
    [employerId]
  );
  return rows.map(rowToJson);
}

export async function getJobPostingById(id: string) {
  const db = await getDb();
  const { rows } = await db.query<JobPostingRow>('SELECT * FROM job_postings WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return rowToJson(rows[0]);
}
