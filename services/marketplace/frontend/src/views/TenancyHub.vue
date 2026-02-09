<template>
  <div class="tenancy-hub" :class="{ 'tenancy-hub--login': !employerStore.isEmployer }">
    <div v-if="employerStore.isEmployer" class="hub-hero">
      <h1>Marketplace Hub</h1>
      <p>Manage your publications and applicants</p>
    </div>

    <div v-if="submittedRef" class="modal-overlay" @click.self="closeConfirmationModal">
      <div class="confirmation-modal">
        <i class="pi pi-check-circle confirmation-icon"></i>
        <h3>Request submitted</h3>
        <p>Your request has been received and is under review.</p>
        <div class="reference-id-field">
          <code class="reference-id">{{ submittedRef }}</code>
          <button
            type="button"
            class="copy-icon-btn"
            :class="{ copied: copyFeedback }"
            :title="copyFeedback ? 'Copied!' : 'Copy to clipboard'"
            aria-label="Copy to clipboard"
            @click="copyReferenceId"
          >
            <i :class="copyFeedback ? 'pi pi-check' : 'pi pi-copy'"></i>
          </button>
        </div>
        <p class="reference-hint">Save this ID to follow up on your request.</p>
        <button type="button" class="modal-done-btn" @click="closeConfirmationModal">
          Done
        </button>
      </div>
    </div>

    <div v-if="employerStore.isEmployer" class="tenancy-dashboard">
      <!-- Profile card (prominent, at top) -->
      <div class="marketplace-card tenancy-profile-card profile-card-hero">
        <div class="profile-card-header">
          <i class="pi pi-building"></i>
          <span>My Profile</span>
          <button
            type="button"
            class="view-profile-btn"
            :disabled="!employerProfile?.credential"
            @click="showProfileModal = true"
          >
            <i class="pi pi-eye"></i>
            View credential
          </button>
        </div>
        <div class="profile-card-body">
          <div class="profile-name">{{ profileName }}</div>
          <div v-if="profileIndustry" class="profile-detail">
            <i class="pi pi-briefcase"></i>
            {{ profileIndustry }}
          </div>
        </div>

        <div class="contact-section">
          <h4 class="contact-section-title"><i class="pi pi-user"></i> Contact information</h4>
          <dl class="contact-list">
            <div v-if="profileEmail" class="contact-row">
              <dt>Email</dt>
              <dd><a :href="`mailto:${profileEmail}`">{{ profileEmail }}</a></dd>
            </div>
            <div v-if="profileWebsite" class="contact-row">
              <dt>Website</dt>
              <dd><a :href="profileWebsite" target="_blank" rel="noopener noreferrer">{{ profileWebsite }}</a></dd>
            </div>
            <div v-if="!profileEmail && !profileWebsite" class="contact-row contact-row-empty">
              <dd class="contact-empty">No contact details on file</dd>
            </div>
          </dl>
          <router-link to="/reservation/check" class="request-update-link">
            <i class="pi pi-pencil"></i>
            Request profile update
          </router-link>
        </div>

        <div class="tenancy-actions">
          <router-link to="/tenant/jobs" class="action-btn primary">
            <i class="pi pi-list"></i>
            Manage Jobs
          </router-link>
          <router-link to="/tenant/workflows" class="action-btn primary">
            <i class="pi pi-sitemap"></i>
            Manage workflows
          </router-link>
          <button class="action-btn secondary" @click="handleSignOut">
            Sign out
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <i class="pi pi-briefcase stat-icon"></i>
          <span class="stat-value">{{ jobCount }}</span>
          <span class="stat-label">Job postings</span>
        </div>
        <div class="stat-card">
          <i class="pi pi-sitemap stat-icon"></i>
          <span class="stat-value">{{ workflowStats.running }}</span>
          <span class="stat-label">Workflows in progress</span>
        </div>
        <div class="stat-card">
          <i class="pi pi-check-circle stat-icon"></i>
          <span class="stat-value">{{ workflowStats.completed }}</span>
          <span class="stat-label">Workflows completed</span>
        </div>
      </div>
    </div>

    <DetailModalCard
      v-if="showProfileModal"
      title="My Profile Credential"
      :credential="employerProfile?.credential ?? null"
      credential-title="MarketplaceProfileCredential"
      @close="showProfileModal = false"
    >
      <template #details>
        <div class="profile-modal-details">
          <dl class="profile-dl">
            <dt>Organization</dt>
            <dd>{{ profileName }}</dd>
            <dt v-if="profileIndustry">Industry</dt>
            <dd v-if="profileIndustry">{{ profileIndustry }}</dd>
            <dt v-if="profileEmail">Email</dt>
            <dd v-if="profileEmail"><a :href="`mailto:${profileEmail}`">{{ profileEmail }}</a></dd>
            <dt v-if="profileWebsite">Website</dt>
            <dd v-if="profileWebsite"><a :href="profileWebsite" target="_blank" rel="noopener noreferrer">{{ profileWebsite }}</a></dd>
          </dl>
        </div>
      </template>
    </DetailModalCard>

    <LoginLayout
      v-if="!employerStore.isEmployer"
      brand-badge="Tenant"
      brand-badge-icon="pi-building"
      brand-title="Marketplace Hub"
      brand-tagline="Manage your publications and applicants"
      :brand-features="['Publish jobs and opportunities', 'Review applicants with verified credentials', 'Track workflows and outcomes']"
    >
      <div class="login-form-header">
        <h2>Sign in</h2>
        <p>Enter your tenant email and API key from your approval email</p>
      </div>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="login-form-field">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            v-model="loginEmail"
            type="email"
            required
            placeholder="you@company.com"
            autocomplete="email"
          />
        </div>
        <div class="login-form-field">
          <label for="login-api-key">API key</label>
          <input
            id="login-api-key"
            v-model="loginPassword"
            type="password"
            required
            placeholder="Paste API key from approval email"
            autocomplete="off"
          />
        </div>
        <p v-if="loginError" class="login-form-error">
          <i class="pi pi-exclamation-circle"></i>
          {{ loginError }}
        </p>
        <button type="submit" class="login-submit-btn" :disabled="loggingIn">
          <i v-if="!loggingIn" class="pi pi-sign-in"></i>
          <i v-else class="pi pi-spin pi-spinner"></i>
          {{ loggingIn ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
      <div class="login-form-footer">
        <p>
          Don't have an account?
          <router-link to="/tenant/onboard">Request tenancy</router-link>
        </p>
        <router-link to="/reservation/check" class="secondary">
          <i class="pi pi-search"></i>
          Check reservation status
        </router-link>
      </div>
      <router-link to="/" class="login-back-link">
        <i class="pi pi-arrow-left"></i>
        Back to marketplace
      </router-link>
    </LoginLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LoginLayout from '@/components/LoginLayout.vue';
import DetailModalCard from '@/components/DetailModalCard.vue';
import { useEmployerStore } from '@/store/employerStore';
import { tenantLogin, tenantLogout } from '@/api/auth';
import { getEmployerProfile, listJobPostings, listEmployerWorkflows, profileSubjectFromCredential, emailFromSubject } from '@/api/employerJobs';
import { getApiErrorMessage } from '@/utils/apiError';

const route = useRoute();
const router = useRouter();
const employerStore = useEmployerStore();

const loginEmail = ref('');
const loginPassword = ref('');
const loggingIn = ref(false);
const loginError = ref('');
const copyFeedback = ref(false);
const showProfileModal = ref(false);

const submittedRef = computed(() => {
  if (route.query.onboarded === '1' && route.query.ref) {
    return String(route.query.ref);
  }
  return null;
});

async function copyReferenceId() {
  if (!submittedRef.value) return;
  try {
    await navigator.clipboard.writeText(submittedRef.value);
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 2000);
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = submittedRef.value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 2000);
  }
}

