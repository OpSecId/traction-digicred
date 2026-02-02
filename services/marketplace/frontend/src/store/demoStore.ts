import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import type { DemoConfig, JobWithEmployer } from '@/types/demo';
import embeddedDemo from '@/data/embeddedDemo.json';

export const useDemoStore = defineStore('demo', () => {
  const config = ref<DemoConfig | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const employers = computed(() => {
    if (!config.value) return [];
    const personas = Array.isArray(config.value.personas) ? config.value.personas : [];
    return personas.filter((p) => p.type === 'Employer');
  });

  const allJobs = computed<JobWithEmployer[]>(() => {
    if (!config.value) return [];
    const personas = Array.isArray(config.value.personas) ? config.value.personas : [];
    const jobs: JobWithEmployer[] = [];
    for (const employer of personas) {
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

  function normalizeConfig(data: unknown): DemoConfig {
    const obj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const personas = Array.isArray(obj.personas) ? obj.personas : [];
    return { ...obj, personas } as DemoConfig;
  }

  async function tryFallback(): Promise<DemoConfig> {
    const res = await axios.get('/demo.json');
    return normalizeConfig(res.data);
  }

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const res = await axios.get('/api/config/demo');
      const normalized = normalizeConfig(res.data);
      // Validate: API may return HTML (SPA fallback) instead of JSON
      const hasEmployers = Array.isArray(normalized.personas) && normalized.personas.some((p) => p.type === 'Employer');
      if (!hasEmployers) {
        config.value = await tryFallback();
      } else {
        config.value = normalized;
      }
      return config.value;
    } catch (e) {
      // Fallback to /demo.json when API is unavailable
      try {
        config.value = await tryFallback();
        return config.value;
      } catch {
        // Ultimate fallback: use demo data bundled at build time (works when API and /demo.json return 502)
        config.value = normalizeConfig(embeddedDemo);
        return config.value;
      }
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
