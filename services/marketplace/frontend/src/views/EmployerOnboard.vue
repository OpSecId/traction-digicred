<template>
  <div class="onboard-page">
    <button type="button" class="back-link" @click="goBack">
      <i class="pi pi-arrow-left"></i>
      Back
    </button>

    <div class="onboard-content">
      <h1>{{ pageTitle }}</h1>
      <p class="subtitle">Register your organization. We collect this for identity verification (KYC).</p>

      <form class="onboard-form" @submit.prevent="submitOnboarding">
        <div class="form-block">
          <label class="block-label">Organization type <span class="req">*</span></label>
          <select v-model="form.tenantType" required class="input">
            <option value="">Select type</option>
            <option value="Employer">Employer</option>
            <option value="Scholarship Admin">Scholarship Admin</option>
            <option value="Education Institution">Education Institution</option>
            <option value="Government Service">Government Service</option>
          </select>
        </div>

        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">Contact name <span class="req">*</span></label>
            <input v-model="form.contactName" type="text" required placeholder="Jane Smith" class="input" />
          </div>
          <div class="form-block">
            <label class="block-label">Role <span class="req">*</span></label>
            <input v-model="form.contactTitle" type="text" required :placeholder="contactTitlePlaceholder" class="input" />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">Email <span class="req">*</span></label>
            <input v-model="form.contactEmail" type="email" required placeholder="hr@acme.com" class="input" />
          </div>
          <div class="form-block">
            <label class="block-label">Phone</label>
            <input v-model="form.contactPhone" type="tel" placeholder="+1 (555) 123-4567" class="input" />
          </div>
        </div>

        <div class="form-block">
          <label class="block-label">Organization name <span class="req">*</span></label>
          <input v-model="form.companyName" type="text" required placeholder="Acme Inc." class="input" />
        </div>
        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">Registration / Tax ID</label>
            <input v-model="form.registrationId" type="text" placeholder="EIN, DUNS, company number" class="input" />
          </div>
          <div class="form-block">
            <label class="block-label">Jurisdiction</label>
            <input v-model="form.jurisdiction" type="text" placeholder="e.g. Delaware, US" class="input" />
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-block">
            <label class="block-label">Website</label>
            <input v-model="form.website" type="url" placeholder="https://acme.com" class="input" />
          </div>
          <div class="form-block">
            <label class="block-label">Industry</label>
            <input v-model="form.industry" type="text" placeholder="Technology, Healthcare, etc." class="input" />
          </div>
        </div>
        <div class="form-block">
          <label class="block-label">Business address</label>
          <input v-model="form.businessAddress" type="text" placeholder="123 Main St, City, State, ZIP" class="input" />
        </div>

        <!-- Employer-specific -->
        <template v-if="form.tenantType === 'Employer'">
          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">Hiring volume (per year)</label>
              <select v-model="form.hiringVolume" class="input">
                <option value="">Select range</option>
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="200+">200+</option>
              </select>
            </div>
            <div class="form-block">
              <label class="block-label">Primary industries</label>
              <input v-model="form.primaryIndustries" type="text" placeholder="Healthcare, Technology, etc." class="input" />
            </div>
          </div>
        </template>

        <!-- Scholarship Admin-specific -->
        <template v-if="form.tenantType === 'Scholarship Admin'">
          <div class="form-block">
            <label class="block-label">Funding source</label>
            <input v-model="form.fundingSource" type="text" placeholder="Foundation, grant, sponsor" class="input" />
          </div>
          <div class="form-block">
            <label class="block-label">Eligibility overview</label>
            <textarea v-model="form.eligibilityOverview" rows="2" placeholder="Who is eligible (e.g. undergraduates, STEM majors)" class="input input-textarea"></textarea>
          </div>
        </template>

        <!-- Education Institution-specific -->
        <template v-if="form.tenantType === 'Education Institution'">
          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">Accreditation</label>
              <input v-model="form.accreditation" type="text" placeholder="Regional accreditor, national body" class="input" />
            </div>
            <div class="form-block">
              <label class="block-label">Credential types</label>
              <input v-model="form.credentialTypes" type="text" placeholder="Transcripts, diplomas, certificates" class="input" />
            </div>
          </div>
        </template>

        <div class="form-block">
          <label class="block-label">Intended use</label>
          <textarea v-model="form.intendedUse" rows="2" :placeholder="intendedUsePlaceholder" class="input input-textarea"></textarea>
        </div>

        <p v-if="submitError" class="form-error">{{ submitError }}</p>
        <button type="submit" class="submit-btn" :disabled="submitting">
          <i v-if="!submitting" class="pi pi-check"></i>
          <i v-else class="pi pi-spin pi-spinner"></i>
          {{ submitting ? 'Submitting...' : 'Submit for Review' }}
        </button>
      </form>

      <p class="demo-note">
        Already have an account? Sign in at the <router-link to="/tenant">Marketplace Tenants Hub</router-link>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import type { TenantType } from '@/types/demo';