function closeConfirmationModal() {
  router.replace({ path: '/tenant', query: {} });
}

const jobCount = computed(() => apiJobCount.value);

const employerProfile = ref<Awaited<ReturnType<typeof getEmployerProfile>>>(null);
const apiJobCount = ref(0);
const workflows = ref<Awaited<ReturnType<typeof listEmployerWorkflows>>>([]);

const subject = computed(() => profileSubjectFromCredential(employerProfile.value));

const profileName = computed(() => {
  const name = subject.value.name as string | undefined;
  return name ?? 'Employer';
});

const profileEmail = computed(() => emailFromSubject(subject.value));
const profileIndustry = computed(() => subject.value.industry as string | undefined);
const profileWebsite = computed(() => (subject.value.url as string) || (subject.value.website as string) || undefined);

const workflowStats = computed(() => {
  const list = workflows.value;
  return {
    running: list.filter((w) => w.status === 'running').length,
    completed: list.filter((w) => w.status === 'completed').length,
  };
});

watch(
  () => employerStore.currentEmployerId,
  async (id) => {
    if (!id) {
      employerProfile.value = null;
      apiJobCount.value = 0;
      workflows.value = [];
      return;
    }
    try {
      const [profile, jobsList, workflowsList] = await Promise.all([
        getEmployerProfile(id),
        listJobPostings(id),
        listEmployerWorkflows(id),
      ]);
      employerProfile.value = profile;
      apiJobCount.value = jobsList.length;
      workflows.value = workflowsList;
    } catch {
      employerProfile.value = null;
      apiJobCount.value = 0;
      workflows.value = [];
    }
  },
  { immediate: true }
);

async function handleSignOut() {
  try {
    await tenantLogout();
  } catch {
    // Ignore - clear local state anyway
  }
  employerStore.clearEmployer();
}

