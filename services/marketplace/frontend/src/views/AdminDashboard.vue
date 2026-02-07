<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <div class="admin-header-inner">
        <h1 class="admin-title">Innkeeper</h1>
        <nav class="admin-tabs">
          <router-link
            v-for="item in mainTabs"
            :key="item.path"
            :to="item.path"
            class="tab-link"
            :class="{ active: isActive(item.path) }"
          >
            <i :class="['pi', item.icon]"></i>
            <span>{{ item.label }}</span>
            <span v-if="item.count != null" class="tab-badge">{{ item.count }}</span>
          </router-link>
          <div v-if="showMarketplaceTabs" class="tab-divider"></div>
          <router-link
            v-for="item in marketplaceTabs"
            v-show="showMarketplaceTabs"
            :key="item.path"
            :to="item.path"
            class="tab-link sub"
            :class="{ active: route.path === item.path }"
          >
            <i :class="['pi', item.icon]"></i>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
        <button type="button" class="sign-out-btn" @click="handleSignOut">
          <i class="pi pi-sign-out"></i>
          Sign out
        </button>
      </div>
    </header>
    <main class="admin-content">
      <router-view v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
          <template #fallback>
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Loading...</p>
            </div>
          </template>
        </Suspense>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminStore } from '@/store/adminStore';
import { useTenantRequestStore } from '@/store/tenantRequestStore';

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();
const tenantStore = useTenantRequestStore();

const mainTabs = computed(() => [
  { path: '/innkeeper/requests', label: 'Reservations', icon: 'pi-inbox', count: tenantStore.pendingRequests.length },
  { path: '/innkeeper/tenants', label: 'Tenants', icon: 'pi-users' },
  { path: '/innkeeper/trust-registries', label: 'Trust registry', icon: 'pi-shield' },
  { path: '/innkeeper/credential-analysis', label: 'Credential analysis', icon: 'pi-file-edit' },
  { path: '/innkeeper/workflows', label: 'Workflows', icon: 'pi-sitemap' },
  { path: '/innkeeper/marketplace', label: 'Marketplace', icon: 'pi-store' },
]);

const marketplaceTabs = [
  { path: '/innkeeper/marketplace/invitation', label: 'Invitation', icon: 'pi-qrcode' },
  { path: '/innkeeper/marketplace/action-menu', label: 'Action menu', icon: 'pi-list' },
];

const showMarketplaceTabs = computed(() => route.path.startsWith('/innkeeper/marketplace'));

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/');
}

function handleSignOut() {
  adminStore.clearAdmin();
  router.replace('/innkeeper/login');
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.admin-dashboard {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: $marketplace-bg;
}

.admin-header {
  background: $marketplace-bg-card;
  border-bottom: 1px solid $marketplace-panel-border;
  padding: 16px;
  flex-shrink: 0;

  @media (min-width: $breakpoint-desktop) {
    padding: 20px 24px;
  }
}

.admin-header-inner {
  max-width: $content-max-width;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.admin-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: $marketplace-primary;
  margin: 0;
}

.admin-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.tab-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 500;
  color: $marketplace-text-muted;
  text-decoration: none;
  border-radius: 8px;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(0, 51, 102, 0.06);
    color: $marketplace-primary;
  }

  &.active {
    background: rgba(0, 51, 102, 0.1);
    color: $marketplace-primary;
    font-weight: 600;
  }

  &.sub {
    font-size: 0.85rem;
    padding: 6px 12px;
  }
}

.tab-badge {
  background: $marketplace-primary;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.tab-divider {
  width: 1px;
  height: 20px;
  background: $marketplace-panel-border;
  margin: 0 4px;
}

.sign-out-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid $marketplace-panel-border;
  background: transparent;
  color: $marketplace-text-muted;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(0, 51, 102, 0.06);
    color: $marketplace-primary;
  }
}

.admin-content {
  flex: 1;
  min-width: 0;
  padding: 16px;
  overflow-x: hidden;
  overflow-y: auto;
  max-width: $content-max-width;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;

  @media (min-width: $breakpoint-desktop) {
    padding: 24px;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: $marketplace-text-muted;

  i {
    font-size: 2rem;
    margin-bottom: 12px;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
  }
}
</style>
