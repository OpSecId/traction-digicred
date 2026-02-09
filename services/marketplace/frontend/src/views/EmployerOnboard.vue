<template>
  <div class="onboard-page">
    <button type="button" class="back-link" @click="goBack">
      <i class="pi pi-arrow-left"></i>
      Back
    </button>

    <div class="onboard-content">
      <header class="form-header">
        <h1>{{ pageTitle }}</h1>
        <p class="subtitle">Register your organization to join the marketplace.</p>
        <nav class="step-nav" aria-label="Form sections">
          <button
            v-for="(s, i) in sections"
            :key="s.id"
            type="button"
            class="step-nav-btn"
            :class="{ active: activeSection === s.id }"
            @click="scrollToSection(s.id)"
          >
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-label">{{ s.label }}</span>
          </button>
        </nav>
        <div class="header-actions">
          <button
            type="button"
            class="info-toggle"
            :class="{ active: showDescriptions }"
            :title="showDescriptions ? 'Hide field descriptions' : 'Show field descriptions'"
            aria-label="Toggle field descriptions"
            @click="showDescriptions = !showDescriptions"
          >
            <i class="pi pi-question-circle"></i>
          </button>
        </div>
      </header>

      <form class="onboard-form register-form" @submit.prevent="submitOnboarding">
        <section ref="typeRef" class="form-section" data-section="type">
        <div class="form-box">
          <h3 class="form-box-title">Tenancy Type</h3>
          <p v-show="showDescriptions" class="form-box-desc">Choose how your organization will participate in the marketplace: employers publish jobs, scholarship admins manage programs, education institutions connect learners, or government services offer public programs.</p>
          <div class="form-block">
            <label class="block-label">Type <span class="req">*</span></label>
            <select id="tenancy-type" v-model="form.tenancyType" name="tenancyType" required class="input">
              <option value="">Select type</option>
              <option value="Employer">Employer</option>
              <option value="Scholarship Admin">Scholarship Admin</option>
              <option value="Education Institution">Education Institution</option>
              <option value="Government Service">Government Service</option>
            </select>
          </div>
        </div>
        </section>

        <section ref="contactRef" class="form-section" data-section="contact">
        <div class="form-box">
          <h3 class="form-box-title">Contact Point</h3>
          <p v-show="showDescriptions" class="form-box-desc">The primary person marketplace admins will reach for approvals, questions, or credential updates. This contact information is included in your profile credential.</p>
          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">Name <span class="req">*</span></label>
              <input id="contact-name" v-model="form.contactName" type="text" name="contactName" required placeholder="Jane Smith" maxlength="200" class="input" />
            </div>
            <div class="form-block">
              <label class="block-label">Role <span class="req">*</span></label>
              <input id="contact-title" v-model="form.contactTitle" type="text" name="contactTitle" required placeholder="Your role" maxlength="200" class="input" />
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
        </section>

        <section ref="orgRef" class="form-section" data-section="org">
        <div class="form-box">
          <h3 class="form-box-title">Organization</h3>
          <p v-show="showDescriptions" class="form-box-desc">Your organization's legal and business details. These are used to verify your identity and appear in your marketplace profile.</p>
          <div class="form-block">
            <label class="block-label">Organization name <span class="req">*</span></label>
            <input id="company-name" v-model="form.companyName" type="text" name="companyName" required placeholder="Acme Inc." maxlength="500" class="input" />
          </div>
          <div class="form-row-2">
            <div class="form-block">
              <label class="block-label">Registration / Tax ID</label>
              <input id="registration-id" v-model="form.registrationId" type="text" name="registrationId" placeholder="EIN, DUNS, company number" maxlength="100" class="input" />
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
              <input id="industry" v-model="form.industry" type="text" name="industry" placeholder="Technology, Healthcare, etc." maxlength="200" class="input" />
            </div>
          </div>
          <div class="form-block">
            <label class="block-label">Business address</label>
            <input id="business-address" v-model="form.businessAddress" type="text" name="businessAddress" placeholder="123 Main St, City, State, ZIP" maxlength="500" class="input" />
          </div>
        </div>
        </section>

        <section ref="useRef" class="form-section" data-section="use">
        <div class="form-box">
          <h3 class="form-box-title">Intended use</h3>
          <p v-show="showDescriptions" class="form-box-desc">Briefly describe how you plan to use the marketplace. This helps admins review your request and tailor your onboarding.</p>
          <div class="form-block">
            <label class="block-label">Describe how you will use the marketplace</label>
            <textarea id="intended-use" v-model="form.intendedUse" name="intendedUse" rows="2" placeholder="Briefly describe how you will use the marketplace" maxlength="2000" class="input input-textarea"></textarea>
          </div>
        </div>
        </section>

        <p v-if="submitError" class="form-error">{{ submitError }}</p>
        <button type="submit" class="submit-btn" :disabled="submitting">
          <i v-if="!submitting" class="pi pi-check"></i>
          <i v-else class="pi pi-spin pi-spinner"></i>
          {{ submitting ? 'Submitting...' : 'Submit for Review' }}
        </button>
      </form>

      <p class="sign-in-prompt">
        Already have an account? Sign in at the <router-link to="/tenant/login">Marketplace Hub</router-link>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import type { TenancyType } from '@/types/demo';

