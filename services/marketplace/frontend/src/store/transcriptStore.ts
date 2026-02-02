import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import axios from 'axios';
import type { JobWithEmployer } from '@/types/demo';
import type { DemoCredential } from '@/types/credentials';
import embeddedDemo from '@/data/embeddedDemo.json';

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

  function getCredentialsFromEmbedded(): DemoCredential[] {
    const config = embeddedDemo as { personas?: Array<{ type: string; credentials?: Array<Record<string, unknown>> }> };
    const student = (config.personas || []).find((p) => p.type === 'Student');
    const raw = (student?.credentials || []).filter(
      (c) => c.type && String(c.type).toLowerCase().includes('transcript')
    );
    return raw.map((c) => ({
      id: String(c.id),
      type: String(c.type),
      name: String(c.name),
      establishmentName: c.establishmentName as string | undefined,
      backgroundImage: c.image as string | undefined,
      logo: c.logo as string | undefined,
      credentialSubject: c.credentialSubject as DemoCredential['credentialSubject'],
    }));
  }

  async function fetchPresentationCredentials() {
    fetchingCredentials.value = true;
    error.value = null;
    try {
      const res = await axios.get<{ credentials: DemoCredential[] }>('/api/presentation-request/credentials');
      availableCredentials.value = res.data.credentials ?? [];
      return availableCredentials.value;
    } catch {
      // Fallback: use embedded demo when API returns 500 (static deployment, no backend)
      availableCredentials.value = getCredentialsFromEmbedded();
      return availableCredentials.value;
    } finally {
      fetchingCredentials.value = false;
    }
  }

  function getRecommendationsFromEmbedded(): JobWithEmployer[] {
    const config = embeddedDemo as {
      personas?: Array<{
        id: string;
        type: string;
        name: string;
        image?: string;
        logo?: string;
        jobPostings?: Array<Record<string, unknown>>;
      }>;
    };
    const allJobs: JobWithEmployer[] = [];
    for (const persona of config.personas || []) {
      if (persona.type === 'Employer' && persona.jobPostings) {
        for (const job of persona.jobPostings) {
          allJobs.push({
            ...job,
            employerId: persona.id,
            employerName: persona.name,
            employerImage: persona.image,
            employerLogo: persona.logo,
          } as JobWithEmployer);
        }
      }
    }
    const featured = allJobs.filter((j) => (j as { featured?: boolean }).featured);
    return featured.length > 0 ? featured : allJobs.slice(0, 8);
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
    } catch {
      // Fallback: use embedded demo when API returns 500 (static deployment)
      customRecommendations.value = getRecommendationsFromEmbedded();
      transcriptShared.value = true;
      availableCredentials.value = [];
      return customRecommendations.value;
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
