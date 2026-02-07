<template>
  <div class="employer-jobs-page">
    <router-link to="/tenant" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back
    </router-link>

    <div v-if="!employerStore.isEmployer" class="no-employer">
      <p>Please select an employer from the Marketplace Tenants Hub first.</p>
      <router-link to="/tenant" class="action-btn primary">Go to Marketplace Tenants Hub</router-link>
    </div>

    <div v-else>
      <div class="page-header">
        <div>
          <h1>My Job Postings</h1>
          <p class="employer-name">{{ currentEmployer?.name }}</p>
        </div>
        <router-link to="/tenant/jobs/create" class="create-btn">
          <i class="pi pi-plus"></i>
          Create job
        </router-link>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        Loading...
      </div>

      <div v-else class="job-list">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="marketplace-card job-item"
          @click="goToJob(job.id)"
        >
          <div class="job-item-content">
            <h3>{{ jobTitle(job) }}</h3>
            <p>{{ jobDescription(job) }}</p>
            <div class="job-item-footer">
              <router-link
                :to="{ name: 'JobApplicants', params: { jobId: job.id } }"
                class="applicants-link"
                @click.stop
              >
                <i class="pi pi-users"></i>
                {{ applicantCount(job.id) }} applicant(s)
              </router-link>
              <i class="pi pi-chevron-right"></i>
            </div>
          </div>
        </div>

        <StatusMessage v-if="jobs.length === 0" type="empty" message="No job postings yet." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import StatusMessage from '@/components/StatusMessage.vue';
import { useDemoStore } from '@/store/demoStore';
import { useEmployerStore } from '@/store/employerStore';
import { useApplicantStore } from '@/store/applicantStore';
import { listJobPostings, type JobPosting } from '@/api/employerJobs';
import { useEmployerJobStore } from '@/store/employerJobStore';

const router = useRouter();
const demoStore = useDemoStore();
const employerStore = useEmployerStore();
const applicantStore = useApplicantStore();
const employerJobStore = useEmployerJobStore();

const apiJobs = ref<JobPosting[]>([]);
const loading = ref(false);

const currentEmployer = computed(() => {
  if (!employerStore.currentEmployerId) return null;
  return demoStore.getEmployerById(employerStore.currentEmployerId);
});

const demoJobs = computed(() => {
  if (!employerStore.currentEmployerId) return [];
  return demoStore.getJobsByEmployer(employerStore.currentEmployerId);
});

// Merge API jobs (created by employer) with demo jobs (from config). API jobs first.
const jobs = computed(() => {
  const api = apiJobs.value.map((j) => ({ ...j, _source: 'api' as const }));
  const demo = demoJobs.value.map((j) => ({ ...j, _source: 'demo' as const }));
  return [...api, ...demo];
});

function jobTitle(job: { title?: string; name?: string }) {
  return job.title ?? job.name ?? 'Untitled';
}

function jobDescription(job: { description?: string }) {
  return job.description ?? '';
}

async function loadApiJobs() {
  if (!employerStore.currentEmployerId) return;
  loading.value = true;
  try {
    const list = await listJobPostings(employerStore.currentEmployerId);
    apiJobs.value = list;
    employerJobStore.setJobs(list);
  } catch {
    apiJobs.value = [];
    employerJobStore.setJobs([]);
  } finally {
    loading.value = false;
  }
}

watch(
  () => employerStore.currentEmployerId,
  (id) => {
    if (id) loadApiJobs();
    else apiJobs.value = [];
  },
  { immediate: true }
);

function applicantCount(jobId: string) {
  return applicantStore.getApplicantsForJob(jobId).length;
}

function goToJob(jobId: string) {
  router.push({ name: 'JobDetail', params: { jobId } });
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;
@use '@/assets/employer-common.scss';

.employer-jobs-page {
  padding: 16px;
  padding-bottom: 24px;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: $marketplace-primary;
  color: $marketplace-text-on-primary;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: $marketplace-text-muted;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 4px 0;
}

.employer-name {
  font-size: 0.95rem;
  color: $marketplace-text-muted;
  margin: 0 0 20px 0;
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.job-item {
  padding: 16px;
  cursor: pointer;

  .job-item-content h3 {
    font-size: 1.1rem;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  .job-item-content p {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: 0 0 12px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .job-item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .applicants-link {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: $marketplace-accent-alt;
      font-weight: 500;
    }

    i {
      color: $marketplace-text-muted;
    }
  }
}
</style>
