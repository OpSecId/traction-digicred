<template>
  <div class="job-view-page">
    <StatusMessage v-if="!job" type="loading" message="Loading..." />
    <div v-else class="job-detail">
      <!-- Employer Profile Section -->
      <div class="employer-profile-card">
        <div class="employer-profile-header" :style="employerHeaderStyle(job)">
          <div class="employer-header-overlay"></div>
          <div class="employer-profile-content">
            <div class="employer-logo-container">
              <img v-if="job.employerLogo" :src="job.employerLogo" :alt="job.employerName" class="employer-logo-large" />
              <div v-else class="employer-initials-large" :style="avatarStyle(job.employerName)">{{ employerInitials(job.employerName) }}</div>
            </div>
            <h2 class="employer-profile-name">{{ job.employerName }}</h2>
            <span class="employer-profile-category">{{ job.category }}</span>
          </div>
        </div>
      </div>

      <!-- Job Details Section -->
      <div class="job-details-section">
        <h1 class="job-title">{{ job.name }}</h1>
        
        <!-- Job Meta Info Pills -->
        <div class="job-meta-pills">
          <div v-if="job.location" class="meta-pill">
            <i class="pi pi-map-marker"></i>
            <span>{{ job.location }}</span>
          </div>
          <div v-if="job.employmentType" class="meta-pill">
            <i class="pi pi-briefcase"></i>
            <span>{{ job.employmentType }}</span>
          </div>
          <div v-if="job.salary" class="meta-pill salary-pill">
            <i class="pi pi-dollar"></i>
            <span>{{ job.salary }}</span>
          </div>
        </div>

        <!-- About Section -->
        <div class="job-section">
          <div class="section-header">
            <i class="pi pi-info-circle"></i>
            <h3>About this opportunity</h3>
          </div>
          <p class="section-content">{{ job.description }}</p>
        </div>

        <!-- Requirements Section -->
        <div v-if="job.requirements && job.requirements.length > 0" class="job-section">
          <div class="section-header">
            <i class="pi pi-check-circle"></i>
            <h3>Requirements</h3>
          </div>
          <ul class="requirements-list">
            <li v-for="(req, i) in job.requirements" :key="i">
              <i class="pi pi-check"></i>
              <span>{{ req }}</span>
            </li>
          </ul>
        </div>

        <!-- Benefits Section -->
        <div v-if="job.benefits && job.benefits.length > 0" class="job-section">
          <div class="section-header">
            <i class="pi pi-gift"></i>
            <h3>Benefits & Perks</h3>
          </div>
          <div class="benefits-grid">
            <div v-for="(benefit, i) in job.benefits" :key="i" class="benefit-card">
              <i class="pi pi-check-circle"></i>
              <span>{{ benefit }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed bottom action buttons -->
      <div class="fixed-bottom-actions">
        <button class="apply-btn" @click="showApplyModal = true">
          <i class="pi pi-send"></i>
          Join {{ job.employerName }}'s channel
        </button>
        <button class="back-btn-secondary" @click="router.back()">
          <i class="pi pi-arrow-left"></i>
          Back
        </button>
      </div>
    </div>

    <!-- Apply Modal -->
    <div v-if="showApplyModal" class="modal-overlay" @click.self="showApplyModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Join {{ job?.employerName }}'s channel</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="showApplyModal = false">
            <i class="pi pi-times"></i>
          </button>
        </div>
        
        <div class="modal-explanation">
          <div class="explanation-icon">
            <i class="pi pi-shield"></i>
          </div>
          <p class="explanation-text">
            This will connect you <strong>anonymously</strong> with {{ job?.employerName }}. You'll be able to interact directly with the employer while maintaining your privacy.
          </p>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="showApplyModal = false">
            Cancel
          </button>
          <button type="button" class="btn-primary" @click="submitApplication">
            Join channel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useJobsStore } from '@/store/jobsStore';
import { useApplicantStore } from '@/store/applicantStore';
import { getJobPosting, getEmployerProfile } from '@/api/employerJobs';
import { employerInitials, avatarStyle, employerHeaderStyle } from '@/utils/employerUtils';
import StatusMessage from '@/components/StatusMessage.vue';
import type { JobWithEmployer } from '@/api/jobs';

const route = useRoute();
const router = useRouter();
const jobsStore = useJobsStore();
const applicantStore = useApplicantStore();
const fetchedJob = ref<JobWithEmployer | null>(null);

const job = computed<JobWithEmployer | undefined>(() => {
  const jobId = route.params.jobId as string;
  const fromStore = jobsStore.allJobs.find((j) => j.id === jobId);
  if (fromStore) return fromStore;
  if (fetchedJob.value?.id === jobId) return fetchedJob.value;
  return undefined;
});

