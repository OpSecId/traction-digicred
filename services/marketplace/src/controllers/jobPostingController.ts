/**
 * Build JobPostingCredential (unsigned) for job postings.
 */

import { marketplaceContextUri } from '../config';
import { toDatetimeString } from '../utils/datetime';

export interface IssuerObject {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

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

/** Build JobPostingCredential (without proof) from job posting data. */
export function buildJobPostingCredential(
  jobId: string,
  input: JobPostingInput,
  issuer: IssuerObject
): Record<string, unknown> {
  const now = new Date();
  const validFrom = toDatetimeString(now);
  const validUntil = input.validThrough ?? toDatetimeString(new Date(now.getFullYear(), 11, 31, 23, 59, 59));

  const credentialSubject: Record<string, unknown> = {
    id: jobId,
    type: 'JobPosting',
    title: input.title,
    description: input.description,
    datePosted: toDatetimeString(now),
    validThrough: validUntil,
    hiringOrganization: {
      type: 'Organization',
      id: input.employerWebsite ?? input.employerId,
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

  const issuerObj: Record<string, unknown> = {
    id: issuer.id,
    name: issuer.name,
    ...(issuer.description && { description: issuer.description }),
    ...(issuer.image && { image: issuer.image }),
  };

  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', marketplaceContextUri],
    type: ['VerifiableCredential', 'JobPostingCredential'],
    id: jobId,
    issuer: issuerObj,
    validFrom,
    validUntil,
    name: `${input.title} Job Posting`,
    description: `Verifiable job posting from ${input.employerName}.`,
    credentialSubject,
  };
}
