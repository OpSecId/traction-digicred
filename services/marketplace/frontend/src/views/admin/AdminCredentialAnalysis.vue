<template>
  <div class="admin-credential-analysis">
    <div class="section-header">
      <h2 class="section-title">Credential analysis</h2>
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
      <p>Loading...</p>
    </div>
    <form v-else class="config-form" @submit.prevent="save">
      <div class="form-panel">
        <div class="form-row">
          <label for="credTypes">Credential type</label>
          <select
            id="credTypes"
            v-model="form.credentialType"
            class="credential-select"
          >
            <option value="">Select credential type</option>
            <option
              v-for="opt in credentialTypeOptions"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>
        </div>

        <div v-if="visibleExtractionFields.length > 0" class="form-section">
          <h3>Extraction</h3>
          <p class="section-hint">Fields available for selected credential types</p>
          <div class="extraction-row">
            <div class="checkbox-group">
              <template v-for="field in visibleExtractionFields" :key="field.id">
                <label v-if="field.type === 'checkbox'">
                  <input
                    v-model="form.extraction[field.modelKey]"
                    type="checkbox"
                  />
                  {{ field.label }}
                </label>
              </template>
            </div>
            <div
              v-for="field in visibleExtractionFields.filter((f) => f.type === 'number')"
              :key="field.id"
              class="number-field"
            >
              <label :for="field.id">{{ field.label }}</label>
              <input
                :id="field.id"
                v-model.number="form.extraction[field.modelKey]"
                type="number"
                :min="field.min"
                :max="field.max"
              />
            </div>
          </div>
        </div>
        <div v-else-if="form.credentialType" class="form-section">
          <p class="no-fields-hint">No extraction fields for selected credential types.</p>
        </div>
        <div v-else class="form-section">
          <p class="no-fields-hint">Select credential types to configure extraction.</p>
        </div>

        <div class="form-section">
          <h3>Matching</h3>
          <div class="matching-row">
            <div class="form-row-inline">
              <label for="matchFields">Job fields</label>
              <input
                id="matchFields"
                v-model="form.matchFieldsStr"
                type="text"
                placeholder="industry, occupation, educationRequirements"
              />
            </div>
            <div class="number-field">
              <label for="minScore">Min score</label>
              <input
                id="minScore"
                v-model.number="form.matching.minScore"
                type="number"
                min="0"
                max="1"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div class="form-footer">
          <label class="enabled-toggle">
            <input v-model="form.enabled" type="checkbox" />
            <span>Credential analysis enabled</span>
          </label>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import * as adminApi from '@/api/admin';

const config = ref<adminApi.CredentialAnalysisConfig | null>(null);
const loading = ref(false);
const saving = ref(false);
const credentialTypeOptions = ref<string[]>([]);

// Extraction fields per credential type
const EXTRACTION_FIELDS_BY_CRED_TYPE: Record<string, string[]> = {
  CollegeTranscript: ['program', 'gpa', 'courses', 'maxCourses'],
  HighSchoolTranscript: ['program', 'gpa', 'courses', 'maxCourses'],
  Diploma: ['program'],
  StudentCard: [],
  Degree: ['program'],
  Certificate: ['program'],
};

const EXTRACTION_FIELD_DEFS: Array<{
  id: string;
  modelKey: 'includeProgram' | 'includeGpa' | 'includeCourses' | 'maxCourses';
  label: string;
  type: 'checkbox' | 'number';
  min?: number;
  max?: number;
}> = [
  { id: 'program', modelKey: 'includeProgram', label: 'Program', type: 'checkbox' },
  { id: 'gpa', modelKey: 'includeGpa', label: 'GPA', type: 'checkbox' },
  { id: 'courses', modelKey: 'includeCourses', label: 'Courses', type: 'checkbox' },
  { id: 'maxCourses', modelKey: 'maxCourses', label: 'Max courses', type: 'number', min: 1, max: 100 },
];

const visibleExtractionFields = computed(() => {
  const selected = form.credentialType ? [form.credentialType] : [];
  if (selected.length === 0) return [];
  const fieldIds = new Set<string>();
  for (const credType of selected) {
    const fields = EXTRACTION_FIELDS_BY_CRED_TYPE[credType] ?? ['program'];
    for (const f of fields) fieldIds.add(f);
  }
  return EXTRACTION_FIELD_DEFS.filter((def) => fieldIds.has(def.id));
});

const form = reactive({
  credentialType: '' as string,
  extraction: {
    includeProgram: true,
    includeGpa: true,
    includeCourses: true,
    maxCourses: 20,
  },
  matchFieldsStr: '',
  matching: {
    minScore: 0.2,
  },
  enabled: true,
});

const originalJson = ref('');

const dirty = computed(() => {
  const credentialTypes = form.credentialType ? [form.credentialType] : [];
  const current = JSON.stringify({
    credentialTypes,
    extraction: form.extraction,
    matching: {
      matchFields: form.matchFieldsStr.split(',').map((s) => s.trim()).filter(Boolean),
      minScore: form.matching.minScore,
    },
    enabled: form.enabled,
  });
  return current !== originalJson.value;
});

