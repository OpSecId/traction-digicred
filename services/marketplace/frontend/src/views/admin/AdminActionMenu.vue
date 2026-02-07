<template>
  <div class="admin-action-menu">
    <div class="section-header">
      <h2 class="section-title">Action menu</h2>
      <div class="header-actions">
        <button
          type="button"
          class="refresh-btn"
          :disabled="loading"
          @click="load"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        <button
          type="button"
          class="save-btn"
          :disabled="saving || !dirty"
          @click="save"
        >
          <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <div v-if="loading && !config" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading config...</p>
    </div>
    <div v-else class="config-form">
      <div class="form-section">
        <h3>Content</h3>
        <p class="section-hint">Toggle which content types holders can access</p>
        <div class="toggle-group">
          <label class="toggle-item">
            <input v-model="form.jobsEnabled" type="checkbox" />
            <span>Jobs</span>
          </label>
          <label class="toggle-item">
            <input v-model="form.scholarshipsEnabled" type="checkbox" />
            <span>Scholarships</span>
          </label>
          <label class="toggle-item">
            <input v-model="form.certificationsEnabled" type="checkbox" />
            <span>Certifications</span>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Credential analysis (presentation request)</h3>
        <p class="section-hint">Allow holders to share credentials for matching. Add credential types from your trust registry.</p>
        <div class="credential-actions-list">
          <div
            v-for="(credType, idx) in form.presentationRequestCredentialTypes"
            :key="credType"
            class="credential-action-row"
          >
            <span class="cred-type-label">{{ credType }}</span>
            <button type="button" class="btn-remove" @click="removeCredentialType(idx)">
              <i class="pi pi-trash"></i> Remove
            </button>
          </div>
        </div>
        <div v-if="availableCredentialTypes.length > 0" class="add-action-row">
          <select
            v-model="addCredentialTypeChoice"
            class="action-select"
          >
            <option value="">Select credential type to add</option>
            <option
              v-for="ct in availableCredentialTypes"
              :key="ct"
              :value="ct"
            >
              {{ ct }}
            </option>
          </select>
          <button
            type="button"
            class="add-btn"
            :disabled="!addCredentialTypeChoice"
            @click="addCredentialType"
          >
            <i class="pi pi-plus"></i> Add action
          </button>
        </div>
        <p v-else-if="form.presentationRequestCredentialTypes.length > 0" class="all-added-hint">All configured credential types have been added.</p>
        <p v-else-if="trustRegistryCredentialTypes.length === 0" class="all-added-hint">Add credential types to trust registry entries first.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import * as adminApi from '@/api/admin';

const CONTENT_TITLES = {
  jobs: 'Load jobs',
  scholarships: 'Load scholarships',
  certifications: 'Load certifications',
} as const;
const SHARE_TRANSCRIPT = { title: 'Share transcript', description: 'Share your transcript credential for job matching' };

const config = ref<adminApi.ActionMenuConfig | null>(null);
const loading = ref(false);
const saving = ref(false);
const addCredentialTypeChoice = ref('');
const trustRegistryCredentialTypes = ref<string[]>([]);

const form = reactive({
  jobsEnabled: false,
  scholarshipsEnabled: false,
  certificationsEnabled: false,
  presentationRequestCredentialTypes: [] as string[],
});

const originalJson = ref('');
const dirty = computed(() => JSON.stringify(form) !== originalJson.value);

const availableCredentialTypes = computed(() => {
  const used = new Set(form.presentationRequestCredentialTypes);
  return trustRegistryCredentialTypes.value.filter((ct) => !used.has(ct));
});

function deriveTogglesFromItems(items: Array<{ title: string }>) {
  const titles = new Set(items.map((i) => i.title));
  return {
    jobsEnabled: titles.has(CONTENT_TITLES.jobs),
    scholarshipsEnabled: titles.has(CONTENT_TITLES.scholarships),
    certificationsEnabled: titles.has(CONTENT_TITLES.certifications),
  };
}

