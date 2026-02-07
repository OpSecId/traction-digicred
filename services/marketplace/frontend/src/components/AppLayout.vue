<template>
  <div class="marketplace-app" :class="{ 'has-floating-bar': showFloatingBar }">
    <header class="marketplace-header">
      <div class="marketplace-header-inner">
        <div class="marketplace-header-title">
          <router-link to="/" class="header-logo-link">
            <img
              :src="headerLogoUrl"
              alt="Apply Utopia"
              class="header-logo"
            />
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

    <!-- Floating bar: only on main category pages (not job details, employer) -->
    <div v-if="showFloatingBar" class="floating-bar">
      <div class="floating-bar-tabs">
        <router-link
          v-for="item in leftTabs"
          :key="item.path"
          :to="item.path"
          class="type-circle"
          :class="{ active: currentMarketplaceType === item.type }"
          :title="item.label"
        >
          <i :class="['pi', item.icon]"></i>
        </router-link>
      </div>
      <div class="floating-bar-search">
        <div class="search-bar">
          <i class="pi pi-search"></i>
          <input
            :value="searchQuery"
            type="text"
            placeholder="Search"
            class="search-input"
            @input="onSearchInput"
          />
        </div>
      </div>
      <div class="floating-bar-tabs">
        <router-link
          v-for="item in rightTabs"
          :key="item.path"
          :to="item.path"
          class="type-circle"
          :class="{ active: currentMarketplaceType === item.type }"
          :title="item.label"
        >
          <i :class="['pi', item.icon]"></i>
        </router-link>
      </div>
    </div>

    <main class="marketplace-content">
      <div class="marketplace-content-inner">
        <router-view v-slot="{ Component }">
          <Suspense>
            <component :is="Component" />
            <template #fallback>
              <div class="loading-placeholder">
                <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                <p>Loading...</p>
              </div>
            </template>
          </Suspense>
        </router-view>
      </div>
    </main>

    <AppFooter v-if="showFooter" />

    <router-link
      v-if="route.path !== '/reservation/check'"
      to="/reservation/check"
      class="fab-check-reservation"
      title="Check on a reservation"
      aria-label="Check on a reservation"
    >
      <i class="pi pi-search"></i>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppFooter from './AppFooter.vue';
import { getAppIconUrl } from '@/services/configService';

const headerLogoUrl = getAppIconUrl();

const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);

const leftTabs = [
  { path: '/channel', label: 'Jobs', icon: 'pi-briefcase', type: 'jobs' },
  { path: '/scholarships', label: 'Scholarships', icon: 'pi-gift', type: 'scholarships' },
];
const rightTabs = [
  { path: '/services', label: 'Services', icon: 'pi-wrench', type: 'services' },
  { path: '/education', label: 'Education', icon: 'pi-book', type: 'education' },
];

const showFloatingBar = computed(() => {
  const p = route.path;
  return p === '/channel' || p === '/scholarships' || p === '/services' || p === '/education';
});

const showFooter = computed(() => {
  const p = route.path;
  return !(p === '/channel' || p.startsWith('/scholarships') || p.startsWith('/services') || p.startsWith('/education') || p.startsWith('/job/'));
});

const currentMarketplaceType = computed(() => {
  const type = route.meta.marketplaceType as string | undefined;
  if (type) return type;
  if (route.path === '/channel') return 'jobs';
  if (route.path.startsWith('/scholarships')) return 'scholarships';
  if (route.path.startsWith('/services')) return 'services';
  if (route.path.startsWith('/education')) return 'education';
  return '';
});

const searchQuery = computed({
  get: () => (route.query.q as string) || '',
  set: (v: string) => {
    const query = { ...route.query };
    if (v.trim()) query.q = v.trim();
    else delete query.q;
    router.replace({ path: route.path, query });
  },
});

function onSearchInput(e: Event) {
  const target = e.target as HTMLInputElement;
  searchQuery.value = target.value;
}

const navItems = [
  { path: '/channel', label: 'Channel', icon: 'pi-compass', nav: 'channel' },
  { path: '/tenant', label: 'Marketplace', icon: 'pi-briefcase', nav: 'tenant' },
  { path: '/reservation/check', label: 'Check reservation', icon: 'pi-search', nav: 'reservation' },
  { path: '/innkeeper', label: 'Innkeeper', icon: 'pi-cog', nav: 'innkeeper' },
];

function isActive(nav: string) {
  if (nav === 'landing') return route.path === '/';
  if (nav === 'channel') return route.path === '/channel' || route.path.startsWith('/scholarships') || route.path.startsWith('/services') || route.path.startsWith('/education') || route.path.startsWith('/job/');
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
  gap: 6px;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: $marketplace-text-on-primary;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.8);
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
}

.header-logo {
  height: 32px;
  width: auto;
  filter: brightness(0) invert(1); /* white on primary blue header */
}

.burger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  color: $marketplace-text-on-primary;
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  &:active {
    background: rgba(255, 255, 255, 0.25);
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

/* Floating bar: type circles + search */
.floating-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 12px 16px 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0));
  background: $marketplace-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  @media (min-width: $breakpoint-desktop) {
    position: relative;
    bottom: auto;
    padding: 16px 24px;
    padding-bottom: 16px;
    margin: 0 auto;
    max-width: $content-max-width;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.floating-bar-tabs {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.type-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: $marketplace-bg-card;
  color: $marketplace-text-muted;
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: color 0.2s, background 0.2s, box-shadow 0.2s;

  i {
    font-size: 1.1rem;
  }

  &:hover {
    color: $marketplace-primary;
    box-shadow: 0 4px 16px rgba(0, 51, 102, 0.2);
  }

  &.active {
    color: $marketplace-text-on-primary;
    background: $marketplace-primary;
    box-shadow: 0 4px 16px rgba(0, 51, 102, 0.3);
  }
}

.floating-bar-search {
  flex: 1;
  min-width: 0; /* Allow flex shrink on mobile */
  max-width: 400px;
  overflow: hidden;
}

.floating-bar-search .search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  background: $marketplace-bg-card;
  border-radius: 24px;
  padding: 10px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid $marketplace-panel-border;
  transition: all 0.3s ease;
  box-sizing: border-box;

  i {
    color: $marketplace-text-muted;
    font-size: 1rem;
  }

  &:focus-within {
    border-color: $marketplace-primary;
    box-shadow: 0 6px 24px rgba(0, 51, 102, 0.2);
  }
}

.floating-bar-search .search-input {
  flex: 1;
  min-width: 0; /* Prevent input from forcing overflow */
  border: none;
  outline: none;
  font-size: 0.95rem;
  font-family: inherit;

  &::placeholder {
    color: $marketplace-text-muted;
  }
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--marketplace-text-muted);
}

/* Floating "Check on a reservation" icon */
.fab-check-reservation {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $marketplace-primary;
  color: white;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 51, 102, 0.35);
  z-index: 100;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;

  i {
    font-size: 1.2rem;
  }

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(0, 51, 102, 0.45);
  }
}
</style>