const router = useRouter();
const tenantStore = useTenantRequestStore();
const submitting = ref(false);
const submitError = ref('');

const form = ref({
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  tenantType: '' as TenantType | '',
  companyName: '',
  registrationId: '',
  jurisdiction: '',
  businessAddress: '',
  website: '',
  industry: '',
  intendedUse: '',
  hiringVolume: '',
  primaryIndustries: '',
  fundingSource: '',
  eligibilityOverview: '',
  accreditation: '',
  credentialTypes: '',
});

const pageTitle = computed(() => {
  const t = form.value.tenantType;
  if (t === 'Employer') return 'Become an Employer';
  if (t === 'Scholarship Admin') return 'Register as Scholarship Admin';
  if (t === 'Education Institution') return 'Register as Education Institution';
  if (t === 'Government Service') return 'Register as Government Service';
  return 'Register your organization';
});

const contactTitlePlaceholder = computed(() => {
  const t = form.value.tenantType;
  if (t === 'Employer') return 'HR Director';
  if (t === 'Scholarship Admin') return 'Program Director';
  if (t === 'Education Institution') return 'Registrar';
  if (t === 'Government Service') return 'Program Manager';
  return 'Your role';
});

const intendedUsePlaceholder = computed(() => {
  const t = form.value.tenantType;
  if (t === 'Employer') return 'e.g. Post jobs, receive credential-backed applications';
  if (t === 'Scholarship Admin') return 'e.g. Manage scholarships, verify credentials';
  if (t === 'Education Institution') return 'e.g. Issue credentials, partner with employers';
  if (t === 'Government Service') return 'e.g. Verify credentials for benefits or licenses';
  return 'Briefly describe how you will use the marketplace';
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}

async function submitOnboarding() {
  submitError.value = '';
  submitting.value = true;
  try {
    const result = await tenantStore.addRequest({
      tenantType: form.value.tenantType as TenantType,
      name: form.value.companyName,
      email: form.value.contactEmail,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      contactName: form.value.contactName,
      contactTitle: form.value.contactTitle,
      contactPhone: form.value.contactPhone || undefined,
      registrationId: form.value.registrationId || undefined,
      jurisdiction: form.value.jurisdiction || undefined,
      businessAddress: form.value.businessAddress || undefined,
      website: form.value.website || undefined,
      industry: form.value.industry || undefined,
      intendedUse: form.value.intendedUse || undefined,
      hiringVolume: form.value.hiringVolume || undefined,
      primaryIndustries: form.value.primaryIndustries || undefined,
      fundingSource: form.value.fundingSource || undefined,
      eligibilityOverview: form.value.eligibilityOverview || undefined,
      accreditation: form.value.accreditation || undefined,
      credentialTypes: form.value.credentialTypes || undefined,
    });
    if (result.success) {
      router.push({
        name: 'Employer',
        query: { onboarded: '1', ...(result.referenceId && { ref: result.referenceId }) },
      });
    } else {
      submitError.value = result.error ?? 'Failed to submit';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.onboard-page {
  padding: 16px 20px 32px;
  max-width: 640px;
  margin: 0 auto;

  @media (min-width: $breakpoint-desktop) {
    padding: 24px 32px 48px;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: $marketplace-text-muted;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: inherit;
  margin-bottom: 20px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: $marketplace-primary;
  }
}

.onboard-content {
  h1 {
    font-size: 1.4rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 4px 0;
  }

  .subtitle {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: 0 0 24px 0;
  }
}

.onboard-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.block-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: $marketplace-text;
  margin: 0;

  .req {
    color: $marketplace-danger;
  }
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid $marketplace-panel-border;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: $marketplace-bg-card;
  transition: border-color 0.2s, box-shadow 0.15s;
  box-sizing: border-box;

  &::placeholder {
    color: $marketplace-text-muted;
  }

  &:focus {
    outline: none;
    border-color: $marketplace-primary;
    box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
  }
}

select.input {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236c757d' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.input-textarea {
  resize: vertical;
  min-height: 64px;
}

.form-error {
  font-size: 0.9rem;
  color: $marketplace-danger;
  margin: 0;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  margin-top: 8px;
  background: $marketplace-primary;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.demo-note {
  font-size: 0.85rem;
  color: $marketplace-text-muted;
  margin-top: 24px;
  text-align: center;
}
</style>
