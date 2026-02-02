<template>
  <div class="job-detail-page">
    <router-link to="/employer/jobs" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back to Jobs
    </router-link>

    <div v-if="job" class="job-detail-content">
      <h1>{{ job.name }}</h1>
      <span class="employer-name">{{ job.employerName }}</span>

      <div class="marketplace-card detail-card">
        <h3>Description</h3>
        <p>{{ job.description }}</p>
        <div v-if="job.requirements?.length" class="requirements">
          <h3>Requirements</h3>
          <ul>
            <li v-for="(r, i) in job.requirements" :key="i">{{ r }}</li>
          </ul>
        </div>
      </div>

      <router-link
        :to="{ name: 'JobApplicants', params: { jobId: job.id } }"
        class="action-btn"
      >
        <i class="pi pi-users"></i>
        View Applicants ({{ applicantCount }})
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useDemoStore } from '@/store/demoStore';
import { useApplicantStore } from '@/store/applicantStore';
import type { JobWithEmployer } from '@/types/demo';

const route = useRoute();
const demoStore = useDemoStore();
const applicantStore = useApplicantStore();

const job = computed<JobWithEmployer | undefined>(() => {
  const jobId = route.params.jobId as string;
  return demoStore.allJobs.find((j) => j.id === jobId);
});

const applicantCount = computed(() => {
  if (!job.value) return 0;
  return applicantStore.getApplicantsForJob(job.value.id).length;
});
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.job-detail-page {
  padding: 16px;
  padding-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: $marketplace-accent-alt;
  font-weight: 500;
  margin-bottom: 20px;
  text-decoration: none;
}

.job-detail-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 4px 0;
}

.employer-name {
  font-size: 0.95rem;
  color: $marketplace-text-muted;
  display: block;
  margin-bottom: 20px;
}

.detail-card {
  padding: 20px;
  margin-bottom: 20px;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  p, ul {
    font-size: 0.95rem;
    line-height: 1.5;
    color: $marketplace-text;
    margin: 0 0 16px 0;
  }

  ul {
    padding-left: 20px;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background: $marketplace-primary;
  color: $marketplace-text-on-primary;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
}
</style>
