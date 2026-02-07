export interface JobPosting {
  id: string;
  type: string;
  name: string;
  description: string;
  category?: string;
  featured?: boolean;
  requirements: string[];
  location?: string;
  employmentType?: string;
  salary?: string;
  benefits?: string[];
}

export interface EmployerPersona {
  id: string;
  type: string;
  name: string;
  category?: string;
  image?: string;
  logo?: string;
  jobPostings: JobPosting[];
}

export type TenantType = 'Employer' | 'Scholarship Admin' | 'Education Institution' | 'Government Service';

export interface TenantRequest {
  id: string;
  referenceId?: string;
  tenantType: TenantType;
  name: string;
  email: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  // KYC: contact person
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  // KYC: organization
  registrationId?: string;
  jurisdiction?: string;
  businessAddress?: string;
  website?: string;
  industry?: string;
  // KYC: intended use
  intendedUse?: string;
  // Employer-specific
  hiringVolume?: string;
  primaryIndustries?: string;
  // Scholarship Admin-specific
  fundingSource?: string;
  eligibilityOverview?: string;
  // Education Institution-specific
  accreditation?: string;
  credentialTypes?: string;
}

export interface DemoConfig {
  personas: EmployerPersona[];
  tenantRequests?: TenantRequest[];
}

export interface JobWithEmployer extends JobPosting {
  employerId: string;
  employerName: string;
  employerImage?: string;
  employerLogo?: string;
}
