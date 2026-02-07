import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Applicant {
  id: string;
  jobId: string;
  name: string;
  email: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  appliedAt: string;
}

// Simulated applicants for job postings (from recommendations)
export const useApplicantStore = defineStore('applicants', () => {
  const applicants = ref<Applicant[]>([]);

  function getApplicantsForJob(jobId: string) {
    return applicants.value.filter((a) => a.jobId === jobId);
  }

  function addApplicant(jobId: string, name: string, email: string) {
    const applicant: Applicant = {
      id: `app-${Date.now()}`,
      jobId,
      name,
      email,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    applicants.value.push(applicant);
    return applicant;
  }

  function updateApplicantStatus(id: string, status: Applicant['status']) {
    const a = applicants.value.find((x) => x.id === id);
    if (a) a.status = status;
  }

  return {
    applicants,
    getApplicantsForJob,
    addApplicant,
    updateApplicantStatus,
  };
});
