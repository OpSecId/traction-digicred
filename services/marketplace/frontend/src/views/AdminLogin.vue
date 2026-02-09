<template>
  <LoginLayout
    variant="admin"
    brand-badge="Admin"
    brand-badge-icon="pi-shield"
    brand-title="Innkeeper's Desk"
    brand-tagline="Credential marketplace administration"
    :brand-features="['Review tenant reservations', 'Manage trust registry', 'Orchestrate credential workflows']"
  >
    <div class="login-form-header">
      <h2>Sign in</h2>
      <p>Enter your Innkeeper's Desk credentials</p>
    </div>
    <form class="login-form" @submit.prevent="handleLogin" @keydown.enter.prevent="handleLogin">
      <div class="login-form-field">
        <label for="admin-email">Email</label>
        <input
          id="admin-email"
          v-model="loginEmail"
          type="email"
          required
          placeholder="admin@example.com"
          autocomplete="email"
        />
      </div>
      <div class="login-form-field">
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
    <router-link to="/" class="login-back-link">
      <i class="pi pi-arrow-left"></i>
      Back to marketplace
    </router-link>
  </LoginLayout>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LoginLayout from '@/components/LoginLayout.vue';
import { useAdminStore } from '@/store/adminStore';
import { innkeeperLogin } from '@/api/auth';
import { getApiErrorMessage } from '@/utils/apiError';

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();
const loginEmail = ref('');
const loginPassword = ref('');
const loggingIn = ref(false);
const loginError = ref('');

watch(
  () => adminStore.isAdmin,
  (isAdmin) => {
    if (isAdmin) {
      const redirect = (route.query.redirect as string) || '/innkeeper';
      router.replace(redirect);
    }
  },
  { immediate: true }
);

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
    loginError.value = getApiErrorMessage(err, {
      fallback: 'Sign in failed.',
      unauthMessage: 'Invalid email or password',
    });
  } finally {
    loggingIn.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/page-common.scss';
</style>
