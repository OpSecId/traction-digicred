<template>
  <div class="admin-login">
    <div class="login-hero">
      <i class="pi pi-cog login-icon"></i>
      <h1>Innkeeper</h1>
      <p>Sign in to manage tenant onboarding requests</p>
    </div>

    <div class="marketplace-card login-card">
      <h3 class="login-title">Innkeeper sign in</h3>
      <form class="login-form" @submit.prevent="handleLogin" @keydown.enter.prevent="handleLogin">
        <div class="form-field">
          <label for="admin-email">Email</label>
          <input
            id="admin-email"
            v-model="loginEmail"
            type="text"
            required
            placeholder="admin"
            autocomplete="email"
          />
        </div>
        <div class="form-field">
          <label for="admin-password">Password</label>
          <input
            id="admin-password"
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
      <router-link to="/" class="back-link">
        <i class="pi pi-arrow-left"></i>
        Back to home
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminStore } from '@/store/adminStore';
import { innkeeperLogin } from '@/api/auth';

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();
const loginEmail = ref('');
const loginPassword = ref('');
const loggingIn = ref(false);
const loginError = ref('');

onMounted(() => {
  if (adminStore.isAdmin) {
    router.replace('/innkeeper');
  }
});

async function handleLogin() {
  loginError.value = '';
  loggingIn.value = true;
  try {
    const result = await innkeeperLogin(loginEmail.value.trim(), loginPassword.value);
    if (!result?.success) throw new Error('Login failed');
    adminStore.setLoggedIn(true);
    await nextTick();
    const redirect = (route.query.redirect as string) || '/innkeeper';
    await router.replace(redirect);
  } catch (err: unknown) {
    console.error('[InnkeeperLogin] Error:', err);
    const ax = err && typeof err === 'object' ? (err as { response?: { status?: number; data?: { error?: string } }; message?: string }) : null;
    const status = ax?.response?.status;
    const backendError = ax?.response?.data?.error;
    const isServerUnavailable =
      !ax?.response ||
      ax?.message === 'Network Error' ||
      (status && status >= 500) ||
      status === 502 ||
      status === 503 ||
      status === 504;
    const msg =
      status === 401
        ? 'Invalid email or password'
        : backendError
          ? backendError
          : isServerUnavailable
            ? 'Sign in failed. Is the server running? Run: npm run dev'
            : 'Sign in failed.';
    loginError.value = msg;
  } finally {
    loggingIn.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.admin-login {
  padding: 24px 16px;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media (min-width: $breakpoint-desktop) {
    padding: 48px 24px;
  }
}

.login-hero {
  text-align: center;
  margin-bottom: 32px;

  .login-icon {
    font-size: 3rem;
    color: $marketplace-primary;
    margin-bottom: 16px;
    opacity: 0.9;
  }

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

.login-card {
  padding: 28px;
  max-width: 400px;
  width: 100%;

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
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 6px;
      color: $marketplace-text;
    }

    input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid $marketplace-panel-border;
      border-radius: 10px;
      font-size: 1rem;
      box-sizing: border-box;
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

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &.primary {
    background: $marketplace-primary;
    color: $marketplace-text-on-primary;
  }

  &:hover:not(:disabled) {
    opacity: 0.95;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $marketplace-primary;
  }
}
</style>
