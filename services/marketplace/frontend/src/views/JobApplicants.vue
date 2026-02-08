<template>
  <div class="applicants-page">
    <router-link to="/tenant/jobs" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back to Job Postings
    </router-link>

    <div v-if="job" class="applicants-content">
      <h1>Applicants</h1>
      <p class="job-title">{{ job.name }}</p>

      <div class="applicant-list">
        <div
          v-for="applicant in applicants"
          :key="applicant.id"
          class="marketplace-card applicant-card"
        >
          <div class="applicant-header">
            <div class="applicant-info">
              <h3>{{ applicant.name }}</h3>
              <span class="email">{{ applicant.email }}</span>
            </div>
            <span class="status-badge" :class="applicant.status">
              {{ applicant.status }}
            </span>
          </div>
          <p class="applied-at">Applied {{ formatDate(applicant.appliedAt) }}</p>
          <div class="applicant-actions">
            <button
              v-if="applicant.status === 'pending'"
              class="btn-sm accept"
              @click="updateStatus(applicant.id, 'accepted')"
            >
              Accept
            </button>
            <button
              v-if="applicant.status === 'pending'"
              class="btn-sm reject"
              @click="updateStatus(applicant.id, 'rejected')"
            >
              Reject
            </button>
          </div>
        </div>

        <StatusMessage v-if="applicants.length === 0" type="empty" message="No applicants yet." icon="pi-users" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import StatusMessage from '@/components/StatusMessage.vue';
import { useEmployerJobStore } from '@/store/employerJobStore';
import { useApplicantStore } from '@/store/applicantStore';

const route = useRoute();
const employerJobStore = useEmployerJobStore();
const applicantStore = useApplicantStore();

const jobId = route.params.jobId as string;

const job = computed(() => {
  const apiJob = employerJobStore.getJobById(jobId);
  if (apiJob) return { id: apiJob.id, name: apiJob.title };
  return null;
});

watch(
  () => route.params.jobId,
  async (param) => {
    const id = Array.isArray(param) ? param[0] : param;
    if (!id) return;
    await employerJobStore.getOrFetchJob(id);
  },
  { immediate: true }
);

const applicants = computed(() => {
  return applicantStore.getApplicantsForJob(jobId);
});

function updateStatus(id: string, status: 'accepted' | 'rejected') {
  applicantStore.updateApplicantStatus(id, status);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.applicants-page {
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

.applicants-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 4px 0;
}

.job-title {
  font-size: 0.95rem;
  color: $marketplace-text-muted;
  margin: 0 0 20px 0;
}

.applicant-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.applicant-card {
  padding: 16px;

  .applicant-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .applicant-info h3 {
    font-size: 1rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0 0 4px 0;
  }

  .email {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
  }

  .status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    text-transform: capitalize;

    &.pending {
      background: #FFD8B2;
      color: #87623D;
    }

    &.accepted {
      background: #C8E6C9;
      color: #336C37;
    }

    &.rejected {
      background: #FFCDD2;
      color: #C94040;
    }
  }

  .applied-at {
    font-size: 0.85rem;
    color: $marketplace-text-muted;
    margin: 0 0 12px 0;
  }

  .applicant-actions {
    display: flex;
    gap: 8px;
  }
}

.btn-sm {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  cursor: pointer;

  &.accept {
    background: $marketplace-success;
    color: white;
  }

  &.reject {
    background: $marketplace-danger;
    color: white;
  }
}
</style>
