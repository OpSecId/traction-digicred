<template>
  <div class="marketplace-app">
    <header v-if="!isInnkeeperRoute" class="marketplace-header">
      <div class="marketplace-header-inner">
        <div class="marketplace-header-title">
          <router-link to="/" class="header-logo-link">
            <img :src="headerLogoUrl" alt="" class="header-logo" />
            <span class="header-brand">Apply Utopia</span>
          </router-link>
        </div>
        <div class="header-actions">
          <router-link to="/tenant" class="header-sign-in">
            <i class="pi pi-user"></i>
            <span>Sign in</span>
          </router-link>
        </div>
      </div>
    </header>

    <main class="marketplace-content">
      <div class="marketplace-content-inner">
        <router-view v-slot="{ Component }">
          <template v-if="isPending">
            <div class="loading-placeholder">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
              <p>Loading...</p>
            </div>
          </template>
          <component v-else-if="Component" :is="Component" />
        </router-view>
      </div>
    </main>

    <AppFooter v-if="showFooter" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useRouteLoading } from '@/composables/useRouteLoading';
import AppFooter from './AppFooter.vue';
import { getAppIconUrl } from '@/services/configService';

const headerLogoUrl = getAppIconUrl();
const { isPending } = useRouteLoading();

const route = useRoute();

const isInnkeeperRoute = computed(() => route.path.startsWith('/innkeeper'));

const showFooter = computed(() => {
  const p = route.path;
  if (isInnkeeperRoute.value) return false;
  return (
    p === '/tenant' ||
    p === '/tenant/onboard' ||
    p === '/holder' ||
    !p.startsWith('/tenant')
  );
});
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-sign-in {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 600;
  color: $marketplace-text-on-primary;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 360px) {
    padding: 8px 10px;

    span {
      display: none;
    }
  }
}

.header-logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.header-logo {
  height: 28px;
  width: auto;
  filter: brightness(0) invert(1);
}

.header-brand {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: white;
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--marketplace-text-muted);
}

</style>
