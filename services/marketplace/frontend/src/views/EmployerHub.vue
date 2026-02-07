<template>
  <div class="employer-hub">
    <div class="hub-hero">
      <h1>Marketplace Tenants Hub</h1>
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

    <div v-if="employerStore.isEmployer" class="employer-dashboard">
      <div class="marketplace-card employer-profile-card">
        <div class="profile-card-header">
          <i class="pi pi-building"></i>
          <span>Employer account</span>
        </div>
        <div class="profile-card-body">
          <div class="profile-name">{{ profileName }}</div>
          <div v-if="profileEmail" class="profile-detail">
            <i class="pi pi-envelope"></i>
            <a :href="`mailto:${profileEmail}`">{{ profileEmail }}</a>
          </div>
          <div v-if="profileIndustry" class="profile-detail">
            <i class="pi pi-briefcase"></i>
            {{ profileIndustry }}
          </div>
          <div v-if="profileWebsite" class="profile-detail">
            <i class="pi pi-globe"></i>
            <a :href="profileWebsite" target="_blank" rel="noopener noreferrer">{{ profileWebsite }}</a>
          </div>
          <p class="profile-meta">{{ jobCount }} job posting(s)</p>
        </div>
        <div class="employer-actions">
          <router-link to="/tenant/jobs" class="action-btn primary">
            <i class="pi pi-list"></i>
            Manage Jobs
          </router-link>
          <router-link to="/tenant/workflows" class="action-btn primary">
            <i class="pi pi-sitemap"></i>
            Manage workflows
          </router-link>
          <button class="action-btn secondary" @click="employerStore.clearEmployer()">
            Sign out
          </button>
        </div>
      </div>
    </div>

    <div v-else class="sign-in-section">
      <div class="marketplace-card login-card">
        <h4 class="login-title">Sign in</h4>
        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-field">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              v-model="loginEmail"
              type="email"
              required
              placeholder="hr@pizzautopia.com"
              autocomplete="email"
            />
          </div>
          <div class="form-field">
            <label for="login-password">Password</label>
            <input
              id="login-password"
              v-model="loginPassword"
              type="password"
              required
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>
          <p v-if="loginError" class="login-error">{{ loginError }}</p>
          <button type="submit" class="action-btn primary" :disabled="loggingIn">
            <i v-if="!loggingIn" class="pi pi-sign-in"></i>
            <i v-else class="pi pi-spin pi-spinner"></i>
            {{ loggingIn ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
        <p class="login-hint">Demo: hr@pizzautopia.com, hr@loc.gov / password: demo123</p>
        <p class="request-tenancy-prompt">
          Don't have an account?
          <router-link to="/tenant/onboard" class="request-tenancy-link">Request tenancy</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDemoStore } from '@/store/demoStore';
import { useEmployerStore } from '@/store/employerStore';
import { employerLogin } from '@/api/auth';
import { getEmployerProfile, listJobPostings, profileSubjectFromCredential } from '@/api/employerJobs';

const route = useRoute();
const router = useRouter();
const demoStore = useDemoStore();
const employerStore = useEmployerStore();

const loginEmail = ref('');
const loginPassword = ref('');
const loggingIn = ref(false);
const loginError = ref('');
const copyFeedback = ref(false);

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

const currentEmployer = computed(() => {
  if (!employerStore.currentEmployerId) return null;
  return demoStore.getEmployerById(employerStore.currentEmployerId);
});

const jobCount = computed(() => {
  if (!employerStore.currentEmployerId) return 0;
  const demoJobs = demoStore.getJobsByEmployer(employerStore.currentEmployerId).length;
  return demoJobs + apiJobCount.value;
});

const employerProfile = ref<Awaited<ReturnType<typeof getEmployerProfile>>>(null);
const apiJobCount = ref(0);

const subject = computed(() => profileSubjectFromCredential(employerProfile.value));

const profileName = computed(() => {
  const name = subject.value.name as string | undefined;
  if (name) return name;
  return currentEmployer.value?.name ?? 'Employer';
});

const profileEmail = computed(() => subject.value.email as string | undefined);
const profileIndustry = computed(() => subject.value.industry as string | undefined);
const profileWebsite = computed(() => (subject.value.url as string) || (subject.value.website as string) || undefined);

watch(
  () => employerStore.currentEmployerId,
  async (id) => {
    if (!id) {
      employerProfile.value = null;
      apiJobCount.value = 0;
      return;
    }
    try {
      const [profile, jobs] = await Promise.all([
        getEmployerProfile(id),
        listJobPostings(id),
      ]);
      employerProfile.value = profile;
      apiJobCount.value = jobs.length;
    } catch {
      employerProfile.value = null;
      apiJobCount.value = 0;
    }
  },
  { immediate: true }
);

async function handleLogin() {
  loginError.value = '';
  loggingIn.value = true;
  try {
    const { employerId } = await employerLogin(loginEmail.value.trim(), loginPassword.value);
    employerStore.setEmployer(employerId);
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number; data?: { error?: string } } }).response?.status === 401
          ? 'Invalid email or password'
          : 'Sign in failed. Is the server running?'
        : 'Sign in failed.';
    loginError.value = msg;
  } finally {
    loggingIn.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.employer-hub {
  padding: 16px 20px 32px;
  max-width: 480px;
  margin: 0 auto;

  @media (min-width: $breakpoint-desktop) {
    padding: 24px 32px 48px;
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

.employer-profile-card {
  padding: 20px;
  margin-bottom: 16px;

  .profile-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
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
  }

  .profile-card-body {
    margin-bottom: 20px;

    .profile-name {
      font-size: 1.2rem;
      font-weight: 600;
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

    .profile-meta {
      font-size: 0.9rem;
      color: $marketplace-text-muted;
      margin: 12px 0 0 0;
    }
  }

  .employer-actions {
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

.sign-in-section {
  width: 100%;
}

.login-card {
  padding: 24px;
  margin-bottom: 0;

  .login-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0 0 20px 0;
  }
}

.login-form {
  .form-field {
    margin-bottom: 16px;

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 6px;
      color: $marketplace-text;
    }

    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid $marketplace-panel-border;
      border-radius: 8px;
      font-size: 0.95rem;
      box-sizing: border-box;
      background: $marketplace-bg-card;
      transition: border-color 0.2s, box-shadow 0.15s;

      &:focus {
        outline: none;
        border-color: $marketplace-primary;
        box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
      }
    }
  }

  .login-error {
    color: $marketplace-danger;
    font-size: 0.9rem;
    margin: 0 0 12px 0;
  }

  button {
    width: 100%;
    margin-top: 8px;
    padding: 12px 20px;
    border-radius: 8px;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.login-hint {
  font-size: 0.8rem;
  color: $marketplace-text-muted;
  margin: 12px 0 0 0;
}

.request-tenancy-prompt {
  margin: 20px 0 0 0;
  padding-top: 20px;
  border-top: 1px solid $marketplace-panel-border;
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  text-align: center;
}

.request-tenancy-link {
  font-weight: 500;
  color: $marketplace-primary;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;

  &:hover {
    color: $marketplace-secondary;
    text-decoration: underline;
  }
}
</style>
