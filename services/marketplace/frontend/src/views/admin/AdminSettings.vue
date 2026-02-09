<template>
  <div class="admin-settings">
    <div class="section-header">
      <h2 class="section-title">Settings</h2>
      <button
        type="button"
        class="refresh-btn"
        :disabled="loading"
        @click="refresh"
      >
        <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="loading && !settings" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading settings...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="settings" class="settings-content">
      <!-- Agent (ACA-Py) section -->
      <section class="settings-section">
        <h3 class="settings-section-title">
          <i class="pi pi-server"></i>
          Agent (ACA-Py)
        </h3>
        <div class="settings-card">
          <div class="settings-row">
            <span class="settings-label">Configured</span>
            <span class="settings-value" :class="{ success: settings.agent.configured }">
              <i :class="settings.agent.configured ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
              {{ settings.agent.configured ? 'Yes' : 'No' }}
            </span>
          </div>
          <div v-if="settings.agent.configured" class="settings-row">
            <span class="settings-label">Reachable</span>
            <span class="settings-value" :class="{ success: settings.agent.reachable, danger: !settings.agent.reachable }">
              <i :class="settings.agent.reachable ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
              {{ settings.agent.reachable ? 'Yes' : 'No' }}
            </span>
          </div>
          <div v-if="settings.agent.walletDids && settings.agent.walletDids.length" class="agent-status-block">
            <h4 class="agent-status-title">Wallet DIDs</h4>
            <div class="wallet-dids-list">
              <div
                v-for="(d, idx) in settings.agent.walletDids"
                :key="idx"
                class="wallet-did-row"
              >
                <code class="wallet-did-value">{{ d.did }}</code>
                <span v-if="d.posture" class="wallet-did-posture">{{ d.posture }}</span>
              </div>
            </div>
          </div>
          <div v-if="settings.agent.status && Object.keys(settings.agent.status).length" class="agent-status-block">
            <h4 class="agent-status-title">Agent status (from ACA-Py /status)</h4>
            <div class="agent-status-grid">
              <div
                v-for="(value, key) in settings.agent.status"
                :key="key"
                class="agent-status-row"
              >
                <span class="agent-status-key">{{ key }}</span>
                <span class="agent-status-value">{{ formatValue(value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Marketplace section -->
      <section class="settings-section">
        <h3 class="settings-section-title">
          <i class="pi pi-cog"></i>
          Marketplace
        </h3>
        <div class="settings-card">
          <div class="settings-row">
            <span class="settings-label">Base URL</span>
            <span class="settings-value mono">{{ settings.marketplace.baseUrl }}</span>
          </div>
          <div class="settings-row">
            <span class="settings-label">Context URI</span>
            <span class="settings-value mono">{{ settings.marketplace.contextUri }}</span>
          </div>
          <div class="settings-row">
            <span class="settings-label">Issuer ID</span>
            <span class="settings-value mono">{{ settings.marketplace.issuerId }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getInnkeeperSettings, type InnkeeperSettings } from '@/api/admin';

const settings = ref<InnkeeperSettings | null>(null);
const loading = ref(false);
const error = ref('');

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    settings.value = await getInnkeeperSettings();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load settings';
    settings.value = null;
  } finally {
    loading.value = false;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

onMounted(() => refresh());
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-settings {
  max-width: 640px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  margin: 0;
}

.settings-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: $marketplace-primary;
  margin: 0 0 12px 0;

  i {
    font-size: 1.1rem;
    opacity: 0.9;
  }
}

.settings-card {
  background: $marketplace-bg-card;
  border: 1px solid $marketplace-panel-border;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 51, 102, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.settings-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: $marketplace-text-muted;
  min-width: 120px;
}

.settings-value {
  font-size: 0.9rem;
  color: $marketplace-text;
  flex: 1;
  min-width: 0;
  word-break: break-all;

  &.success {
    color: $marketplace-success;
    font-weight: 600;
  }

  &.danger {
    color: $marketplace-danger;
    font-weight: 600;
  }

  &.mono {
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
  }

  i {
    margin-right: 6px;
    font-size: 0.9rem;
  }
}

.agent-status-block {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid $marketplace-panel-border;
}

.wallet-dids-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wallet-did-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  padding: 6px 10px;
  background: rgba(0, 51, 102, 0.03);
  border-radius: 6px;

  .wallet-did-value {
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
    word-break: break-all;
    flex: 1;
    min-width: 0;
  }

  .wallet-did-posture {
    font-size: 0.75rem;
    color: $marketplace-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}

.agent-status-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: $marketplace-text-muted;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.agent-status-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.agent-status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.9rem;
  padding: 6px 10px;
  background: rgba(0, 51, 102, 0.03);
  border-radius: 6px;

  .agent-status-key {
    font-weight: 500;
    color: $marketplace-text-muted;
    min-width: 100px;
  }

  .agent-status-value {
    color: $marketplace-text;
    word-break: break-all;
    flex: 1;
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: $marketplace-danger;

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
