import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { listJobs, type JobWithEmployer } from '@/api/jobs';

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref<JobWithEmployer[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const allJobs = computed(() => jobs.value);
  const categories = computed(() => {
    const cats = new Set<string>();
    for (const job of jobs.value) {
      const cat = job.category ?? job.industry ?? 'General';
      cats.add(cat);
    }
    return ['All', ...Array.from(cats).sort()];
  });

  async function load(): Promise<JobWithEmployer[]> {
    loading.value = true;
    error.value = null;
    try {
      const list = await listJobs();
      jobs.value = list;
      return list;
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
      jobs.value = [];
      return [];
    } finally {
      loading.value = false;
    }
  }

  return {
    jobs,
    allJobs,
    categories,
    loading,
    error,
    load,
  };
});
