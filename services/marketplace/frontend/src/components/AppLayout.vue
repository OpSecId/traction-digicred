<template>
  <div class="marketplace-app">
    <header class="marketplace-header">
      <div class="marketplace-header-title">
        <img
          src="/img/digicred/logo-marketplace.svg"
          alt="Apply Utopia"
          class="header-logo"
        />
      </div>
    </header>

    <nav class="marketplace-type-nav">
      <router-link
        v-for="item in marketplaceTypes"
        :key="item.path"
        :to="item.path"
        class="marketplace-type-item"
        :class="{ active: currentMarketplaceType === item.type }"
      >
        <i :class="['pi', item.icon, 'type-icon']"></i>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <main class="marketplace-content">
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
    </main>

    <nav class="marketplace-bottom-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="marketplace-nav-item"
        :class="{ active: isActive(item.nav) }"
      >
        <i :class="['pi', item.icon, 'nav-icon']"></i>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const marketplaceTypes = [
  { path: '/', label: 'Jobs', icon: 'pi-briefcase', type: 'jobs' },
  { path: '/scholarships', label: 'Scholarships', icon: 'pi-gift', type: 'scholarships' },
  { path: '/services', label: 'Services', icon: 'pi-wrench', type: 'services' },
  { path: '/education', label: 'Education', icon: 'pi-book', type: 'education' },
];

const currentMarketplaceType = computed(() => {
  const type = route.meta.marketplaceType as string | undefined;
  if (type) return type;
  if (route.path === '/') return 'jobs';
  if (route.path.startsWith('/scholarships')) return 'scholarships';
  if (route.path.startsWith('/services')) return 'services';
  if (route.path.startsWith('/education')) return 'education';
  return '';
});

const navItems = [
  { path: '/', label: 'Discover', icon: 'pi-compass', nav: 'discover' },
  { path: '/employer', label: 'Employer', icon: 'pi-briefcase', nav: 'employer' },
];

function isActive(nav: string) {
  if (nav === 'discover') return route.path === '/' || route.path.startsWith('/scholarships') || route.path.startsWith('/services') || route.path.startsWith('/education');
  if (nav === 'employer') return route.path.startsWith('/employer');
  return false;
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.header-logo {
  height: 32px;
  width: auto;
  filter: brightness(0) invert(1); /* white on primary blue header */
}

.marketplace-type-nav {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  gap: 4px;
  padding: 10px 8px 12px;
  background: $marketplace-bg-card;
  border-bottom: 1px solid $marketplace-panel-border;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.marketplace-type-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: $marketplace-text-muted;
  text-decoration: none;
  border-radius: 10px;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: $marketplace-primary;
    background: rgba(0, 51, 102, 0.06);
  }

  &.active {
    color: $marketplace-primary;
    background: rgba(0, 51, 102, 0.08);
  }

  .type-icon {
    font-size: 1.35rem;
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
</style>
