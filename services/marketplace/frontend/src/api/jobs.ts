import axios from 'axios';

export interface JobWithEmployer {
  id: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  name?: string;
  title: string;
  description: string;
  category?: string;
  datePosted?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export async function listJobs(): Promise<JobWithEmployer[]> {
  const res = await axios.get<{ jobs: JobWithEmployer[] }>('/api/jobs');
  return res.data.jobs ?? [];
}
