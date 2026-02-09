<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content detail-modal-card">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <div class="modal-header-actions">
          <div v-if="hasCredential" class="view-toggle">
            <button type="button" :class="{ active: !showJson }" @click="showJson = false">
              <i class="pi pi-list"></i> Details
            </button>
            <button type="button" :class="{ active: showJson }" @click="showJson = true">
              <i class="pi pi-code"></i> JSON
            </button>
          </div>
          <button type="button" class="modal-close" aria-label="Close" @click="$emit('close')">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>
      <div class="modal-body" :class="{ 'modal-body--json': showJson && hasCredential }">
        <template v-if="!showJson">
          <slot name="details"> </slot>
        </template>
        <div v-else-if="hasCredential" class="raw-viewer raw-viewer-full">
          <div class="raw-toolbar">
            <span class="raw-title"><i class="pi pi-file"></i> {{ credentialTitle }}</span>
            <button type="button" class="btn-copy" :class="{ copied: copyFeedback }" @click="copyCredential">
              <i :class="copyFeedback ? 'pi pi-check' : 'pi pi-copy'"></i>
              {{ copyFeedback ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <div class="raw-content">
            <pre class="credential-json" v-html="highlightedCredential"></pre>
          </div>
        </div>
      </div>
      <div v-if="$slots.actions && !showJson" class="modal-actions">
        <slot name="actions"> </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    credential?: Record<string, unknown> | null;
    credentialTitle?: string;
  }>(),
  { credentialTitle: 'Credential' }
);

defineEmits<{ (e: 'close'): void }>();

const showJson = ref(false);
const copyFeedback = ref(false);

const hasCredential = computed(() => props.credential != null && Object.keys(props.credential).length > 0);

const highlightedCredential = computed(() => {
  if (!props.credential) return '';
  return highlightJson(JSON.stringify(props.credential, null, 2));
});

function highlightJson(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]*)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

async function copyCredential() {
  if (!props.credential) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.credential, null, 2));
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 1500);
  } catch {
    /* clipboard fallback */
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  background: $marketplace-bg-card;
  border-radius: 12px;
  max-width: 680px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $marketplace-panel-border;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: $marketplace-text;
  }
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: inline-flex;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 3px;

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-weight: 500;
    color: $marketplace-text-muted;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: color 0.2s, background 0.2s;

    &:hover {
      color: $marketplace-text;
    }

    &.active {
      background: white;
      color: $marketplace-primary;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }
  }
}

.modal-close {
  padding: 8px;
  border: none;
  background: transparent;
  color: $marketplace-text-muted;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
}

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;

  &.modal-body--json {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px;
  }
}

.modal-actions {
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid $marketplace-panel-border;
}

.raw-viewer {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.raw-viewer-full {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  .raw-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
}

.modal-body--json .raw-viewer-full {
  flex: 1;
  min-height: 0;
}

.raw-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(180deg, #2d2d2d 0%, #252525 100%);
  color: #b0b0b0;
  font-size: 0.8rem;
}

.raw-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  i {
    color: #7dd3fc;
  }
}

.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #7dd3fc;
  background: rgba(125, 211, 252, 0.12);
  border: 1px solid rgba(125, 211, 252, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(125, 211, 252, 0.2);
  }

  &.copied {
    color: #86efac;
    background: rgba(134, 239, 172, 0.15);
    border-color: rgba(134, 239, 172, 0.4);
  }
}

.raw-viewer-full .raw-content {
  background: #1a1a1a;
}

.credential-json {
  margin: 0;
  padding: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  font-size: 0.72rem;
  line-height: 1.6;
  color: #e5e5e5;
  overflow-x: auto;
  white-space: pre;

  :deep(.json-key) {
    color: #7dd3fc;
  }

  :deep(.json-string) {
    color: #86efac;
  }

  :deep(.json-number) {
    color: #fde047;
  }

  :deep(.json-bool) {
    color: #c084fc;
  }

  :deep(.json-null) {
    color: #94a3b8;
  }
}

/* Shared detail layout styles for slot content */
:deep(.detail-pane) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.detail-hero) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(0, 51, 102, 0.06) 0%, rgba(0, 51, 102, 0.02) 100%);
  border: 1px solid rgba(0, 51, 102, 0.15);
  border-radius: 12px;
}

:deep(.hero-main) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.hero-name) {
  font-size: 1.15rem;
  font-weight: 700;
  color: $marketplace-text;
}

:deep(.detail-strip) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 12px 0;
  font-size: 0.85rem;
  color: $marketplace-text-muted;
}

:deep(.strip-item) {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  i {
    opacity: 0.7;
    font-size: 0.8rem;
  }
}

:deep(.status-badge-lg) {
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 20px;
}

:deep(.detail-sections) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

:deep(.detail-card) {
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid $marketplace-panel-border;
  border-radius: 10px;

  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 0.9rem;
    font-weight: 600;
    color: $marketplace-text;

    i {
      color: $marketplace-primary;
      font-size: 0.85rem;
    }
  }
}

:deep(.detail-list) {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 16px;
  margin: 0;
  font-size: 0.9rem;

  dt {
    margin: 0;
    color: $marketplace-text-muted;
    font-weight: 500;
    font-size: 0.85rem;
  }

  dd {
    margin: 0;
    color: $marketplace-text;
    word-break: break-word;

    code {
      font-size: 0.8rem;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 4px;
    }

    a {
      color: $marketplace-primary;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

:deep(.text-muted) {
  color: $marketplace-text-muted;
}

:deep(.loading-state) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 2rem;
  color: $marketplace-text-muted;

  i {
    font-size: 1.5rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }
}

:deep(.status-badge) {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;

  &.active {
    background: rgba(51, 108, 55, 0.15);
    color: $marketplace-success;
  }

  &.revoked {
    background: rgba(200, 50, 50, 0.15);
    color: $marketplace-danger;
  }

  &.pending {
    background: rgba(90, 90, 90, 0.12);
    color: #4a5568;
  }

  &.approved {
    background: rgba(51, 108, 55, 0.15);
    color: $marketplace-success;
  }

  &.rejected {
    background: rgba(248, 73, 73, 0.12);
    color: $marketplace-danger;
  }
}

:deep(.type-badge) {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  white-space: nowrap;

  &.employer {
    background: rgba(0, 51, 102, 0.12);
    color: $marketplace-primary;
  }

  &.scholarship-admin {
    background: rgba(51, 108, 55, 0.12);
    color: $marketplace-success;
  }

  &.education-institution {
    background: rgba(102, 102, 204, 0.12);
    color: $marketplace-accent-alt;
  }

  &.government-service {
    background: rgba(90, 90, 90, 0.12);
    color: #4a5568;
  }
}
</style>