const router = useRouter();
const tenantStore = useTenantRequestStore();
const submitting = ref(false);
const submitError = ref('');
const showDescriptions = ref(false);
const activeSection = ref('type');

const typeRef = ref<HTMLElement | null>(null);
const contactRef = ref<HTMLElement | null>(null);
const orgRef = ref<HTMLElement | null>(null);
const useRef = ref<HTMLElement | null>(null);

const sections = [
  { id: 'type', label: 'Type' },
  { id: 'contact', label: 'Contact' },
  { id: 'org', label: 'Organization' },
  { id: 'use', label: 'Use' },
];

function scrollToSection(id: string) {
  const refs = { type: typeRef, contact: contactRef, org: orgRef, use: useRef };
  refs[id as keyof typeof refs]?.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  activeSection.value = id;
}

let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const id = (e.target as HTMLElement).dataset.section;
          if (id) activeSection.value = id;
        }
      }
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );
  [typeRef, contactRef, orgRef, useRef].forEach((r) => {
    if (r.value) observer?.observe(r.value);
  });
});

onUnmounted(() => {
  observer?.disconnect();
});

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

.onboard-page {
  padding: 12px 16px 24px;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;

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

.form-header {
  margin-bottom: 20px;
  position: relative;

  h1 {
    font-size: 1.4rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 4px 0;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: 0 0 16px 0;
  }

  .header-actions {
    position: absolute;
    top: 0;
    right: 0;
  }
}

.step-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.step-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
  border: 1px solid $marketplace-panel-border;
  border-radius: 20px;
  background: $marketplace-bg-card;
  color: $marketplace-text-muted;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(0, 51, 102, 0.4);
    color: $marketplace-primary;
    background: rgba(0, 51, 102, 0.04);
  }

  &.active {
    background: $marketplace-primary;
    color: white;
    border-color: $marketplace-primary;
  }

  .step-num {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.1);

    .active & {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  .step-label {
    @media (max-width: 480px) {
      display: none;
    }
  }
}

.info-toggle {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid $marketplace-panel-border;
  border-radius: 50%;
  background: $marketplace-bg-card;
  color: $marketplace-text-muted;
  cursor: pointer;
  transition: all 0.2s ease;

  i {
    font-size: 1.1rem;
  }

  &:hover {
    border-color: rgba(0, 51, 102, 0.4);
    color: $marketplace-primary;
  }

  &.active {
    background: rgba(0, 51, 102, 0.08);
    color: $marketplace-primary;
    border-color: $marketplace-primary;
  }
}

.onboard-content {
  width: 100%;
  min-width: 0;
}

.onboard-form.register-form {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.form-section) {
    scroll-margin-top: 8px;
  }

  :deep(.form-box) {
    padding: 16px 18px;
    margin-bottom: 0;
    border-radius: 12px;
    border: 1px solid rgba(0, 51, 102, 0.1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    background: $marketplace-bg-card;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 51, 102, 0.08);
    }
  }

  :deep(.form-box-title) {
    font-size: 0.85rem;
    font-weight: 600;
    padding-bottom: 10px;
    margin-bottom: 0;
    border-bottom: 1px solid rgba(0, 51, 102, 0.08);
    letter-spacing: 0.02em;
  }

  :deep(.form-box-desc) {
    font-size: 0.78rem;
    margin-top: 8px;
    margin-bottom: 0;
  }

  :deep(.form-block) {
    gap: 6px;
  }

  :deep(.block-label) {
    font-size: 0.8rem;
  }

  :deep(.input) {
    padding: 10px 12px;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  :deep(.form-row-2) {
    gap: 12px;
  }

  :deep(.submit-btn) {
    margin-top: 8px;
    padding: 12px 24px;
    font-size: 0.95rem;
    border-radius: 10px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 51, 102, 0.2);
    transition: transform 0.15s, box-shadow 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 51, 102, 0.25);
    }
  }
}

.sign-in-prompt {
  font-size: 0.8rem;
  color: $marketplace-text-muted;
  margin-top: 16px;
  text-align: center;
}
</style>
