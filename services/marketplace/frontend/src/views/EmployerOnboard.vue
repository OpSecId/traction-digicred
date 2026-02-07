<template>
  <div class="onboard-page">
    <button type="button" class="back-link" @click="goBack">
      <i class="pi pi-arrow-left"></i>
      Back
    </button>

    <div class="onboard-content">
      <h1>{{ pageTitle }}</h1>
      <p class="subtitle">Register your organization to join the marketplace.</p>

      <form class="onboard-form" @submit.prevent="submitOnboarding">
        <div class="form-box">
          <h3 class="form-box-title">Organization type</h3>
          <div class="form-block">
            <label class="block-label">Type <span class="req">*</span></label>
            <select v-model="form.tenancyType" required class="input">
              <option value="">Select type</option>
              <option value="Employer">Employer</option>
              <option value="Scholarship Admin">Scholarship Admin</option>
              <option value="Education Institution">Education Institution</option>
              <option value="Government Service">Government Service</option>
            </select>
          </div>
        </div>

        <div class="form-box">
          <h3 class="form-box-title">Contact</h3>
          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">Name <span class="req">*</span></label>
              <input v-model="form.contactName" type="text" required placeholder="Jane Smith" class="input" />
            </div>
            <div class="form-block">
              <label class="block-label">Role <span class="req">*</span></label>
              <input v-model="form.contactTitle" type="text" required placeholder="Your role" class="input" />
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
        </div>

        <div class="form-box">
          <h3 class="form-box-title">Organization</h3>
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
        </div>

        <div class="form-box">
          <h3 class="form-box-title">Intended use</h3>
          <div class="form-block">
            <label class="block-label">Describe how you will use the marketplace</label>
            <textarea v-model="form.intendedUse" rows="2" placeholder="Briefly describe how you will use the marketplace" class="input input-textarea"></textarea>
          </div>
        </div>

        <p v-if="submitError" class="form-error">{{ submitError }}</p>
        <button type="submit" class="submit-btn" :disabled="submitting">
          <i v-if="!submitting" class="pi pi-check"></i>
          <i v-else class="pi pi-spin pi-spinner"></i>
          {{ submitting ? 'Submitting...' : 'Submit for Review' }}
        </button>
      </form>

      <p class="sign-in-prompt">
        Already have an account? Sign in at the <router-link to="/tenant">Marketplace Tenants Hub</router-link>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import type { TenancyType } from '@/types/demo';

const router = useRouter();
const tenantStore = useTenantRequestStore();
const submitting = ref(false);
const submitError = ref('');

const form = ref({
  contactName: '',
  contactTitle: '',
  contactEmail: '',
  contactPhone: '',
  tenancyType: '' as TenancyType | '',
  companyName: '',
  registrationId: '',
  jurisdiction: '',
  businessAddress: '',
  website: '',
  industry: '',
  intendedUse: '',
});

const pageTitle = 'Register your organization';

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
      tenancyType: form.value.tenancyType as TenancyType,
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
  padding: 12px 16px 24px;
  max-width: 640px;
  margin: 0 auto;

  @media (min-width: $breakpoint-desktop) {
    padding: 16px 24px 32px;
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
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  margin-bottom: 12px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: $marketplace-primary;
  }
}

.onboard-content {
  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 2px 0;
  }

  .subtitle {
    font-size: 0.85rem;
    color: $marketplace-text-muted;
    margin: 0 0 16px 0;
  }
}

.onboard-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-box {
  background: $marketplace-bg-card;
  border: 1px solid $marketplace-panel-border;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-box-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: $marketplace-primary;
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid $marketplace-panel-border;
}

.form-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.block-label {
  font-size: 0.75rem;
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
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid $marketplace-panel-border;
  border-radius: 6px;
  font-size: 0.9rem;
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
  min-height: 48px;
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
  gap: 6px;
  padding: 10px 20px;
  margin-top: 4px;
  background: $marketplace-primary;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
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

.sign-in-prompt {
  font-size: 0.8rem;
  color: $marketplace-text-muted;
  margin-top: 16px;
  text-align: center;
}
</style>
