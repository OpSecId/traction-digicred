<template>
  <div class="tenancy-reservation-page page-container page-container--register">
    <button type="button" class="back-link" @click="goBack">
      <i class="pi pi-arrow-left"></i>
      Back
    </button>

    <div class="wizard-container">
      <header class="wizard-header">
        <h1>{{ pageTitle }}</h1>
        <p class="wizard-tagline">Let's get you set up — just a few quick steps!</p>

        <!-- Progress bar -->
        <div class="progress-track" role="progressbar" :aria-valuenow="currentStep + 1" aria-valuemin="1" aria-valuemax="4" aria-label="Registration progress">
          <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
          <div class="progress-dots">
            <span
              v-for="(s, i) in steps"
              :key="s.id"
              class="progress-dot"
              :class="{ active: i <= currentStep, completed: i < currentStep }"
              :title="s.label"
            >
              <i v-if="i < currentStep" class="pi pi-check"></i>
              <span v-else>{{ i + 1 }}</span>
            </span>
          </div>
        </div>

        <p class="step-indicator">
          Step {{ currentStep + 1 }} of 4
          <span class="step-name">— {{ steps[currentStep].label }}</span>
        </p>
      </header>

      <form class="wizard-form" @submit.prevent="handleSubmit">
        <Transition name="slide" mode="out-in">
          <div :key="currentStep" class="wizard-step">
            <!-- Step 0: Type -->
            <div v-if="currentStep === 0" class="step-content step-type">
              <h2 class="step-title">How will you participate?</h2>
              <p class="step-desc">Choose the role that fits your organization best.</p>
              <div class="type-cards">
                <button
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  type="button"
                  class="type-card"
                  :class="{ selected: form.tenancyType === opt.value }"
                  @click="form.tenancyType = opt.value"
                >
                  <i :class="opt.icon" class="type-icon"></i>
                  <span class="type-label">{{ opt.label }}</span>
                  <span class="type-hint">{{ opt.hint }}</span>
                </button>
              </div>
            </div>

            <!-- Step 1: Contact -->
            <div v-else-if="currentStep === 1" class="step-content step-contact">
              <h2 class="step-title">Who's the main contact?</h2>
              <p class="step-desc">We'll reach out here for approvals and updates.</p>
              <div class="form-box wizard-box">
                <div class="form-row-2">
                  <div class="form-block">
                    <label class="block-label">Name <span class="req">*</span></label>
                    <input id="contact-name" v-model="form.contactName" type="text" name="contactName" required placeholder="Jane Smith" maxlength="200" class="input" />
                  </div>
                  <div class="form-block">
                    <label class="block-label">Role <span class="req">*</span></label>
                    <input id="contact-title" v-model="form.contactTitle" type="text" name="contactTitle" required placeholder="HR Manager" maxlength="200" class="input" />
                  </div>
                </div>
                <div class="form-row-2">
                  <div class="form-block">
                    <label class="block-label">Email <span class="req">*</span></label>
                    <input id="contact-email" v-model="form.contactEmail" type="email" name="contactEmail" required placeholder="hr@acme.com" maxlength="254" class="input" />
                  </div>
                  <div class="form-block">
                    <label class="block-label">Phone</label>
                    <input id="contact-phone" v-model="form.contactPhone" type="tel" name="contactPhone" placeholder="+1 (555) 123-4567" maxlength="50" class="input" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2: Organization -->
            <div v-else-if="currentStep === 2" class="step-content step-org">
              <h2 class="step-title">Tell us about your organization</h2>
              <p class="step-desc">Legal and business details for your marketplace profile.</p>
              <div class="form-box wizard-box">
                <div class="form-block">
                  <label class="block-label">Organization name <span class="req">*</span></label>
                  <input id="company-name" v-model="form.companyName" type="text" name="companyName" required placeholder="Acme Inc." maxlength="500" class="input" />
                </div>
                <div class="form-row-2">
                  <div class="form-block">
                    <label class="block-label">Registration / Tax ID</label>
                    <input id="registration-id" v-model="form.registrationId" type="text" name="registrationId" placeholder="EIN, DUNS" maxlength="100" class="input" />
                  </div>
                  <div class="form-block">
                    <label class="block-label">Jurisdiction</label>
                    <input id="jurisdiction" v-model="form.jurisdiction" type="text" name="jurisdiction" placeholder="e.g. Delaware, US" maxlength="200" class="input" />
                  </div>
                </div>
                <div class="form-row-2">
                  <div class="form-block">
                    <label class="block-label">Website</label>
                    <input id="website" v-model="form.website" type="url" name="website" placeholder="https://acme.com" maxlength="500" class="input" />
                  </div>
                  <div class="form-block">
                    <label class="block-label">Industry</label>
                    <input id="industry" v-model="form.industry" type="text" name="industry" placeholder="Technology, Healthcare" maxlength="200" class="input" />
                  </div>
                </div>
                <div class="form-block">
                  <label class="block-label">Business address</label>
                  <input id="business-address" v-model="form.businessAddress" type="text" name="businessAddress" placeholder="123 Main St, City, State, ZIP" maxlength="500" class="input" />
                </div>
              </div>
            </div>

            <!-- Step 3: Intended use -->
            <div v-else-if="currentStep === 3" class="step-content step-use">
              <h2 class="step-title">Almost there!</h2>
              <p class="step-desc">A quick note helps us tailor your onboarding.</p>
              <div class="form-box wizard-box">
                <div class="form-block">
                  <label class="block-label">How will you use the marketplace?</label>
                  <textarea id="intended-use" v-model="form.intendedUse" name="intendedUse" rows="4" placeholder="Briefly describe your plans — e.g. posting jobs, managing scholarships, issuing credentials..." maxlength="2000" class="input input-textarea"></textarea>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <p v-if="submitError" class="form-error">{{ submitError }}</p>

        <div class="wizard-actions">
          <button
            v-if="currentStep > 0"
            type="button"
            class="btn-wizard btn-back"
            @click="prevStep"
          >
            <i class="pi pi-arrow-left"></i>
            Back
          </button>
          <div class="wizard-actions-fill"></div>
          <button
            v-if="currentStep < 3"
            type="button"
            class="btn-wizard btn-next"
            :disabled="!canProceed"
            @click="nextStep"
          >
            {{ nextButtonLabel }}
            <i class="pi pi-arrow-right"></i>
          </button>
          <button
            v-else
            type="submit"
            class="btn-wizard btn-submit"
            :disabled="submitting"
          >
            <i v-if="!submitting" class="pi pi-check"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
            {{ submitting ? 'Submitting...' : "Let's go!" }}
          </button>
        </div>
      </form>

      <p class="sign-in-prompt">
        Already have an account? Sign in at the <router-link to="/tenant/login">Marketplace Hub</router-link>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import type { TenancyType } from '@/types/demo';