watch(
  () => route.params.jobId,
  async (param) => {
    const jobId = Array.isArray(param) ? param[0] : param;
    if (!jobId) return;
    if (jobsStore.allJobs.some((j) => j.id === jobId)) return;
    if (fetchedJob.value?.id === jobId) return;
    const j = await getJobPosting(jobId);
    if (j) {
      const profile = j.employerId ? await getEmployerProfile(j.employerId) : null;
      const cred = profile?.credential as { credentialSubject?: { name?: string; image?: string } } | undefined;
      const subj = cred?.credentialSubject ?? {};
      fetchedJob.value = {
        ...j,
        name: j.title,
        employerName: subj.name ?? 'Employer',
        employerLogo: subj.image,
        category: j.industry ?? 'General',
      };
    } else fetchedJob.value = null;
  },
  { immediate: true }
);

const showApplyModal = ref(false);

function submitApplication() {
  if (!job.value) return;
  // Add applicant anonymously (no personal info needed)
  applicantStore.addApplicant(job.value.id, 'Anonymous User', 'anonymous@example.com');
  showApplyModal.value = false;
  router.push({ name: 'Discovery' });
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.job-view-page {
  padding: 0;
  padding-bottom: 24px;
}

.job-detail {
  padding-top: 0;
}

/* Employer Profile Card */
.employer-profile-card {
  margin: 0 -16px 24px -16px;
  overflow: hidden;
}

.employer-profile-header {
  position: relative;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.employer-header-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
  z-index: 1;
}

.employer-profile-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.employer-logo-container {
  margin-bottom: 12px;
}

.employer-logo-large {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.employer-initials-large {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.employer-profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.employer-profile-category {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Job Details Section */
.job-details-section {
  padding: 0 16px 140px 16px; /* Extra bottom padding for fixed buttons */
}

.job-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: $channel-primary;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

/* Job Meta Pills */
.job-meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba($channel-primary, 0.06);
  border-radius: 20px;
  font-size: 0.85rem;
  color: $marketplace-text;
  font-weight: 500;

  i {
    font-size: 0.9rem;
    color: $channel-primary;
  }
}

.salary-pill {
  background: linear-gradient(135deg, rgba($channel-primary, 0.1), rgba($channel-secondary, 0.1));
  font-weight: 600;
  color: $channel-primary;
}

/* Job Sections */
.job-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;

  i {
    font-size: 1.1rem;
    color: $channel-primary;
  }

  h3 {
    font-size: 1.05rem;
    font-weight: 700;
    color: $channel-primary;
    margin: 0;
  }
}

.section-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: $marketplace-text;
  margin: 0;
}

/* Requirements List */
.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 0.95rem;
    line-height: 1.5;
    color: $marketplace-text;

    i {
      flex-shrink: 0;
      margin-top: 3px;
      font-size: 0.9rem;
      color: $channel-primary;
    }
  }
}

/* Benefits Grid */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.benefit-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(135deg, rgba($channel-primary, 0.05), rgba($channel-accent, 0.06));
  border-radius: 12px;
  border: 1px solid rgba($channel-primary, 0.1);
  font-size: 0.9rem;
  line-height: 1.4;
  color: $marketplace-text;

  i {
    flex-shrink: 0;
    font-size: 1rem;
    color: $channel-primary;
  }
}

/* Fixed bottom action buttons */
.fixed-bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $marketplace-bg-card;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.apply-btn {
  width: 100%;
  padding: 16px;
  background: $channel-primary;
  color: $channel-text-on-primary;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;

  &:active {
    opacity: 0.9;
  }
}

.back-btn-secondary {
  width: 100%;
  padding: 14px;
  background: $marketplace-bg;
  color: $marketplace-text;
  border: 1px solid $marketplace-panel-border;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;

  &:active {
    background: $marketplace-panel-border;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: $channel-primary;
    flex: 1;
  }
}

.modal-explanation {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba($channel-primary, 0.05);
  border-radius: 12px;
  border-left: 3px solid $channel-primary;
  margin-bottom: 20px;

  .explanation-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $channel-primary;
    color: white;
    border-radius: 8px;
    font-size: 1rem;
  }

  .explanation-text {
    flex: 1;
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: $marketplace-text;

    strong {
      color: $channel-primary;
      font-weight: 600;
    }
  }
}

.modal-close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: $marketplace-bg;
  border-radius: 8px;
  color: $marketplace-text-muted;
  cursor: pointer;

  &:hover, &:active {
    background: $marketplace-panel-border;
    color: $marketplace-text;
  }
}

.form-field {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 6px;
    color: $marketplace-text;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid $marketplace-panel-border;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .btn-secondary {
    background: $marketplace-bg;
    color: $marketplace-text;
  }

  .btn-primary {
    background: $channel-primary;
    color: $channel-text-on-primary;
  }
}
</style>
