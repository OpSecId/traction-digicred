<template>
  <div class="marketplace-app">
    <header class="marketplace-header">
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
          <button
            class="burger-btn"
            aria-label="Open menu"
            @click="menuOpen = !menuOpen"
          >
            <i class="pi pi-bars"></i>
          </button>
        </div>
      </div>
    </header>

    <div
      v-if="menuOpen"
      class="burger-overlay"
      aria-hidden="true"
      @click="menuOpen = false"
    />
    <nav class="burger-menu" :class="{ open: menuOpen }">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="burger-menu-item"
        :class="{ active: isActive(item.nav) }"
        @click="menuOpen = false"
      >
        <i :class="['pi', item.icon, 'burger-icon']"></i>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

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
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { isMobile } from '@/utils/isMobile';
import { useRouteLoading } from '@/composables/useRouteLoading';
import AppFooter from './AppFooter.vue';
import { getAppIconUrl } from '@/services/configService';

const headerLogoUrl = getAppIconUrl();
const { isPending } = useRouteLoading();

const route = useRoute();
const menuOpen = ref(false);

const showFooter = computed(() => !route.path.startsWith('/tenant'));

const navItems = computed(() => {
  const items = [
    { path: '/tenant', label: 'Marketplace', icon: 'pi-briefcase', nav: 'tenant' },
    { path: '/reservation/check', label: 'Check reservation', icon: 'pi-search', nav: 'reservation' },
    { path: '/innkeeper', label: 'Innkeeper', icon: 'pi-cog', nav: 'innkeeper' },
  ];
  if (isMobile()) {
    items.unshift({ path: '/channel', label: 'Browse', icon: 'pi-compass', nav: 'channel' } as typeof items[0]);
  }
  return items;
});

function isActive(nav: string) {
  if (nav === 'landing') return route.path === '/';
  if (nav === 'channel') return route.path === '/channel' || route.path === '/connect' || route.path.startsWith('/scholarships') || route.path.startsWith('/services') || route.path.startsWith('/education') || route.path.startsWith('/job/');
  if (nav === 'tenant') return route.path.startsWith('/tenant');
  if (nav === 'innkeeper') return route.path.startsWith('/innkeeper');
  if (nav === 'reservation') return route.path.startsWith('/reservation');
  return false;
}
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
      display: none; /* Icon only on very small screens */
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

.burger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: $marketplace-text-on-primary;
  font-size: 1.35rem;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
  }

  &:active {
    background: rgba(255, 255, 255, 0.22);
  }
}

.burger-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1100;
  animation: fadeIn 0.2s ease;
}

.burger-menu {
  position: fixed;
  top: 0;
  right: 0;
  width: 260px;
  max-width: 85vw;
  height: 100%;
  background: $marketplace-bg-card;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 1200;
  padding: calc(60px + env(safe-area-inset-top, 0)) 0 env(safe-area-inset-bottom, 0);
  transform: translateX(100%);
  transition: transform 0.25s ease;
  overflow-y: auto;

  &.open {
    transform: translateX(0);
  }
}

.burger-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  font-size: 1rem;
  font-weight: 500;
  color: $marketplace-text;
  text-decoration: none;
  border-bottom: 1px solid $marketplace-panel-border;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(0, 51, 102, 0.06);
    color: $marketplace-primary;
  }

  &.active {
    background: rgba(0, 51, 102, 0.08);
    color: $marketplace-primary;
  }

  .burger-icon {
    font-size: 1.25rem;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