function buildItems(): Array<{ title: string; description?: string }> {
  const items: Array<{ title: string; description?: string }> = [];
  if (form.jobsEnabled) items.push({ title: CONTENT_TITLES.jobs, description: 'Discover jobs that match your skills' });
  if (form.scholarshipsEnabled) items.push({ title: CONTENT_TITLES.scholarships, description: 'Browse scholarships and funding opportunities' });
  if (form.certificationsEnabled) items.push({ title: CONTENT_TITLES.certifications, description: 'Browse certifications and credentials' });
  if (form.presentationRequestCredentialTypes.length > 0) items.push(SHARE_TRANSCRIPT);
  return items;
}

function applyConfig(c: adminApi.ActionMenuConfig) {
  config.value = c;
  const items = c.items ?? [];
  const toggles = deriveTogglesFromItems(items);
  form.jobsEnabled = toggles.jobsEnabled;
  form.scholarshipsEnabled = toggles.scholarshipsEnabled;
  form.certificationsEnabled = toggles.certificationsEnabled;
  form.presentationRequestCredentialTypes = [...(c.presentationRequestCredentialTypes ?? [])];
  originalJson.value = JSON.stringify(form);
}

function addCredentialType() {
  if (addCredentialTypeChoice.value) {
    form.presentationRequestCredentialTypes.push(addCredentialTypeChoice.value);
    addCredentialTypeChoice.value = '';
  }
}

function removeCredentialType(idx: number) {
  form.presentationRequestCredentialTypes.splice(idx, 1);
}

async function load() {
  loading.value = true;
  try {
    const [registries, actionMenu] = await Promise.all([
      adminApi.listTrustRegistries(),
      adminApi.getActionMenuConfig(),
    ]);
    trustRegistryCredentialTypes.value = adminApi.getTrustRegistryCredentialTypes(registries);
    applyConfig(actionMenu);
  } catch {
    config.value = null;
  } finally {
    loading.value = false;
  }
}

async function save() {
  const items = buildItems();
  const payload: adminApi.ActionMenuConfig = {
    title: items[0]?.title ?? 'Share transcript',
    description: items[0]?.description ?? SHARE_TRANSCRIPT.description,
    items,
    presentationRequestCredentialTypes: form.presentationRequestCredentialTypes,
  };
  saving.value = true;
  try {
    const updated = await adminApi.updateActionMenuConfig(payload);
    applyConfig(updated);
  } finally {
    saving.value = false;
  }
}

onMounted(() => load());
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-action-menu {
  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .save-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    background: $marketplace-success;
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

  .config-form {
    max-width: 520px;
    margin-top: 20px;
  }

  .form-section {
    margin-bottom: 24px;

    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: $marketplace-text;
      margin: 0 0 4px 0;
    }

    .section-hint {
      font-size: 0.875rem;
      color: $marketplace-text-muted;
      margin: 0 0 12px 0;
    }
  }

  .toggle-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 24px;
  }

  .toggle-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    color: $marketplace-text;
    cursor: pointer;

    input {
      width: 18px;
      height: 18px;
      accent-color: $marketplace-primary;
    }
  }

  .credential-actions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .credential-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: $marketplace-bg-card;
    border: 1px solid $marketplace-panel-border;
    border-radius: 8px;
  }

  .cred-type-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: $marketplace-text;
  }

  .btn-remove {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
    background: transparent;
    color: $marketplace-text-muted;

    &:hover {
      background: rgba($marketplace-danger, 0.08);
      color: $marketplace-danger;
    }
  }

  .action-select {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid $marketplace-panel-border;
    font-size: 0.9rem;
    background: white;
  }

  .add-action-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba($marketplace-primary, 0.03);
    border-radius: 10px;
    border: 1px dashed $marketplace-panel-border;

    .action-select {
      flex: 1;
      min-width: 180px;
    }
  }

  .add-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    background: $marketplace-primary;
    color: white;
    cursor: pointer;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .all-added-hint {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: 16px 0 0 0;
  }
}
</style>