function applyConfig(c: adminApi.CredentialAnalysisConfig) {
  config.value = c;
  const types = c.credentialTypes ?? [];
  const first = types[0] ?? '';
  form.credentialType = credentialTypeOptions.value.includes(first) ? first : credentialTypeOptions.value[0] ?? '';
  const ext = c.extraction ?? {};
  form.extraction.includeProgram = ext.includeProgram ?? true;
  form.extraction.includeGpa = ext.includeGpa ?? true;
  form.extraction.includeCourses = ext.includeCourses ?? true;
  form.extraction.maxCourses = ext.maxCourses ?? 20;
  const match = c.matching ?? {};
  form.matchFieldsStr = (match.matchFields ?? []).join(', ');
  form.matching.minScore = match.minScore ?? 0.2;
  form.enabled = c.enabled ?? true;
  originalJson.value = JSON.stringify({
    credentialTypes: form.credentialType ? [form.credentialType] : [],
    extraction: form.extraction,
    matching: {
      matchFields: form.matchFieldsStr.split(',').map((s) => s.trim()).filter(Boolean),
      minScore: form.matching.minScore,
    },
    enabled: form.enabled,
  });
}

async function load() {
  loading.value = true;
  try {
    const [registries, c] = await Promise.all([
      adminApi.listTrustRegistries(),
      adminApi.getCredentialAnalysisConfig(),
    ]);
    credentialTypeOptions.value = adminApi.getTrustRegistryCredentialTypes(registries);
    applyConfig(c);
  } catch {
    config.value = null;
  } finally {
    loading.value = false;
  }
}

async function save() {
  const payload: adminApi.CredentialAnalysisConfig = {
    credentialTypes: form.credentialType ? [form.credentialType] : [],
    extraction: {
      includeProgram: form.extraction.includeProgram,
      includeGpa: form.extraction.includeGpa,
      includeCourses: form.extraction.includeCourses,
      maxCourses: Math.max(1, Math.min(100, form.extraction.maxCourses || 20)),
    },
    matching: {
      matchFields: form.matchFieldsStr.split(',').map((s) => s.trim()).filter(Boolean),
      minScore: Math.max(0, Math.min(1, form.matching.minScore ?? 0.2)),
    },
    enabled: form.enabled,
  };
  saving.value = true;
  try {
    const updated = await adminApi.updateCredentialAnalysisConfig(payload);
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

.admin-credential-analysis {
  overflow-x: hidden;

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .save-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    background: $marketplace-success;
    color: white;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;

    &:hover:not(:disabled) {
      opacity: 0.95;
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }

  .config-form {
    margin-top: 20px;
    min-width: 0;
  }

  .form-panel {
    max-width: 540px;
    min-width: 0;
    padding: 28px 32px;
    background: $marketplace-bg-card;
    border: 1px solid rgba($marketplace-primary, 0.08);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .form-row {
    margin-bottom: 24px;

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: $marketplace-text;
      margin-bottom: 8px;
      letter-spacing: 0.01em;
    }

    input[type='text'] {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid $marketplace-panel-border;
      font-size: 0.9rem;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: rgba($marketplace-primary, 0.4);
        box-shadow: 0 0 0 3px rgba($marketplace-primary, 0.08);
      }
    }

    .credential-select {
      width: 100%;
      padding: 12px 40px 12px 14px;
      border-radius: 10px;
      border: 1px solid $marketplace-panel-border;
      font-size: 0.9rem;
      font-family: ui-monospace, monospace;
      background: white;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236c757d' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: rgba($marketplace-primary, 0.4);
        box-shadow: 0 0 0 3px rgba($marketplace-primary, 0.08);
      }
    }

    .field-hint {
      display: block;
      font-size: 0.8rem;
      color: $marketplace-text-muted;
      margin-top: 6px;
    }
  }

  .section-hint {
    font-size: 0.8rem;
    color: $marketplace-text-muted;
    margin: 0 0 14px 0;
    line-height: 1.4;
  }

  .no-fields-hint {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    font-style: italic;
    margin: 0;
  }

  .form-section {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid rgba($marketplace-panel-border, 0.8);

    h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: $marketplace-primary;
      margin: 0 0 14px 0;
      letter-spacing: 0.02em;
    }
  }

  .extraction-row,
  .matching-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 24px 32px;
    min-width: 0;
  }

  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 20px 28px;

    label {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      cursor: pointer;
      color: $marketplace-text;
      padding: 8px 12px;
      border-radius: 8px;
      transition: background 0.15s;

      &:hover {
        background: rgba($marketplace-primary, 0.04);
      }
    }

    input[type='checkbox'] {
      width: 18px;
      height: 18px;
      accent-color: $marketplace-primary;
    }
  }

  .number-field {
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: $marketplace-text-muted;
      margin-bottom: 6px;
    }

    input[type='number'] {
      width: 88px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid $marketplace-panel-border;
      font-size: 0.9rem;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: rgba($marketplace-primary, 0.4);
      }
    }
  }

  .form-row-inline {
    flex: 1 1 220px;
    min-width: 0;

    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: $marketplace-text-muted;
      margin-bottom: 6px;
    }

    input {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid $marketplace-panel-border;
      font-size: 0.9rem;
      transition: border-color 0.2s, box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: rgba($marketplace-primary, 0.4);
        box-shadow: 0 0 0 3px rgba($marketplace-primary, 0.08);
      }
    }
  }

  .form-footer {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid rgba($marketplace-panel-border, 0.8);
  }

  .enabled-toggle {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    color: $marketplace-text;
    padding: 12px 16px;
    background: rgba($marketplace-primary, 0.04);
    border-radius: 10px;
    transition: background 0.15s;

    &:hover {
      background: rgba($marketplace-primary, 0.08);
    }

    input[type='checkbox'] {
      width: 20px;
      height: 20px;
      accent-color: $marketplace-success;
    }
  }
}
</style>
