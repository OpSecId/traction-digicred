<template>
  <div class="admin-transcript-analysis">
    <div class="section-header">
      <h2 class="section-title">Transcript analysis</h2>
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

    <p class="section-desc">
      Configure the presentation request (what to ask holders) and desired output (what to extract from transcript credentials for job matching).
    </p>

    <div v-if="loading && !config" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading config...</p>
    </div>
    <form v-else class="config-form" @submit.prevent="save">
      <div class="form-section">
        <h3>Presentation request</h3>
        <p class="hint">Credential types to request from holders (comma-separated)</p>
        <input
          v-model="form.credentialTypesStr"
          type="text"
          placeholder="CollegeTranscript, HighSchoolTranscript, Diploma"
          class="input-wide"
        />
      </div>

      <div class="form-section">
        <h3>Desired output (extraction)</h3>
        <p class="hint">What to extract from the transcript for matching</p>
        <div class="checkbox-row">
          <label>
            <input v-model="form.extraction.includeProgram" type="checkbox" />
            Include program/degree
          </label>
        </div>
        <div class="checkbox-row">
          <label>
            <input v-model="form.extraction.includeGpa" type="checkbox" />
            Include GPA
          </label>
        </div>
        <div class="checkbox-row">
          <label>
            <input v-model="form.extraction.includeCourses" type="checkbox" />
            Include courses
          </label>
        </div>
        <div class="input-row">
          <label for="maxCourses">Max courses to extract</label>
          <input
            id="maxCourses"
            v-model.number="form.extraction.maxCourses"
            type="number"
            min="1"
            max="100"
          />
        </div>
      </div>

      <div class="form-section">
        <h3>Matching</h3>
        <p class="hint">Job fields to match against (comma-separated)</p>
        <input
          v-model="form.matchFieldsStr"
          type="text"
          placeholder="industry, occupation, educationRequirements"
          class="input-wide"
        />
        <div class="input-row">
          <label for="minScore">Minimum match score (0–1)</label>
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

      <div class="form-section">
        <div class="checkbox-row">
          <label>
            <input v-model="form.enabled" type="checkbox" />
            Transcript analysis enabled
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

const form = reactive({
  credentialTypesStr: '',
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
  const current = JSON.stringify({
    credentialTypes: form.credentialTypesStr.split(',').map((s) => s.trim()).filter(Boolean),
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
  form.credentialTypesStr = c.credentialTypes.join(', ');
  form.extraction.includeProgram = c.extraction.includeProgram;
  form.extraction.includeGpa = c.extraction.includeGpa;
  form.extraction.includeCourses = c.extraction.includeCourses;
  form.extraction.maxCourses = c.extraction.maxCourses;
  form.matchFieldsStr = c.matching.matchFields.join(', ');
  form.matching.minScore = c.matching.minScore;
  form.enabled = c.enabled;
  originalJson.value = JSON.stringify(c);
}

async function load() {
  loading.value = true;
  try {
    const c = await adminApi.getCredentialAnalysisConfig();
    applyConfig(c);
  } catch {
    config.value = null;
  } finally {
    loading.value = false;
  }
}

async function save() {
  const payload: adminApi.CredentialAnalysisConfig = {
    credentialTypes: form.credentialTypesStr.split(',').map((s) => s.trim()).filter(Boolean),
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

.admin-transcript-analysis {
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

  .section-desc {
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    margin: -8px 0 20px 0;
  }

  .config-form {
    max-width: 560px;
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

  .checkbox-row {
    margin-bottom: 10px;

    label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      cursor: pointer;
    }

    input[type='checkbox'] {
      width: 18px;
      height: 18px;
    }
  }

  .input-row {
    margin-top: 12px;

    label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 6px;
      color: $marketplace-text;
    }

    input[type='number'] {
      width: 120px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid $marketplace-panel-border;
      font-size: 0.9rem;
    }
  }

  .input-wide {
    width: 100%;
    max-width: 400px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid $marketplace-panel-border;
    font-size: 0.9rem;
  }
}
</style>
