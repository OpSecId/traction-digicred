import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listJobPostings, getJobPosting, type JobPosting } from '@/api/employerJobs';

/** Caches employer-created job postings for use in EmployerJobs, JobApplicants, etc. */
export const useEmployerJobStore = defineStore('employerJob', () => {
  const jobs = ref<JobPosting[]>([]);

  function setJobs(list: JobPosting[]) {
    jobs.value = list;
  }

  function getJobById(id: string): JobPosting | undefined {
    return jobs.value.find((j) => j.id === id);
  }

  /** Get job by id; fetches from API if not in cache (e.g. direct navigation or refresh) */
  async function getOrFetchJob(id: string): Promise<JobPosting | null> {
    const cached = getJobById(id);
    if (cached) return cached;
    const job = await getJobPosting(id);
    if (job) {
      const idx = jobs.value.findIndex((j) => j.id === id);
      if (idx >= 0) jobs.value[idx] = job;
      else jobs.value.push(job);
    }
    return job;
  }

  async function loadForEmployer(employerId: string) {
    const list = await listJobPostings(employerId);
    jobs.value = list;
    return list;
  }

  return {
    jobs,
    setJobs,
    getJobById,
    getOrFetchJob,
    loadForEmployer,
  };
});
