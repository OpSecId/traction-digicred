<template>
  <div class="employer-jobs-page">
    <router-link to="/tenant" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back
    </router-link>

    <div v-if="!employerStore.isEmployer" class="no-employer">
      <p>Please select an employer from the Marketplace Hub first.</p>
      <router-link to="/tenant" class="action-btn primary">Go to Marketplace Hub</router-link>
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
          :class="{ revoked: job.status === 'revoked' }"
          @click="openJobModal(job)"
        >
          <div class="job-item-content">
            <div class="job-item-header">
              <h3>{{ jobTitle(job) }}</h3>
              <span v-if="job.status === 'revoked'" class="status-badge revoked">Revoked</span>
              <span v-else-if="job.visibility === false" class="status-badge hidden">Hidden</span>
            </div>
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

    <!-- Job detail modal -->
    <DetailModalCard
      v-if="selectedJob"
      :title="jobDisplayTitle"
      :credential="jobCredential"
      credential-title="JobPostingCredential"
      @close="selectedJob = null"
    >
      <template #details>
        <div class="detail-pane">
          <div class="detail-hero">
            <div class="hero-main">
              <span class="hero-name">{{ jobDisplayTitle }}</span>
              <span v-if="jobDisplayIndustry" class="type-badge employer">{{ jobDisplayIndustry }}</span>
            </div>
            <span v-if="selectedJob.status === 'revoked'" class="status-badge revoked">Revoked</span>
            <span v-else-if="selectedJob.visibility === false" class="status-badge hidden">Hidden</span>
          </div>

          <div class="detail-strip">
            <span v-if="jobDisplayEmploymentType" class="strip-item"><i class="pi pi-briefcase"></i> {{ employmentTypeLabel(jobDisplayEmploymentType) }}</span>
            <span v-if="selectedJob.locationType" class="strip-item"><i class="pi pi-map-marker"></i> {{ locationTypeLabel(selectedJob.locationType) }}</span>
            <span v-if="locationText" class="strip-item"><i class="pi pi-building"></i> {{ locationText }}</span>
            <span v-if="salaryText" class="strip-item"><i class="pi pi-dollar"></i> {{ salaryText }}</span>
            <span v-if="jobDisplayDatePosted" class="strip-item"><i class="pi pi-calendar"></i> Posted {{ formatDate(jobDisplayDatePosted) }}</span>
            <span v-if="jobDisplayValidThrough" class="strip-item"><i class="pi pi-clock"></i> Valid through {{ formatDate(jobDisplayValidThrough) }}</span>
          </div>

          <div class="detail-sections">
            <section v-if="credentialSubject?.hiringOrganization" class="detail-card">
              <h4><i class="pi pi-building"></i> Organization</h4>
              <dl class="detail-list">
                <dt>Name</dt>
                <dd>{{ (credentialSubject.hiringOrganization as { name?: string })?.name ?? '—' }}</dd>
                <dt>ID</dt>
                <dd><code>{{ (credentialSubject.hiringOrganization as { id?: string })?.id ?? '—' }}</code></dd>
              </dl>
            </section>
            <section class="detail-card">
              <h4><i class="pi pi-align-left"></i> Description</h4>
              <p class="detail-description">{{ jobDisplayDescription }}</p>
            </section>
            <section v-if="jobDisplayQualifications?.length" class="detail-card">
              <h4><i class="pi pi-check-circle"></i> Requirements</h4>
              <ul class="detail-list-ul">
                <li v-for="(q, i) in jobDisplayQualifications" :key="i">{{ q }}</li>
              </ul>
            </section>
            <section v-if="jobDisplaySkills?.length" class="detail-card">
              <h4><i class="pi pi-list"></i> Skills</h4>
              <p class="detail-meta">{{ jobDisplaySkills.join(', ') }}</p>
            </section>
            <section v-if="jobDisplayBenefits" class="detail-card">
              <h4><i class="pi pi-gift"></i> Benefits</h4>
              <p class="detail-meta">{{ jobDisplayBenefits }}</p>
            </section>
          </div>
        </div>
      </template>
      <template #actions>
        <div class="modal-actions-row">
          <div class="actions-left">
            <div
              class="visibility-toggle"
              :class="{ disabled: selectedJob.status === 'revoked' || visibilityUpdating }"
              @click="selectedJob.status !== 'revoked' && !visibilityUpdating && toggleVisibility()"
            >
              <span class="toggle-label">Visible on marketplace</span>
              <span class="toggle-switch" :class="{ on: selectedJob.visibility !== false }"></span>
            </div>
          </div>
          <div class="actions-right">
            <router-link v-if="selectedJob.status !== 'revoked'" :to="{ name: 'JobApplicants', params: { jobId: selectedJob.id } }" class="action-btn primary" @click="selectedJob = null">
              <i class="pi pi-users"></i>
              View {{ applicantCount(selectedJob.id) }} applicant(s)
            </router-link>
            <button
              v-if="selectedJob.status !== 'revoked'"
              type="button"
              class="action-btn danger-outline"
              :disabled="revoking"
              @click="confirmRevoke"
            >
              <i :class="revoking ? 'pi pi-spin pi-spinner' : 'pi pi-ban'"></i>
              {{ revoking ? 'Revoking...' : 'Revoke' }}
            </button>
            <button
              v-else
              type="button"
              class="action-btn secondary"
              :disabled="revoking"
              @click="reopenJob"
            >
              <i :class="revoking ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
              {{ revoking ? 'Reopening...' : 'Reopen' }}
            </button>
          </div>
        </div>
      </template>
    </DetailModalCard>

    <!-- Revoke confirmation -->
    <div v-if="revokeConfirm" class="modal-overlay" @click.self="revokeConfirm = null">
      <div class="modal-content revoke-modal">
        <div class="revoke-icon"><i class="pi pi-ban"></i></div>
        <h3>Revoke job posting</h3>
        <p>This will mark the job as cancelled/completed. It will no longer appear on the marketplace. Applicants can still see their application history.</p>
        <p v-if="revokeError" class="revoke-error">{{ revokeError }}</p>
        <div class="revoke-actions">
          <button type="button" class="revoke-cancel" @click="revokeConfirm = null; revokeError = ''">Cancel</button>
          <button type="button" class="revoke-confirm" :disabled="revoking" @click="doRevoke">
            <i v-if="revoking" class="pi pi-spin pi-spinner"></i>
            {{ revoking ? 'Revoking...' : 'Revoke' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import StatusMessage from '@/components/StatusMessage.vue';
import DetailModalCard from '@/components/DetailModalCard.vue';
import { useEmployerStore } from '@/store/employerStore';
import { useApplicantStore } from '@/store/applicantStore';
import {
  listJobPostings,
  updateJobVisibility,
  revokeJobPosting,
  reopenJobPosting,
  type JobPosting,
} from '@/api/employerJobs';
import { useEmployerJobStore } from '@/store/employerJobStore';

const employerStore = useEmployerStore();
const applicantStore = useApplicantStore();
const employerJobStore = useEmployerJobStore();

const apiJobs = ref<JobPosting[]>([]);
const loading = ref(false);
const selectedJob = ref<JobPosting | null>(null);
const visibilityUpdating = ref(false);
const revoking = ref(false);
const revokeConfirm = ref<JobPosting | null>(null);
const revokeError = ref('');

const jobs = computed(() => apiJobs.value);

const jobCredential = computed(() => {
  const j = selectedJob.value;
  if (!j?.credential) return null;
  return j.credential as Record<string, unknown>;
});

const credentialSubject = computed(() => {
  const cred = jobCredential.value;
  if (!cred) return null;
  return (cred.credentialSubject as Record<string, unknown>) ?? null;
});

const jobDisplayTitle = computed(() => {
  const subj = credentialSubject.value;
  const j = selectedJob.value;
  return (subj?.title as string) ?? j?.title ?? 'Job Posting';
});

const jobDisplayIndustry = computed(() => {
  const subj = credentialSubject.value;
  const j = selectedJob.value;
  return (subj?.industry as string) ?? j?.industry ?? '';
});

const jobDisplayEmploymentType = computed(() => {
  const subj = credentialSubject.value;
  const j = selectedJob.value;
  return (subj?.employmentType as string) ?? j?.employmentType ?? '';
});

const jobDisplayDatePosted = computed(() => {
  const subj = credentialSubject.value;
  const j = selectedJob.value;
  return (subj?.datePosted as string) ?? j?.datePosted ?? '';
});

const jobDisplayValidThrough = computed(() => {
  const subj = credentialSubject.value;
  const j = selectedJob.value;
  return (subj?.validThrough as string) ?? j?.validThrough ?? '';
});

const jobDisplayDescription = computed(() => {
  const subj = credentialSubject.value;
  const j = selectedJob.value;
  return (subj?.description as string) ?? j?.description ?? '—';
});

const jobDisplayQualifications = computed(() => {
  const j = selectedJob.value;
  const q = j?.qualifications;
  if (Array.isArray(q) && q.length) return q;
  return [];
});

const jobDisplaySkills = computed(() => {
  const j = selectedJob.value;
  const s = j?.skills;
  if (Array.isArray(s) && s.length) return s;
  return [];
});

const jobDisplayBenefits = computed(() => {
  const j = selectedJob.value;
  return j?.benefits ?? '';
});

function jobTitle(job: { title?: string; name?: string }): string {
  return job.title ?? job.name ?? 'Untitled';
}

function jobDescription(job: { description?: string }) {
  return job.description ?? '';
}

function employmentTypeLabel(v: string) {
  const map: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    TEMPORARY: 'Temporary',
    INTERNSHIP: 'Internship',
    VOLUNTEER: 'Volunteer',
  };
  return map[v] ?? v;
}

function locationTypeLabel(v: string) {
  const map: Record<string, string> = {
    OFFICE: 'On-site',
    TELECOMMUTE: 'Remote',
    HYBRID: 'Hybrid',
  };
  return map[v] ?? v;
}

const locationText = computed(() => {
  const j = selectedJob.value;
  if (!j) return '';
  return [j.locationCity, j.locationRegion, j.locationCountry].filter(Boolean).join(', ');
});

const salaryText = computed(() => {
  const j = selectedJob.value;
  if (!j) return '';
  if (j.salaryDisplay) return j.salaryDisplay;
  if (j.salaryMin != null || j.salaryMax != null) {
    return `$${j.salaryMin ?? '—'} – $${j.salaryMax ?? '—'}`;
  }
  return '';
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

function openJobModal(job: JobPosting) {
  selectedJob.value = job;
  revokeConfirm.value = null;
  revokeError.value = '';
}

async function toggleVisibility() {
  const job = selectedJob.value;
  const employerId = employerStore.currentEmployerId;
  if (!job || !employerId || job.status === 'revoked') return;
  const newVisibility = job.visibility !== false;
  visibilityUpdating.value = true;
  try {
    const updated = await updateJobVisibility(job.id, employerId, !newVisibility);
    selectedJob.value = updated;
    const idx = apiJobs.value.findIndex((j) => j.id === job.id);
    if (idx >= 0) apiJobs.value[idx] = updated;
    employerJobStore.setJobs([...apiJobs.value]);
  } finally {
    visibilityUpdating.value = false;
  }
}

function confirmRevoke() {
  if (selectedJob.value) revokeConfirm.value = selectedJob.value;
}

async function doRevoke() {
  const job = revokeConfirm.value;
  const employerId = employerStore.currentEmployerId;
  if (!job || !employerId) return;
  revoking.value = true;
  revokeError.value = '';
  try {
    const updated = await revokeJobPosting(job.id, employerId);
    revokeConfirm.value = null;
    selectedJob.value = updated;
    const idx = apiJobs.value.findIndex((j) => j.id === job.id);
    if (idx >= 0) apiJobs.value[idx] = updated;
    employerJobStore.setJobs([...apiJobs.value]);
  } catch (err: unknown) {
    const msg = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
      : null;
    revokeError.value = msg || 'Failed to revoke job';
  } finally {
    revoking.value = false;
  }
}

async function reopenJob() {
  const job = selectedJob.value;
  const employerId = employerStore.currentEmployerId;
  if (!job || !employerId || job.status !== 'revoked') return;
  revoking.value = true;
  try {
    const updated = await reopenJobPosting(job.id, employerId);
    selectedJob.value = updated;
    const idx = apiJobs.value.findIndex((j) => j.id === job.id);
    if (idx >= 0) apiJobs.value[idx] = updated;
    employerJobStore.setJobs([...apiJobs.value]);
  } finally {
    revoking.value = false;
  }
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

  .job-item-header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .job-item-content h3 {
    font-size: 1.1rem;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  &.revoked {
    opacity: 0.85;
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

/* Job modal detail styles */
.detail-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: $marketplace-text;
  margin: 0;
  white-space: pre-wrap;
}

.detail-list-ul {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 6px 0;
    padding-left: 20px;
    position: relative;
    font-size: 0.95rem;
    line-height: 1.5;
    color: $marketplace-text;

    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: $marketplace-primary;
      font-weight: 600;
    }
  }
}

.detail-meta {
  font-size: 0.95rem;
  color: $marketplace-text;
  margin: 0;
  line-height: 1.5;
}

.action-btn.primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  background: $marketplace-primary;
  color: $marketplace-text-on-primary;
  border: none;
  cursor: pointer;

  &:hover {
    opacity: 0.92;
  }
}

.action-btn.secondary,
.action-btn.danger-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: 1px solid $marketplace-panel-border;
  color: $marketplace-text-muted;

  &:hover:not(:disabled) {
    background: rgba(0, 51, 102, 0.06);
    color: $marketplace-primary;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.action-btn.danger-outline {
  border-color: rgba($marketplace-danger, 0.4);
  color: $marketplace-danger;

  &:hover:not(:disabled) {
    background: rgba($marketplace-danger, 0.08);
  }
}

.modal-actions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.actions-left {
  display: flex;
  align-items: center;
}

.actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.visibility-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: $marketplace-text;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.toggle-label {
  user-select: none;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: $marketplace-panel-border;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
  }

  &.on {
    background: $marketplace-primary;
    &::after {
      transform: translateX(20px);
    }
  }
}

.status-badge.revoked {
  background: rgba($marketplace-danger, 0.12);
  color: $marketplace-danger;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.status-badge.hidden {
  background: rgba($marketplace-text-muted, 0.2);
  color: $marketplace-text-muted;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
}

.revoke-modal {
  max-width: 400px;
  padding: 24px;
  text-align: center;
}

.revoke-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba($marketplace-danger, 0.12);
  color: $marketplace-danger;

  i {
    font-size: 1.25rem;
  }
}

.revoke-modal h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: $marketplace-text;
  margin: 0 0 8px 0;
}

.revoke-modal > p {
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.revoke-error {
  font-size: 0.9rem;
  color: $marketplace-danger;
  margin: 0 0 16px 0 !important;
}

.revoke-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.revoke-cancel {
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid $marketplace-panel-border;
  background: transparent;
  color: $marketplace-text-muted;
  cursor: pointer;

  &:hover {
    background: rgba(0, 51, 102, 0.06);
    color: $marketplace-text;
  }
}

.revoke-confirm {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: $marketplace-danger;
  color: white;
  cursor: pointer;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>
