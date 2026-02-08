import axios from 'axios';

export interface JobPostingCreateInput {
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

export interface JobPosting {
  id: string;
  employerId: string;
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
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
  credential?: Record<string, unknown>;
  /** Whether visible on marketplace browse. Default true. */
  visibility?: boolean;
  /** active = open, revoked = cancelled/completed */
  status?: 'active' | 'revoked';
  createdAt?: string;
  updatedAt?: string;
}

export async function createJobPosting(input: JobPostingCreateInput): Promise<JobPosting> {
  const res = await axios.post<JobPosting>('/api/employer/jobs', input);
  return res.data;
}

export async function listJobPostings(employerId: string): Promise<JobPosting[]> {
  const res = await axios.get<{ jobs: JobPosting[] }>('/api/employer/jobs', {
    params: { employerId },
  });
  return res.data.jobs;
}

export interface EmployerProfile {
  employerId: string;
  credential: Record<string, unknown>;
}

/** Extract credentialSubject from MarketplaceProfileCredential. */
export function profileSubjectFromCredential(profile: EmployerProfile | null): Record<string, unknown> {
  const cred = profile?.credential as { credentialSubject?: Record<string, unknown> } | undefined;
  return cred?.credentialSubject ?? {};
}

/** Extract email from credentialSubject (contactPoint.email or direct email for backward compatibility). */
export function emailFromSubject(subject: Record<string, unknown>): string | undefined {
  const cp = subject.contactPoint as Record<string, unknown> | undefined;
  return (cp?.email as string) ?? (subject.email as string) ?? undefined;
}

/** Employer workflow type ids and labels. */
export const WORKFLOW_TYPES = [
  { id: 'apply-job', label: 'Apply for a job' },
  { id: 'visit-website', label: 'Visit Website' },
  { id: 'verify-tenant', label: 'Verify Tenant' },
  { id: 'browse-opportunities', label: 'Browse Opportunities' },
  { id: 'contact-employer', label: 'Contact Employer' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  available: 'Available',
};

export function workflowStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? 'Available';
}

export async function getEmployerProfile(employerId: string): Promise<EmployerProfile | null> {
  try {
    const res = await axios.get<EmployerProfile>('/api/employer/profile', {
      params: { employerId },
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export interface EmployerWorkflow {
  id: string;
  tenantRequestId?: string;
  workflowType: string;
  status: string;
  currentStep?: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export async function listEmployerWorkflows(employerId: string): Promise<EmployerWorkflow[]> {
  const res = await axios.get<{ workflows: EmployerWorkflow[] }>('/api/employer/workflows', {
    params: { employerId },
  });
  return res.data?.workflows ?? [];
}

export async function getJobPosting(id: string): Promise<JobPosting | null> {
  try {
    const res = await axios.get<JobPosting>(`/api/jobs/${id}`);
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
}

export async function updateJobVisibility(
  jobId: string,
  employerId: string,
  visibility: boolean
): Promise<JobPosting> {
  const res = await axios.patch<JobPosting>('/api/employer/jobs', { visibility }, {
    params: { id: jobId, employerId },
  });
  return res.data;
}

export async function revokeJobPosting(jobId: string, employerId: string): Promise<JobPosting> {
  const res = await axios.patch<JobPosting>('/api/employer/jobs', { status: 'revoked' }, {
    params: { id: jobId, employerId },
  });
  return res.data;
}

export async function reopenJobPosting(jobId: string, employerId: string): Promise<JobPosting> {
  const res = await axios.patch<JobPosting>('/api/employer/jobs', { status: 'active' }, {
    params: { id: jobId, employerId },
  });
  return res.data;
}
