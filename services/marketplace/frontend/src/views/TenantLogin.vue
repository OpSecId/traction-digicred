<template>
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
  <LoginLayout
    brand-badge="Tenant"
    brand-badge-icon="pi-building"
    brand-title="Marketplace Hub"
    brand-tagline="Manage your publications and applicants"
    :brand-features="['Publish jobs and opportunities', 'Review applicants with verified credentials', 'Track workflows and outcomes']"
  >
    <div class="login-form-header">
      <h2>Sign in</h2>
      <p>Enter your Marketplace Hub credentials</p>
    </div>
    <form class="login-form" @submit.prevent="handleLogin" @keydown.enter.prevent="handleLogin">
      <div class="login-form-field">
        <label for="tenant-email">Email</label>
        <input
          id="tenant-email"
          v-model="loginEmail"
          type="email"
          required
          placeholder="you@company.com"
          autocomplete="email"
        />
      </div>
      <div class="login-form-field">
        <label for="tenant-api-key">API key</label>
        <input
          id="tenant-api-key"
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
    <div class="login-form-footnote">
      <p>
        Don't have an account?
        <router-link to="/tenant/onboard">Request tenancy</router-link>
      </p>
      <p>
        <router-link to="/reservation/check">Check reservation status</router-link>
      </p>
    </div>
    <router-link to="/" class="login-back-link">
      <i class="pi pi-arrow-left"></i>
      Back to marketplace
    </router-link>
  </LoginLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LoginLayout from '@/components/LoginLayout.vue';
import { useEmployerStore } from '@/store/employerStore';
import { tenantLogin } from '@/api/auth';
import { getApiErrorMessage } from '@/utils/apiError';

const route = useRoute();
const router = useRouter();
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
  router.replace({ path: '/tenant/login', query: {} });
}

watch(
  () => employerStore.isEmployer,
  (isEmployer) => {
    if (isEmployer) {
      const redirect = (route.query.redirect as string) || '/tenant';
      router.replace(redirect);
    }
  },
  { immediate: true }
);

async function handleLogin() {
  loginError.value = '';
  loggingIn.value = true;
  const email = loginEmail.value.trim();
  const apiKey = loginPassword.value;
  try {
    const { employerId } = await tenantLogin(email, apiKey);
    employerStore.setEmployer(employerId);
    await nextTick();
    const redirect = (route.query.redirect as string) || '/tenant';
    await router.replace(redirect);
  } catch (err: unknown) {
    console.error('[TenantLogin] Error:', err);
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
@use '@/assets/page-common.scss';
@use '@/assets/variables.scss' as *;

.login-form-footnote {
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  margin: 20px 0 0 0;

  p {
    margin: 0 0 6px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }

  a {
    font-weight: 500;
    color: $marketplace-primary;
    text-decoration: none;

    &:hover {
      color: $marketplace-secondary;
      text-decoration: underline;
    }
  }

  @media (min-width: 900px) {
    margin-top: 24px;
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
</style>
