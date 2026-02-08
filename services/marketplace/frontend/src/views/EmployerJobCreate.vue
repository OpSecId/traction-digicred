<template>
  <div class="job-create-page page-container">
    <router-link to="/tenant/jobs" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back
    </router-link>

    <div v-if="!employerStore.isEmployer" class="no-employer">
      <p>Please sign in as an employer first.</p>
      <router-link to="/tenant" class="action-btn primary">Go to Marketplace Hub</router-link>
    </div>

    <div v-else class="job-create-content">
      <h1>Create Job Posting</h1>
      <p class="subtitle">
        Create a job posting and it will be published on the marketplace.
      </p>

      <div class="wizard-steps">
        <div
          v-for="(step, idx) in steps"
          :key="step.id"
          class="step-indicator"
          :class="{ active: currentStep === idx + 1, completed: currentStep > idx + 1 }"
        >
          <div class="step-dot">
            <i v-if="currentStep > idx + 1" class="pi pi-check"></i>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span class="step-label">{{ step.label }}</span>
          <div v-if="idx < steps.length - 1" class="step-connector" />
        </div>
      </div>

      <form class="job-form" @submit.prevent="handleSubmit">
        <!-- Step 1: About the role -->
        <div v-show="currentStep === 1" class="wizard-pane">
          <h2 class="pane-title">About the role</h2>
          <p class="pane-subtitle">Tell candidates about the position</p>

          <div class="form-block">
            <label class="block-label">Job title <span class="req">*</span></label>
            <input id="job-title" v-model="form.title" type="text" required placeholder="e.g. Software Engineer" maxlength="200" class="input" />
          </div>

          <div class="form-block">
            <label class="block-label">Description <span class="req">*</span></label>
            <textarea id="job-description" v-model="form.description" rows="4" required placeholder="Describe the role, responsibilities, and what you're looking for." maxlength="10000" class="input input-textarea"></textarea>
          </div>

          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">Employment type</label>
              <select id="employment-type" v-model="form.employmentType" class="input">
                <option value="">Select</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="TEMPORARY">Temporary</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="VOLUNTEER">Volunteer</option>
              </select>
            </div>
            <div class="form-block">
              <label class="block-label">Industry</label>
              <input id="job-industry" v-model="form.industry" type="text" placeholder="e.g. Technology, Healthcare" maxlength="200" class="input" />
            </div>
          </div>
        </div>

        <!-- Step 2: Location -->
        <div v-show="currentStep === 2" class="wizard-pane">
          <h2 class="pane-title">Location</h2>
          <p class="pane-subtitle">Where is this role based?</p>

          <div class="form-block">
            <label class="block-label">Location type</label>
            <select id="location-type" v-model="form.locationType" class="input">
              <option value="">Select</option>
              <option value="OFFICE">On-site</option>
              <option value="TELECOMMUTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>

          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">City</label>
              <input id="location-city" v-model="form.locationCity" type="text" placeholder="e.g. Denver" maxlength="100" class="input" />
            </div>
            <div class="form-block">
              <label class="block-label">State / Region</label>
              <input id="location-region" v-model="form.locationRegion" type="text" placeholder="e.g. CO" maxlength="100" class="input" />
            </div>
          </div>

          <div class="form-block">
            <label class="block-label">Country</label>
            <input id="location-country" v-model="form.locationCountry" type="text" placeholder="e.g. US" maxlength="100" class="input" />
          </div>
        </div>

        <!-- Step 3: Pay & perks -->
        <div v-show="currentStep === 3" class="wizard-pane">
          <h2 class="pane-title">Pay & perks</h2>
          <p class="pane-subtitle">Compensation and additional benefits</p>

          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">Salary min ($)</label>
              <input id="salary-min" v-model.number="form.salaryMin" type="number" min="0" step="1000" placeholder="65000" class="input" />
            </div>
            <div class="form-block">
              <label class="block-label">Salary max ($)</label>
              <input id="salary-max" v-model.number="form.salaryMax" type="number" min="0" step="1000" placeholder="85000" class="input" />
            </div>
          </div>

          <div class="form-block">
            <label class="block-label">Salary display (optional)</label>
            <input id="salary-display" v-model="form.salaryDisplay" type="text" placeholder="e.g. $65,000 - $85,000 per year" maxlength="200" class="input" />
          </div>

          <div class="form-block">
            <label class="block-label">Skills (comma-separated)</label>
            <input id="skills" v-model="skillsInput" type="text" placeholder="e.g. JavaScript, React, Node.js" maxlength="1000" class="input" />
          </div>

          <div class="form-block">
            <label class="block-label">Qualifications (comma-separated)</label>
            <input id="qualifications" v-model="qualificationsInput" type="text" placeholder="e.g. 2+ years experience, Bachelors degree" maxlength="2000" class="input" />
          </div>

          <div class="form-block">
            <label class="block-label">Benefits</label>
            <textarea id="benefits" v-model="form.benefits" rows="2" placeholder="e.g. Health, dental, 401(k), PTO" maxlength="1000" class="input input-textarea"></textarea>
          </div>
        </div>

        <!-- Step 4: Review & publish -->
        <div v-show="currentStep === 4" class="wizard-pane">
          <h2 class="pane-title">Review & publish</h2>
          <p class="pane-subtitle">Confirm your job posting details</p>

          <div class="review-card">
            <div class="review-section">
              <h3>About the role</h3>
              <p class="review-field"><strong>{{ form.title || '—' }}</strong></p>
              <p class="review-field">{{ form.description || '—' }}</p>
              <p class="review-meta">
                <span v-if="form.employmentType">{{ employmentTypeLabel(form.employmentType) }}</span>
                <span v-if="form.industry"> · {{ form.industry }}</span>
              </p>
            </div>

            <div class="review-section">
              <h3>Location</h3>
              <p class="review-field">
                <span v-if="form.locationType">{{ locationTypeLabel(form.locationType) }}</span>
                <template v-if="form.locationCity || form.locationRegion || form.locationCountry">
                  — {{ [form.locationCity, form.locationRegion, form.locationCountry].filter(Boolean).join(', ') }}
                </template>
                <span v-if="!form.locationType && !form.locationCity && !form.locationRegion && !form.locationCountry">—</span>
              </p>
            </div>

            <div class="review-section">
              <h3>Pay & perks</h3>
              <p class="review-field">
                <span v-if="form.salaryDisplay">{{ form.salaryDisplay }}</span>
                <span v-else-if="form.salaryMin || form.salaryMax">
                  ${{ form.salaryMin ?? '—' }} – ${{ form.salaryMax ?? '—' }}
                </span>
                <span v-else>—</span>
              </p>
              <p v-if="parseCommaList(skillsInput).length" class="review-field">
                <strong>Skills:</strong> {{ parseCommaList(skillsInput).join(', ') }}
              </p>
              <p v-if="parseCommaList(qualificationsInput).length" class="review-field">
                <strong>Qualifications:</strong> {{ parseCommaList(qualificationsInput).join(', ') }}
              </p>
              <p v-if="form.benefits" class="review-field">{{ form.benefits }}</p>
            </div>
          </div>
        </div>

        <div class="wizard-actions">
          <button v-if="currentStep > 1" type="button" class="action-btn secondary" @click="currentStep--">
            <i class="pi pi-arrow-left"></i>
            Back
          </button>
          <div class="wizard-actions-spacer"></div>
          <button
            v-if="currentStep < 4"
            type="button"
            class="action-btn primary"
            :disabled="!canProceed"
            @click="currentStep++"
          >
            Next
            <i class="pi pi-arrow-right"></i>
          </button>
          <button
            v-else
            type="submit"
            class="action-btn primary"
            :disabled="submitting"
          >
            <i v-if="!submitting" class="pi pi-plus"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
            {{ submitting ? 'Creating...' : 'Create Job Posting' }}
          </button>
        </div>

        <p v-if="submitError" class="submit-error">{{ submitError }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useEmployerStore } from '@/store/employerStore';
