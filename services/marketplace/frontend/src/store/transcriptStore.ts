import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import axios from 'axios';
import type { JobWithEmployer } from '@/types/demo';
import type { DemoCredential } from '@/types/credentials';

const STORAGE_KEY = 'marketplace-transcript-shared';
const RECOMMENDATIONS_KEY = 'marketplace-recommendations';

function loadFromStorage() {
  try {
    const shared = localStorage.getItem(STORAGE_KEY) === 'true';
    const stored = localStorage.getItem(RECOMMENDATIONS_KEY);
    const jobs = stored ? (JSON.parse(stored) as JobWithEmployer[]) : [];
    return { shared, jobs };
  } catch {
    return { shared: false, jobs: [] };
  }
}

export const useTranscriptStore = defineStore('transcript', () => {
  const { shared, jobs } = loadFromStorage();
  const transcriptShared = ref(shared);
  const customRecommendations = ref<JobWithEmployer[]>(jobs);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const fetchingCredentials = ref(false);
  const availableCredentials = ref<DemoCredential[]>([]);

  watch(
    [transcriptShared, customRecommendations],
    ([shared, recs]) => {
      localStorage.setItem(STORAGE_KEY, String(shared));
      localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(recs));
    },
    { deep: true }
  );

  async function fetchPresentationCredentials() {
    fetchingCredentials.value = true;
    error.value = null;
    try {
      const res = await axios.get<{ credentials: DemoCredential[] }>('/api/presentation-request/credentials');
      availableCredentials.value = res.data.credentials ?? [];
      return availableCredentials.value;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      fetchingCredentials.value = false;
    }
  }

  async function shareTranscript(selectedCredentialIds: string[]) {
    loading.value = true;
    error.value = null;
    try {
      const res = await axios.post<{ jobs: JobWithEmployer[] }>('/api/recommendations', {
        presentation: { selectedCredentialIds },
      });
      customRecommendations.value = res.data.jobs ?? [];
      transcriptShared.value = true;
      availableCredentials.value = [];
      return customRecommendations.value;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function resetTranscript() {
    transcriptShared.value = false;
    customRecommendations.value = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RECOMMENDATIONS_KEY);
  }

  return {
    transcriptShared,
    customRecommendations,
    loading,
    error,
    fetchingCredentials,
    availableCredentials,
    fetchPresentationCredentials,
    shareTranscript,
    resetTranscript,
  };
});
