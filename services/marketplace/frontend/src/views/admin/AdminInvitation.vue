<template>
  <div class="admin-invitation">
    <div class="invitation-hero">
      <div class="hero-content">
        <div class="hero-icon">
          <i class="pi pi-qrcode"></i>
        </div>
        <h2 class="hero-title">Connect holders to your channel</h2>
        <p class="hero-desc">Generate a link or QR code for wallet users to join the marketplace.</p>
      </div>

      <div v-if="!result" class="hero-actions">
        <button
          type="button"
          class="btn-create"
          :disabled="creating"
          @click="create"
        >
          <i :class="creating ? 'pi pi-spin pi-spinner' : 'pi pi-plus-circle'"></i>
          {{ creating ? 'Creating...' : 'Create invitation' }}
        </button>
        <button
          type="button"
          class="btn-expand"
          :class="{ expanded: showOptions }"
          @click="showOptions = !showOptions"
        >
          <i :class="showOptions ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
          {{ showOptions ? 'Hide options' : 'Customize' }}
        </button>
      </div>

      <div v-if="showOptions && !result" class="options-panel">
        <div class="option-row">
          <label for="content-url">Content URL</label>
          <input
            id="content-url"
            v-model="form.content_url"
            type="url"
            placeholder="https://marketplace.example.com/channel"
            class="input-compact"
          />
        </div>
        <div class="option-row">
          <label for="invitation-goal">Goal</label>
          <input
            id="invitation-goal"
            v-model="form.goal"
            type="text"
            placeholder="Browse jobs and opportunities"
            class="input-compact"
          />
        </div>
        <div class="option-row inline">
          <label class="checkbox-label">
            <input v-model="form.multi_use" type="checkbox" />
            Multi-use invitation
          </label>
        </div>
      </div>
    </div>

    <div v-if="result" class="result-card">
      <div class="result-header">
        <i class="pi pi-check-circle"></i>
        <span>Invitation ready</span>
      </div>
      <div class="result-body">
        <div class="result-qr">
          <QrcodeVue
            v-if="result.invitation_url"
            :value="result.invitation_url"
            :size="160"
            level="M"
          />
          <p class="qr-hint">Scan with DigiCred Wallet</p>
        </div>
        <div class="result-url">
          <input
            :value="result.invitation_url"
            readonly
            class="url-input"
          />
          <button type="button" class="btn-copy" :class="{ copied: copyFeedback }" @click="copyUrl">
            <i :class="copyFeedback ? 'pi pi-check' : 'pi pi-copy'"></i>
            {{ copyFeedback ? 'Copied!' : 'Copy link' }}
          </button>
          <button type="button" class="btn-new" @click="reset">
            <i class="pi pi-plus"></i>
            Create another
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import * as adminApi from '@/api/admin';
import { getApiErrorMessage } from '@/utils/apiError';

const creating = ref(false);
const copyFeedback = ref(false);
const showOptions = ref(false);
const result = ref<adminApi.MarketplaceInvitationResponse | null>(null);

const form = reactive({
  content_url: '',
  goal: 'Browse jobs and opportunities from Apply Utopia',
  image_url: '',
  multi_use: true,
});

onMounted(() => {
  if (!form.content_url && typeof window !== 'undefined') {
    form.content_url = `${window.location.origin}/channel`;
  }
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
    const msg = getApiErrorMessage(err, 'Failed to create invitation. Ensure MARKETPLACE_AGENCY_URI is configured and the agency is reachable.');
    alert(msg);
  } finally {
    creating.value = false;
  }
}

function reset() {
  result.value = null;
  copyFeedback.value = false;
}

async function copyUrl() {
  if (!result.value?.invitation_url) return;
  try {
    await navigator.clipboard.writeText(result.value.invitation_url);
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 1800);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = result.value.invitation_url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 1800);
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-invitation {
  max-width: 520px;
}

.invitation-hero {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(0, 51, 102, 0.06) 0%, rgba(0, 51, 102, 0.02) 100%);
  border: 1px solid rgba(0, 51, 102, 0.12);
  border-radius: 14px;
}

.hero-content {
  margin-bottom: 20px;
}

.hero-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $marketplace-primary 0%, $marketplace-secondary 100%);
  color: white;
  border-radius: 12px;
  font-size: 1.5rem;
  margin-bottom: 14px;
}

.hero-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: $marketplace-text;
  margin: 0 0 6px 0;
}

.hero-desc {
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  margin: 0;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, $marketplace-primary 0%, $marketplace-secondary 100%);
  color: white;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(0, 51, 102, 0.35);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.btn-expand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid $marketplace-panel-border;
  background: white;
  color: $marketplace-text-muted;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: $marketplace-primary;
    border-color: rgba(0, 51, 102, 0.3);
  }
}

.options-panel {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 51, 102, 0.1);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.inline {
    flex-direction: row;
  }

  label {
    font-size: 0.85rem;
    font-weight: 500;
    color: $marketplace-text-muted;
  }

  .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: $marketplace-text;
    cursor: pointer;

    input {
      width: 18px;
      height: 18px;
      accent-color: $marketplace-primary;
    }
  }
}

.input-compact {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid $marketplace-panel-border;
  font-size: 0.9rem;
}

.result-card {
  margin-top: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(51, 108, 55, 0.08) 0%, rgba(51, 108, 55, 0.04) 100%);
  border: 1px solid rgba(51, 108, 55, 0.2);
  border-radius: 14px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: $marketplace-success;
  margin-bottom: 18px;

  i {
    font-size: 1.25rem;
  }
}

.result-body {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}

.result-qr {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .qr-hint {
    font-size: 0.8rem;
    color: $marketplace-text-muted;
    margin: 0;
  }
}

.result-url {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.url-input {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid $marketplace-panel-border;
  font-size: 0.85rem;
  font-family: ui-monospace, monospace;
  background: white;
}

.btn-copy,
.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-copy {
  border: 1px solid $marketplace-panel-border;
  background: white;
  color: $marketplace-primary;

  &:hover {
    background: rgba(0, 51, 102, 0.06);
  }

  &.copied {
    border-color: $marketplace-success;
    color: $marketplace-success;
    background: rgba(51, 108, 55, 0.1);
  }
}

.btn-new {
  border: none;
  background: transparent;
  color: $marketplace-text-muted;

  &:hover {
    color: $marketplace-primary;
  }
}
</style>