async function handleLogin() {
  loginError.value = '';
  loggingIn.value = true;
  const email = loginEmail.value.trim();
  const apiKey = loginPassword.value;
  try {
    const { employerId } = await tenantLogin(email, apiKey);
    employerStore.setEmployer(employerId);
  } catch (err: unknown) {
    loginError.value = getApiErrorMessage(err, {
      fallback: 'Sign in failed.',
      unauthMessage: 'Invalid email or API key',
    });
  } finally {
    loggingIn.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;
@use '@/assets/page-common.scss';

.tenancy-hub {
  padding: 16px 20px 32px;
  max-width: 720px;
  margin: 0 auto;

  @media (min-width: $breakpoint-desktop) {
    padding: 24px 32px 48px;
  }

  &.tenancy-hub--login {
    width: 100%;
    max-width: none;
    padding: 0;
    margin: 0;
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.tenancy-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: $marketplace-bg-card;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 51, 102, 0.06);
  border: 1px solid $marketplace-panel-border;

  .stat-icon {
    font-size: 1.5rem;
    color: $marketplace-primary;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: $marketplace-primary;
  }

  .stat-label {
    font-size: 0.75rem;
    color: $marketplace-text-muted;
    text-align: center;
    line-height: 1.2;
  }
}

.hub-hero {
  margin-bottom: 24px;

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 1rem;
    color: $marketplace-text-muted;
    margin: 0;
  }
}

.tenancy-profile-card {
  padding: 20px;
  margin-bottom: 16px;

  &.profile-card-hero {
    padding: 24px 28px;
    border: 2px solid rgba(0, 51, 102, 0.12);
    box-shadow: 0 4px 20px rgba(0, 51, 102, 0.08);
    background: linear-gradient(to bottom, rgba(0, 51, 102, 0.02), transparent);
  }

  .profile-card-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $marketplace-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 12px;

    i {
      font-size: 1rem;
      color: $marketplace-primary;
    }

    .view-profile-btn {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      color: $marketplace-primary;
      background: rgba(0, 51, 102, 0.08);
      border: 1px solid rgba(0, 51, 102, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;

      &:hover:not(:disabled) {
        background: rgba(0, 51, 102, 0.14);
        color: $marketplace-secondary;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .profile-card-body {
    margin-bottom: 20px;

    .profile-name {
      font-size: 1.35rem;
      font-weight: 700;
      color: $marketplace-primary;
      margin-bottom: 8px;
    }

    .profile-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: $marketplace-text;
      margin-bottom: 4px;

      i {
        color: $marketplace-text-muted;
        width: 16px;
        flex-shrink: 0;
      }

      a {
        color: $marketplace-primary;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

  }

  .contact-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid $marketplace-panel-border;
  }

  .contact-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: $marketplace-text-muted;
    margin: 0 0 12px 0;

    i {
      color: $marketplace-primary;
    }
  }

  .contact-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
  }

  .contact-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin: 0;

    dt {
      flex-shrink: 0;
      width: 70px;
      font-size: 0.85rem;
      font-weight: 500;
      color: $marketplace-text-muted;
      margin: 0;
    }

    dd {
      margin: 0;
      font-size: 0.9rem;

      a {
        color: $marketplace-primary;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .contact-row-empty dd {
    flex: 1;
  }

  .contact-empty {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    font-style: italic;
  }

  .request-update-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 8px 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: $marketplace-primary;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $marketplace-secondary;
      text-decoration: underline;
    }
  }

  .tenancy-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;

  &.primary {
    background: $marketplace-primary;
    color: $marketplace-text-on-primary;
  }

  &.secondary {
    background: transparent;
    color: $marketplace-text-muted;
    border: 1px solid $marketplace-panel-border;
    margin-top: 8px;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

.confirmation-modal {
  background: white;
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  .confirmation-icon {
    font-size: 2.5rem;
    color: $marketplace-success;
    margin-bottom: 12px;
  }

  h3 {
    font-size: 1.25rem;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 0.95rem;
    color: $marketplace-text-muted;
    margin: 0 0 12px 0;
  }

  .reference-id-field {
    display: flex;
    align-items: center;
    margin: 16px 0 8px 0;
    background: $marketplace-panel-border;
    border-radius: 10px;
    border: 1px solid rgba(0, 51, 102, 0.12);
    overflow: hidden;
  }

  .reference-id {
    flex: 1;
    padding: 12px 14px;
    font-family: monospace;
    font-weight: 600;
    color: $marketplace-primary;
    font-size: 1rem;
    border: none;
    background: transparent;
    min-width: 0;
  }

  .copy-icon-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-left: 1px solid rgba(0, 51, 102, 0.12);
    background: transparent;
    color: $marketplace-text-muted;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    i {
      font-size: 1.1rem;
    }

    &:hover {
      background: rgba(0, 51, 102, 0.06);
      color: $marketplace-primary;
    }

    &.copied {
      color: $marketplace-success;
      background: rgba(51, 108, 55, 0.08);
    }
  }

  .reference-hint {
    font-size: 0.85rem;
    color: $marketplace-text-muted;
    font-style: italic;
    margin-bottom: 20px;
  }

  .modal-done-btn {
    width: 100%;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: $marketplace-primary;
    color: $marketplace-text-on-primary;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.profile-modal-details {
  padding: 8px 0;
}

.profile-dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 24px;
  margin: 0;

  dt {
    font-weight: 600;
    color: $marketplace-text-muted;
    margin: 0;
  }

  dd {
    margin: 0;

    a {
      color: $marketplace-primary;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
