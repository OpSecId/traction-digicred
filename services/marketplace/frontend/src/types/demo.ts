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

export interface DemoConfig {
  personas: EmployerPersona[];
}

export interface JobWithEmployer extends JobPosting {
  employerId: string;
  employerName: string;
  employerImage?: string;
  employerLogo?: string;
}
