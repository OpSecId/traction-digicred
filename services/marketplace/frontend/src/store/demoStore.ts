import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import type { DemoConfig, JobWithEmployer } from '@/types/demo';

export const useDemoStore = defineStore('demo', () => {
  const config = ref<DemoConfig | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const employers = computed(() => {
    if (!config.value) return [];
    return config.value.personas.filter((p) => p.type === 'Employer');
  });

  const allJobs = computed<JobWithEmployer[]>(() => {
    if (!config.value) return [];
    const jobs: JobWithEmployer[] = [];
    for (const employer of config.value.personas) {
      if (employer.type === 'Employer' && employer.jobPostings) {
        for (const job of employer.jobPostings) {
          jobs.push({
            ...job,
            employerId: employer.id,
            employerName: employer.name,
            employerImage: employer.image,
            employerLogo: employer.logo,
          });
        }
      }
    }
    return jobs;
  });

  const categories = computed(() => {
    const cats = new Set<string>();
    for (const job of allJobs.value) {
      if (job.category) cats.add(job.category);
    }
    return ['All', ...Array.from(cats).sort()];
  });

  const recommendedJobs = computed(() => {
    const featured = allJobs.value.filter((j) => j.featured);
    if (featured.length > 0) return featured;
    return allJobs.value.slice(0, 6);
  });

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await axios.get('/api/config/demo');
      config.value = res.data;
      return config.value;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function getJobsByEmployer(employerId: string) {
    return allJobs.value.filter((j) => j.employerId === employerId);
  }

  function getEmployerById(id: string) {
    return employers.value.find((e) => e.id === id);
  }

  return {
    config,
    loading,
    error,
    employers,
    allJobs,
    categories,
    recommendedJobs,
    load,
    getJobsByEmployer,
    getEmployerById,
  };
});
