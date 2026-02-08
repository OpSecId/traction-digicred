<template>
  <div class="channel-layout">
    <!-- Minimal header: logo + search + category icons -->
    <header class="channel-header">
      <router-link to="/channel" class="channel-logo-link">
        <img :src="headerLogoUrl" alt="" class="channel-logo" />
        <span class="channel-brand">Apply Utopia</span>
      </router-link>
      <div v-if="showSearch" class="channel-search">
        <i class="pi pi-search"></i>
        <input
          id="channel-search"
          :value="searchQuery"
          type="search"
          name="q"
          placeholder="Search"
          class="channel-search-input"
          @input="onSearchInput"
        />
      </div>
    </header>

    <!-- Main content -->
    <main class="channel-main">
      <router-view v-slot="{ Component }">
        <template v-if="isPending">
          <div class="loading-placeholder">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Loading...</p>
          </div>
        </template>
        <component v-else-if="Component" :is="Component" />
      </router-view>
    </main>

    <!-- Bottom tab bar (Uber Eats style) — floating round icon buttons -->
    <nav v-if="!isJobDetail" class="channel-bottom-nav">
      <router-link
        v-for="item in bottomTabs"
        :key="item.path"
        :to="item.path"
        class="nav-tab"
        :class="{ active: isTabActive(item) }"
      >
        <span class="nav-tab-icon-wrap">
          <i :class="['pi', item.icon, 'nav-icon']"></i>
        </span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRouteLoading } from '@/composables/useRouteLoading';
import { getAppIconUrl } from '@/services/configService';

const headerLogoUrl = getAppIconUrl();
const { isPending } = useRouteLoading();
const route = useRoute();
const router = useRouter();

const showSearch = computed(() => {
  const p = route.path;
  return p === '/channel' || p === '/connect' || p.startsWith('/scholarships') || p.startsWith('/services') || p.startsWith('/education');
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

const bottomTabs = [
  { path: '/channel', label: 'Jobs', icon: 'pi-briefcase' },
  { path: '/scholarships', label: 'Scholarships', icon: 'pi-gift' },
  { path: '/services', label: 'Services', icon: 'pi-wrench' },
  { path: '/education', label: 'Education', icon: 'pi-book' },
];

const isJobDetail = computed(() => route.path.startsWith('/job/'));

function isTabActive(item: { path: string }) {
  if (item.path === '/channel') {
    return route.path === '/channel' || route.path === '/connect';
  }
  return route.path.startsWith(item.path);
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.channel-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: $marketplace-bg;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.channel-header {
  flex-shrink: 0;
  padding: 14px 16px 16px;
  background: linear-gradient(135deg, $marketplace-primary 0%, $marketplace-secondary 100%);
  box-shadow: 0 2px 12px rgba(0, 51, 102, 0.15);
}

.channel-logo-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.channel-logo {
  height: 26px;
  width: auto;
  filter: brightness(0) invert(1);
}

.channel-brand {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: white;
}

.channel-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;

  i {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
  }
}

.channel-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: white;
  font-size: 0.95rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
}

.channel-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 90px; /* Space for floating bottom nav */
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: $marketplace-text-muted;

  i {
    font-size: 2rem;
    margin-bottom: 12px;
  }
}

.channel-bottom-nav {
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 4px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0));
  margin: 0 12px 12px;
  background: $marketplace-bg-card;
  border-radius: 28px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid $marketplace-panel-border;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  text-decoration: none;
  color: $marketplace-text-muted;
  font-size: 0.7rem;
  font-weight: 500;
  transition: color 0.2s, background 0.2s;
  border-radius: 24px;

  &:hover {
    color: $marketplace-primary;
  }

  &.active {
    color: $marketplace-primary;

    .nav-tab-icon-wrap {
      background: rgba(0, 51, 102, 0.12);
      color: $marketplace-primary;
    }
  }

  .nav-tab-icon-wrap {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    color: $marketplace-text-muted;
    transition: background 0.2s, color 0.2s;
  }

  .nav-icon {
    font-size: 1.2rem;
  }
}
</style>