const router = useRouter();
const tenantStore = useTenantRequestStore();
const submitting = ref(false);
const submitError = ref('');
const currentStep = ref(0);

const steps = [
  { id: 'type', label: 'Type' },
  { id: 'contact', label: 'Contact' },
  { id: 'org', label: 'Organization' },
  { id: 'use', label: 'Use' },
];

const typeOptions = [
  { value: 'Employer', label: 'Employer', hint: 'Publish jobs and hire', icon: 'pi pi-briefcase' },
  { value: 'Scholarship Admin', label: 'Scholarship Admin', hint: 'Manage programs', icon: 'pi pi-graduation-cap' },
  { value: 'Education Institution', label: 'Education Institution', hint: 'Connect learners', icon: 'pi pi-building' },
  { value: 'Government Service', label: 'Government Service', hint: 'Public programs', icon: 'pi pi-shield' },
];

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

const progressPercent = computed(() => ((currentStep + 1) / 4) * 100);

const canProceed = computed(() => {
  if (currentStep.value === 0) return !!form.value.tenancyType;
  if (currentStep.value === 1) {
    return !!form.value.contactName?.trim() && !!form.value.contactTitle?.trim() && !!form.value.contactEmail?.trim();
  }
  if (currentStep.value === 2) return !!form.value.companyName?.trim();
  return true;
});

const nextButtonLabel = computed(() => {
  if (currentStep.value === 0) return form.value.tenancyType ? "Great choice, next!" : "Next";
  if (currentStep.value === 1) return "Continue";
  if (currentStep.value === 2) return "Almost there!";
  return "Next";
});

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
    submitError.value = '';
  }
}

