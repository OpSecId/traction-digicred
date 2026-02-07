<template>
  <div class="job-create-page">
    <router-link to="/tenant/jobs" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back
    </router-link>

    <div v-if="!employerStore.isEmployer" class="no-employer">
      <p>Please sign in as an employer first.</p>
      <router-link to="/tenant" class="action-btn primary">Go to Marketplace Tenants Hub</router-link>
    </div>

    <div v-else class="job-create-content">
      <h1>Create Job Posting</h1>
      <p class="subtitle">
        Create a job posting and it will be published on the marketplace.
      </p>

      <form class="job-form" @submit.prevent="submitJob">
        <div class="form-section-label">Job details</div>
        <div class="form-block">
          <label class="block-label">Job title <span class="req">*</span></label>
          <input v-model="form.title" type="text" required placeholder="e.g. Software Engineer" class="input" />
        </div>

        <div class="form-block">
          <label class="block-label">Description <span class="req">*</span></label>
          <textarea v-model="form.description" rows="4" required placeholder="Describe the role, responsibilities, and what you're looking for." class="input input-textarea"></textarea>
        </div>

        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">Employment type</label>
            <select v-model="form.employmentType" class="input">
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
            <input v-model="form.industry" type="text" placeholder="e.g. Technology, Healthcare" class="input" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">Location type</label>
            <select v-model="form.locationType" class="input">
              <option value="">Select</option>
              <option value="OFFICE">On-site</option>
              <option value="TELECOMMUTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div class="form-block">
            <label class="block-label">City</label>
            <input v-model="form.locationCity" type="text" placeholder="e.g. Denver" class="input" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">State / Region</label>
            <input v-model="form.locationRegion" type="text" placeholder="e.g. CO" class="input" />
          </div>
          <div class="form-block">
            <label class="block-label">Country</label>
            <input v-model="form.locationCountry" type="text" placeholder="e.g. US" class="input" />
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">Salary min ($)</label>
            <input v-model.number="form.salaryMin" type="number" min="0" step="1000" placeholder="65000" class="input" />
          </div>
          <div class="form-block">
            <label class="block-label">Salary max ($)</label>
            <input v-model.number="form.salaryMax" type="number" min="0" step="1000" placeholder="85000" class="input" />
          </div>
        </div>

        <div class="form-block">
          <label class="block-label">Salary display (optional)</label>
          <input v-model="form.salaryDisplay" type="text" placeholder="e.g. $65,000 - $85,000 per year" class="input" />
        </div>

        <div class="form-block">
          <label class="block-label">Skills (comma-separated)</label>
          <input v-model="skillsInput" type="text" placeholder="e.g. JavaScript, React, Node.js" class="input" />
        </div>

        <div class="form-block">
          <label class="block-label">Qualifications (comma-separated)</label>
          <input v-model="qualificationsInput" type="text" placeholder="e.g. 2+ years experience, Bachelors degree" class="input" />
        </div>

        <div class="form-block">
          <label class="block-label">Benefits</label>
          <textarea v-model="form.benefits" rows="2" placeholder="e.g. Health, dental, 401(k), PTO" class="input input-textarea"></textarea>
        </div>

        <p v-if="submitError" class="submit-error">{{ submitError }}</p>
        <button type="submit" class="action-btn primary" :disabled="submitting">
          <i v-if="!submitting" class="pi pi-plus"></i>
          <i v-else class="pi pi-spin pi-spinner"></i>
          {{ submitting ? 'Creating...' : 'Create Job Posting' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDemoStore } from '@/store/demoStore';
import { useEmployerStore } from '@/store/employerStore';
import { createJobPosting, getEmployerProfile, profileSubjectFromCredential, emailFromSubject } from '@/api/employerJobs';

const router = useRouter();
const demoStore = useDemoStore();
const employerStore = useEmployerStore();

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

const currentEmployer = computed(() => {
  if (!employerStore.currentEmployerId) return null;
  return demoStore.getEmployerById(employerStore.currentEmployerId);
});

function parseCommaList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
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
      employerName: ((subject.name as string) || currentEmployer.value?.name) ?? 'Employer',
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

.job-create-page {
  padding: 16px 20px 32px;
  max-width: 560px;
  margin: 0 auto;

  .action-btn.primary {
    width: 100%;
    margin-top: 8px;
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

.job-form {
  .form-block {
    margin-bottom: 18px;
  }

  .form-row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .block-label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 6px;
    color: $marketplace-text;

    .req {
      color: $marketplace-danger;
    }
  }

  .input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid $marketplace-panel-border;
    border-radius: 8px;
    font-size: 0.95rem;
    box-sizing: border-box;
    background: $marketplace-bg-card;

    &:focus {
      outline: none;
      border-color: $marketplace-primary;
      box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
    }

    &.input-textarea {
      resize: vertical;
      min-height: 80px;
    }
  }

  .form-section-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 24px 0 12px 0;

    &:first-of-type {
      margin-top: 0;
    }
  }

  .submit-error {
    color: $marketplace-danger;
    font-size: 0.9rem;
    margin: 0 0 12px 0;
  }
}
</style>
