import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import axios from 'axios';
import type { JobWithEmployer } from '@/api/jobs';
import type { DemoCredential, TranscriptCourse } from '@/types/credentials';

const STORAGE_KEY = 'marketplace-transcript-shared';
const RECOMMENDATIONS_KEY = 'marketplace-recommendations';
const SHARED_CREDENTIAL_KEY = 'marketplace-shared-credential';

export interface SharedCredentialInfo {
  establishmentName?: string;
  name: string;
  type: string;
  /** Program or degree (no PII) */
  program?: string;
  /** GPA (e.g. "3.7") */
  gpa?: string;
  /** Graduation date */
  graduationDate?: string;
  /** Courses taken (no PII) */
  courses?: TranscriptCourse[];
}

function loadFromStorage() {
  try {
    const shared = localStorage.getItem(STORAGE_KEY) === 'true';
    const stored = localStorage.getItem(RECOMMENDATIONS_KEY);
    const jobs = stored ? (JSON.parse(stored) as JobWithEmployer[]) : [];
    const credStored = localStorage.getItem(SHARED_CREDENTIAL_KEY);
    const credential = credStored ? (JSON.parse(credStored) as SharedCredentialInfo) : null;
    return { shared, jobs, credential };
  } catch {
    return { shared: false, jobs: [], credential: null };
  }
}

export const useTranscriptStore = defineStore('transcript', () => {
  const { shared, jobs, credential } = loadFromStorage();
  const transcriptShared = ref(shared);
  const customRecommendations = ref<JobWithEmployer[]>(jobs);
  const sharedCredentialInfo = ref<SharedCredentialInfo | null>(credential);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const fetchingCredentials = ref(false);
  const availableCredentials = ref<DemoCredential[]>([]);

  watch(
    [transcriptShared, customRecommendations, sharedCredentialInfo],
    ([shared, recs, cred]) => {
      localStorage.setItem(STORAGE_KEY, String(shared));
      localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(recs));
      localStorage.setItem(SHARED_CREDENTIAL_KEY, cred ? JSON.stringify(cred) : '');
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
    } catch {
      availableCredentials.value = [];
      return availableCredentials.value;
    } finally {
      fetchingCredentials.value = false;
    }
  }

  async function shareTranscript(selectedCredentialIds: string[], credentialInfo?: SharedCredentialInfo) {
    loading.value = true;
    error.value = null;
    try {
      const res = await axios.post<{ jobs: JobWithEmployer[] }>('/api/recommendations', {
        presentation: { selectedCredentialIds },
      });
      customRecommendations.value = res.data.jobs ?? [];
      sharedCredentialInfo.value = credentialInfo ?? null;
      transcriptShared.value = true;
      availableCredentials.value = [];
      return customRecommendations.value;
    } catch {
      customRecommendations.value = [];
      sharedCredentialInfo.value = credentialInfo ?? null;
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
    sharedCredentialInfo.value = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RECOMMENDATIONS_KEY);
    localStorage.removeItem(SHARED_CREDENTIAL_KEY);
  }

  return {
    transcriptShared,
    customRecommendations,
    sharedCredentialInfo,
    loading,
    error,
    fetchingCredentials,
    availableCredentials,
    fetchPresentationCredentials,
    shareTranscript,
    resetTranscript,
  };
});