import { createJobPosting, getEmployerProfile, profileSubjectFromCredential, emailFromSubject } from '@/api/employerJobs';

const router = useRouter();
const employerStore = useEmployerStore();

const steps = [
  { id: 'role', label: 'Role' },
  { id: 'location', label: 'Location' },
  { id: 'pay', label: 'Pay & perks' },
  { id: 'review', label: 'Review' },
];

const currentStep = ref(1);

const form = ref({
  title: '',
  description: '',
  employmentType: '',
  locationType: '',
  locationCity: '',
  locationRegion: '',
  locationCountry: '',
  salaryMin: undefined as number | undefined,
  salaryMax: undefined as number | undefined,
  salaryDisplay: '',
  industry: '',
  benefits: '',
});
const skillsInput = ref('');
const qualificationsInput = ref('');
const submitting = ref(false);
const submitError = ref('');

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return form.value.title.trim() && form.value.description.trim();
  }
  return true;
});

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

function parseCommaList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function handleSubmit() {
  if (currentStep.value < 4) return;
  submitJob();
}

async function submitJob() {
  if (!employerStore.currentEmployerId) return;
  submitError.value = '';
  submitting.value = true;
  try {
    const profile = await getEmployerProfile(employerStore.currentEmployerId);
    const subject = profileSubjectFromCredential(profile);
    await createJobPosting({
      employerId: employerStore.currentEmployerId,
      employerName: (subject.name as string) ?? 'Employer',
      employerEmail: emailFromSubject(subject),
      employerIndustry: subject.industry as string | undefined,
      employerWebsite: (subject.url as string) || (subject.website as string) || undefined,
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      employmentType: form.value.employmentType || undefined,
      locationType: form.value.locationType || undefined,
      locationCity: form.value.locationCity || undefined,
      locationRegion: form.value.locationRegion || undefined,
      locationCountry: form.value.locationCountry || undefined,
      salaryMin: form.value.salaryMin,
      salaryMax: form.value.salaryMax,
      salaryDisplay: form.value.salaryDisplay || undefined,
      industry: form.value.industry || undefined,
      benefits: form.value.benefits || undefined,
      skills: parseCommaList(skillsInput.value),
      qualifications: parseCommaList(qualificationsInput.value),
    });
    router.push('/tenant/jobs');
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to create job posting'
        : 'Failed to create job posting';
    submitError.value = msg;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;
@use '@/assets/employer-common.scss';
@use '@/assets/page-common.scss';

.job-create-page {
  .action-btn.primary {
    padding: 14px 20px;
  }
}

.job-create-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 0.95rem;
  color: $marketplace-text-muted;
  margin: 0 0 24px 0;
}

.wizard-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 8px;

  .step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    background: $marketplace-bg;
    border: 2px solid $marketplace-panel-border;
    color: $marketplace-text-muted;
    transition: all 0.2s;

    i {
      font-size: 0.75rem;
      color: $marketplace-success;
    }
  }

  &.active .step-dot {
    background: $marketplace-primary;
    border-color: $marketplace-primary;
    color: white;
  }

  &.completed .step-dot {
    background: rgba($marketplace-success, 0.15);
    border-color: $marketplace-success;
    color: $marketplace-success;
  }

  .step-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: $marketplace-text-muted;

    @media (max-width: 500px) {
      display: none;
    }
  }

  &.active .step-label {
    color: $marketplace-primary;
  }

  &.completed .step-label {
    color: $marketplace-text;
  }

  .step-connector {
    width: 24px;
    height: 2px;
    background: $marketplace-panel-border;
    margin: 0 4px;

    @media (max-width: 500px) {
      width: 16px;
    }
  }
}

.wizard-pane {
  min-height: 280px;
}

.pane-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: $marketplace-text;
  margin: 0 0 4px 0;
}

.pane-subtitle {
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  margin: 0 0 20px 0;
}

.job-form {
  .form-block {
    margin-bottom: 18px;
  }

  .input-textarea {
    min-height: 80px;
  }

  .submit-error {
    color: $marketplace-danger;
    font-size: 0.9rem;
    margin: 16px 0 0 0;
  }
}

.wizard-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid $marketplace-panel-border;
}

.wizard-actions-spacer {
  flex: 1;
}

.review-card {
  background: $marketplace-bg;
  border: 1px solid $marketplace-panel-border;
  border-radius: 12px;
  overflow: hidden;
}

.review-section {
  padding: 16px 18px;
  border-bottom: 1px solid $marketplace-panel-border;

  &:last-child {
    border-bottom: none;
  }

  h3 {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $marketplace-text-muted;
    margin: 0 0 10px 0;
  }

  .review-field {
    font-size: 0.95rem;
    color: $marketplace-text;
    margin: 0 0 8px 0;
    line-height: 1.5;
    white-space: pre-wrap;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .review-meta {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: 0;
  }
}
</style>
