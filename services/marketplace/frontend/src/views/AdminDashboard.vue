<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <div class="admin-header-inner">
        <button type="button" class="menu-toggle" aria-label="Toggle menu" @click="sidebarOpen = !sidebarOpen">
          <i class="pi pi-bars"></i>
        </button>
        <router-link to="/" class="admin-header-brand">
          <img :src="headerLogoUrl" alt="" class="admin-header-logo" />
          <span class="admin-header-title">Apply Utopia</span>
          <span class="admin-header-badge">Innkeeper's Desk</span>
        </router-link>
        <button type="button" class="sign-out-btn" @click="handleSignOut">
          <i class="pi pi-sign-out"></i>
          <span class="sign-out-label">Sign out</span>
        </button>
      </div>
    </header>

    <div class="admin-layout">
      <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
        <nav class="sidebar-nav">
          <div v-for="group in navGroups" :key="group.label" class="nav-group">
            <span class="nav-group-label">{{ group.label }}</span>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="nav-link"
              :class="{ active: isActive(item.path) }"
              @click="sidebarOpen = false"
            >
              <i :class="['pi', item.icon]"></i>
              <span class="nav-label">{{ item.label }}</span>
              <span v-if="item.count != null" class="nav-badge">{{ item.count }}</span>
            </router-link>
          </div>
        </nav>
      </aside>

      <div class="sidebar-backdrop" :class="{ open: sidebarOpen }" @click="sidebarOpen = false" />

      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <template v-if="isPending">
            <div class="loading-state">
              <i class="pi pi-spin pi-spinner"></i>
              <p>Loading...</p>
            </div>
          </template>
          <component v-else-if="Component" :is="Component" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRouteLoading } from '@/composables/useRouteLoading';
import { useAdminStore } from '@/store/adminStore';
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import { innkeeperLogout } from '@/api/auth';
import { getAppIconUrl } from '@/services/configService';

const headerLogoUrl = getAppIconUrl();

const route = useRoute();
const router = useRouter();
const { isPending } = useRouteLoading();
const adminStore = useAdminStore();
const tenantStore = useTenantRequestStore();

const sidebarOpen = ref(false);

const navGroups = computed(() => [
  {
    label: 'Onboarding',
    items: [
      { path: '/innkeeper/requests', label: 'Reservations', icon: 'pi-inbox', count: tenantStore.pendingRequests.length },
      { path: '/innkeeper/tenants', label: 'Tenants', icon: 'pi-users' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { path: '/innkeeper/trust-registries', label: 'Trust registry', icon: 'pi-shield' },
      { path: '/innkeeper/workflows', label: 'Configure workflow', icon: 'pi-sitemap' },
      { path: '/innkeeper/settings', label: 'Settings', icon: 'pi-cog' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { path: '/innkeeper/marketplace/invitation', label: 'Invitation', icon: 'pi-qrcode' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/innkeeper/credential-analysis', label: 'Credential analysis', icon: 'pi-file-edit' },
    ],
  },
]);

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/');
}

async function handleSignOut() {
  try {
    await innkeeperLogout();
  } catch {
    // Ignore - still clear local state
  }
  adminStore.clearAdmin();
  router.replace('/innkeeper/login');
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.admin-dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $marketplace-bg;
}

.admin-header {
  background: linear-gradient(135deg, $marketplace-primary 0%, $marketplace-secondary 100%);
  color: $marketplace-text-on-primary;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 0));
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 16px rgba(0, 51, 102, 0.2);

  @media (min-width: $breakpoint-desktop) {
    padding: 14px 24px;
    box-shadow: 0 2px 20px rgba(0, 51, 102, 0.15);
  }
}

.admin-header-inner {
  max-width: $content-max-width;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  @media (min-width: $breakpoint-desktop) {
    display: none;
  }
}

.admin-header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
}

.admin-header-logo {
  height: 26px;
  width: auto;
  filter: brightness(0) invert(1);
  flex-shrink: 0;
}

.admin-header-title {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: white;
  white-space: nowrap;
}

.admin-header-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 20px;
  margin-left: 4px;
  white-space: nowrap;

  @media (max-width: 480px) {
    display: none;
  }
}

.sign-out-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.12);
  color: white;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.sign-out-label {
  @media (max-width: 400px) {
    display: none;
  }
}

.admin-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.admin-sidebar {
  flex-shrink: 0;
  width: 220px;
  background: $marketplace-bg-card;
  border-right: 1px solid $marketplace-panel-border;
  overflow-y: auto;
  position: fixed;
  top: 64px;
  bottom: 0;
  left: 0;
  z-index: 90;
  transform: translateX(-100%);
  transition: transform 0.25s ease;

  @media (min-width: $breakpoint-desktop) {
    position: static;
    transform: none;
    top: auto;
    bottom: auto;
  }
}

.admin-sidebar.open {
  transform: translateX(0);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
}

.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 85;
  top: 64px;

  &.open {
    display: block;
    @media (min-width: $breakpoint-desktop) {
      display: none;
    }
  }
}

.sidebar-nav {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $marketplace-text-muted;
  padding: 8px 10px 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: $marketplace-text;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;

  i {
    font-size: 1rem;
    opacity: 0.8;
    flex-shrink: 0;
  }

  &:hover {
    background: rgba(0, 51, 102, 0.06);
    color: $marketplace-primary;
  }

  &.active {
    background: rgba(0, 51, 102, 0.1);
    color: $marketplace-primary;
    font-weight: 600;

    i {
      opacity: 1;
    }
  }
}

.nav-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  background: $marketplace-primary;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
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
