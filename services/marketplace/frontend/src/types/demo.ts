export type TenancyType = 'Employer' | 'Scholarship Admin' | 'Education Institution' | 'Government Service';

export interface TenantRequest {
  id: string;
  referenceId?: string;
  tenancyType: TenancyType;
  name: string;
  email: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
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
  credential?: Record<string, unknown>;
}
