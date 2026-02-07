<template>
  <div class="admin-invitation">
    <div class="section-header">
      <h2 class="section-title">Create invitation</h2>
      <button
        type="button"
        class="save-btn"
        :disabled="creating"
        @click="create"
      >
        <i :class="creating ? 'pi pi-spin pi-spinner' : 'pi pi-plus'"></i>
        {{ creating ? 'Creating...' : 'Create invitation' }}
      </button>
    </div>

    <p class="section-desc">
      Create an OOB invitation for the marketplace channel. Use the invitation URL or QR code for holders to connect.
    </p>

    <form class="config-form" @submit.prevent="create">
      <div class="form-section">
        <h3>Content URL</h3>
        <p class="hint">Marketplace PWA URL (e.g. embed/channel)</p>
        <input
          v-model="form.content_url"
          type="url"
          placeholder="https://marketplace.example.com/embed/channel"
          class="input-wide"
        />
      </div>

      <div class="form-section">
        <h3>Goal</h3>
        <p class="hint">Human-readable goal shown in the invitation</p>
        <input
          v-model="form.goal"
          type="text"
          placeholder="Browse jobs and opportunities from Apply Utopia"
          class="input-wide"
        />
      </div>

      <div class="form-section">
        <h3>Image URL</h3>
        <p class="hint">Optional image for OOB invitation (QR display)</p>
        <input
          v-model="form.image_url"
          type="url"
          placeholder="https://marketplace.example.com/marketplace.png"
          class="input-wide"
        />
      </div>

      <div class="form-section">
        <div class="checkbox-row">
          <label>
            <input v-model="form.multi_use" type="checkbox" />
            Multi-use invitation
          </label>
        </div>
      </div>
    </form>

    <div v-if="result" class="result-section">
      <h3>Invitation created</h3>
      <div class="result-url-wrap">
        <label>Invitation URL</label>
        <div class="url-row">
          <input
            :value="result.invitation_url"
            readonly
            class="input-wide url-input"
          />
          <button type="button" class="copy-btn" @click="copyUrl">
            <i class="pi pi-copy"></i> Copy
          </button>
        </div>
      </div>
      <p class="hint">Share this URL or generate a QR code for holders to connect.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import * as adminApi from '@/api/admin';

const creating = ref(false);
const result = ref<adminApi.MarketplaceInvitationResponse | null>(null);

const form = reactive({
  content_url: '',
  goal: 'Browse jobs and opportunities from Apply Utopia',
  image_url: '',
  multi_use: true,
});

async function create() {
  creating.value = true;
  result.value = null;
  try {
    const res = await adminApi.createMarketplaceInvitation({
      content_url: form.content_url || undefined,
      goal: form.goal || undefined,
      image_url: form.image_url || undefined,
      multi_use: form.multi_use,
    });
    result.value = res;
  } catch (err: unknown) {
    console.error('Create invitation error:', err);
    const ax = err && typeof err === 'object' && 'response' in err ? err as { response?: { data?: { error?: string } } } : null;
    const msg = ax?.response?.data?.error ?? 'Failed to create invitation. Ensure MARKETPLACE_AGENCY_URI is configured and the agency is reachable.';
    alert(msg);
  } finally {
    creating.value = false;
  }
}

function copyUrl() {
  if (!result.value?.invitation_url) return;
  navigator.clipboard.writeText(result.value.invitation_url);
  alert('Copied to clipboard');
}
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-invitation {
  .save-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    background: $marketplace-primary;
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .section-desc {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: -8px 0 20px 0;
  }

  .config-form {
    max-width: 560px;
    margin-bottom: 32px;
  }

  .form-section {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid $marketplace-panel-border;

    &:last-child {
      border-bottom: none;
    }

    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: $marketplace-primary;
      margin: 0 0 8px 0;
    }

    .hint {
      font-size: 0.85rem;
      color: $marketplace-text-muted;
      margin: 0 0 10px 0;
    }
  }

  .checkbox-row label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    cursor: pointer;
  }

  .input-wide {
    width: 100%;
    max-width: 400px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid $marketplace-panel-border;
    font-size: 0.9rem;
  }

  .result-section {
    margin-top: 24px;
    padding: 20px;
    background: rgba(51, 108, 55, 0.08);
    border-radius: 10px;
    border: 1px solid rgba(51, 108, 55, 0.2);

    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: $marketplace-success;
      margin: 0 0 12px 0;
    }

    .result-url-wrap {
      margin-bottom: 8px;

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 6px;
        color: $marketplace-text-muted;
      }
    }

    .url-row {
      display: flex;
      gap: 8px;
      align-items: center;

      .url-input {
        flex: 1;
        max-width: none;
        font-family: monospace;
        font-size: 0.85rem;
      }

      .copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        font-size: 0.9rem;
        font-weight: 600;
        border-radius: 8px;
        border: 1px solid $marketplace-panel-border;
        background: white;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: rgba(0, 51, 102, 0.06);
        }
      }
    }

    .hint {
      font-size: 0.85rem;
      color: $marketplace-text-muted;
      margin: 8px 0 0 0;
    }
  }
}
</style>