function nextStep() {
  if (currentStep.value < 3 && canProceed.value) {
    currentStep.value++;
    submitError.value = '';
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}

function handleSubmit() {
  if (currentStep.value < 3) {
    nextStep();
    return;
  }
  submitReservation();
}

async function submitReservation() {
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
        path: '/tenant/login',
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
@use '@/assets/page-common.scss';

.tenancy-reservation-page {
  padding-bottom: 32px;
}

.wizard-container {
  width: 100%;
  min-width: 0;
  max-width: 560px;
  margin: 0 auto;
}

.wizard-header {
  margin-bottom: 28px;

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 4px 0;
    letter-spacing: -0.02em;
  }

  .wizard-tagline {
    font-size: 0.95rem;
    color: $marketplace-text-muted;
    margin: 0 0 24px 0;
  }

  .step-indicator {
    font-size: 0.8rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 12px 0 0 0;

    .step-name {
      font-weight: 500;
      color: $marketplace-text-muted;
    }
  }
}

.progress-track {
  height: 6px;
  background: rgba(0, 51, 102, 0.12);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $marketplace-primary, $marketplace-secondary);
  border-radius: 6px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-dots {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
  pointer-events: none;
}

.progress-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(0, 51, 102, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: $marketplace-text-muted;
  transition: all 0.3s ease;

  &.active {
    border-color: $marketplace-primary;
    color: $marketplace-primary;
    background: white;
    transform: scale(1.1);
  }

  &.completed {
    border-color: $marketplace-success;
    background: $marketplace-success;
    color: white;

    i {
      font-size: 0.6rem;
    }
  }
}

.wizard-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wizard-step {
  min-height: 240px;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

.step-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0 0 6px 0;
}

.step-desc {
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  margin: 0 0 20px 0;
  line-height: 1.45;
}

.type-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 18px 16px;
  border: 2px solid $marketplace-panel-border;
  border-radius: 14px;
  background: $marketplace-bg-card;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(0, 51, 102, 0.35);
    background: rgba(0, 51, 102, 0.03);
  }

  &.selected {
    border-color: $marketplace-primary;
    background: rgba(0, 51, 102, 0.06);
    box-shadow: 0 0 0 1px $marketplace-primary;
  }

  .type-icon {
    font-size: 1.5rem;
    color: $marketplace-primary;
  }

  .type-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: $marketplace-text;
  }

  .type-hint {
    font-size: 0.78rem;
    color: $marketplace-text-muted;
  }
}

.wizard-box {
  padding: 20px;
  border-radius: 14px;
  border: 1px solid rgba(0, 51, 102, 0.1);
  background: $marketplace-bg-card;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.form-block) {
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }
}

:deep(.form-row-2) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

:deep(.block-label) {
  font-size: 0.82rem;
  font-weight: 600;
  color: $marketplace-text;
  margin: 0 0 6px 0;

  .req {
    color: $marketplace-danger;
  }
}

:deep(.input) {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid $marketplace-panel-border;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  background: $marketplace-bg-card;
  transition: border-color 0.2s, box-shadow 0.15s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: $marketplace-primary;
    box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
  }
}

:deep(.input-textarea) {
  resize: vertical;
  min-height: 100px;
}

.form-error {
  font-size: 0.9rem;
  color: $marketplace-danger;
  margin: 0;
}

.wizard-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.wizard-actions-fill {
  flex: 1;
  min-width: 12px;
}

.btn-wizard {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.btn-back {
    background: transparent;
    border: 1px solid $marketplace-panel-border;
    color: $marketplace-text-muted;

    &:hover {
      border-color: rgba(0, 51, 102, 0.4);
      color: $marketplace-primary;
    }
  }

  &.btn-next {
    background: $marketplace-primary;
    border: none;
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.btn-submit {
    background: linear-gradient(135deg, $marketplace-primary 0%, #002244 100%);
    border: none;
    color: white;
    box-shadow: 0 4px 14px rgba(0, 51, 102, 0.35);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 51, 102, 0.4);
    }

    &:disabled {
      opacity: 0.8;
      cursor: not-allowed;
    }
  }
}

.sign-in-prompt {
  font-size: 0.85rem;
  color: $marketplace-text-muted;
  margin-top: 28px;
  text-align: center;
}
</style>
