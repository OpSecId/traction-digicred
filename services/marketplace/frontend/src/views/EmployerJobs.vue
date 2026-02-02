<template>
  <div class="employer-jobs-page">
    <router-link to="/employer" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back
    </router-link>

    <div v-if="!employerStore.isEmployer" class="no-employer">
      <p>Please select an employer from the Employer Hub first.</p>
      <router-link to="/employer" class="action-btn">Go to Employer Hub</router-link>
    </div>

    <div v-else>
      <h1>My Job Postings</h1>
      <p class="employer-name">{{ currentEmployer?.name }}</p>

      <div class="job-list">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="marketplace-card job-item"
          @click="goToJob(job.id)"
        >
          <div class="job-item-content">
            <h3>{{ job.name }}</h3>
            <p>{{ job.description }}</p>
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

        <div v-if="jobs.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No job postings yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDemoStore } from '@/store/demoStore';
import { useEmployerStore } from '@/store/employerStore';
import { useApplicantStore } from '@/store/applicantStore';

const router = useRouter();
const demoStore = useDemoStore();
const employerStore = useEmployerStore();
const applicantStore = useApplicantStore();

const currentEmployer = computed(() => {
  if (!employerStore.currentEmployerId) return null;
  return demoStore.getEmployerById(employerStore.currentEmployerId);
});

const jobs = computed(() => {
  if (!employerStore.currentEmployerId) return [];
  return demoStore.getJobsByEmployer(employerStore.currentEmployerId);
});

function applicantCount(jobId: string) {
  return applicantStore.getApplicantsForJob(jobId).length;
}

function goToJob(jobId: string) {
  router.push({ name: 'JobDetail', params: { jobId } });
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.employer-jobs-page {
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

.no-employer {
  text-align: center;
  padding: 2rem;

  p {
    margin-bottom: 16px;
    color: $marketplace-text-muted;
  }
}

.action-btn {
  display: inline-block;
  padding: 12px 24px;
  background: $marketplace-primary;
  color: $marketplace-text-on-primary;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  color: $marketplace-text-muted;

  i {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }
}
</style>
