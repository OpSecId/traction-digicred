<template>
  <div class="admin-requests">
    <div class="section-header">
      <div>
        <h2 class="section-title">Reservations</h2>
        <p class="section-desc">Marketplace tenancy reservations (ReservationCredential)</p>
      </div>
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

    <div v-if="loading && allRequests.length === 0" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading reservations...</p>
    </div>
    <div v-else-if="allRequests.length === 0" class="empty-state">
      <i class="pi pi-inbox"></i>
      <p>No reservations</p>
    </div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Reservation ID</th>
            <th>Tenancy type</th>
            <th>Organization</th>
            <th>Contact</th>
            <th>Industry</th>
            <th>Submitted</th>
            <th>Status</th>
            <th class="cell-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="req in allRequests"
            :key="req.id"
            :class="{ processed: req.status !== 'pending' }"
            @click="openDetail(req)"
          >
            <td>
              <code class="reservation-id">{{ req.referenceId || req.id }}</code>
            </td>
            <td>
              <span class="type-badge" :class="tenancyTypeClass(req.tenancyType)">
                {{ req.tenancyType }}
              </span>
            </td>
            <td>
              <strong>{{ req.name }}</strong>
              <br />
              <span class="text-muted text-small">{{ req.email }}</span>
            </td>
            <td>
              <span v-if="req.contactName">
                {{ req.contactName }}{{ req.contactTitle ? ` (${req.contactTitle})` : '' }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span v-if="req.industry">{{ req.industry }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>{{ formatDate(req.submittedAt) }}</td>
            <td>
              <span v-if="req.status !== 'pending'" class="status-badge" :class="req.status">
                {{ req.status }}
              </span>
              <span v-else class="status-badge pending">Pending</span>
            </td>
            <td class="cell-actions" @click.stop>
              <template v-if="req.status === 'pending'">
                <button type="button" class="btn-view" @click="openDetail(req)">
                  <i class="pi pi-eye"></i>
                  View
                </button>
                <button type="button" class="btn-reject" @click="rejectRequest(req.id)">
                  <i class="pi pi-times"></i>
                  Reject
                </button>
                <button type="button" class="btn-approve" @click="approveRequest(req.id)">
                  <i class="pi pi-check"></i>
                  Approve
                </button>
              </template>
              <template v-else>
                <button type="button" class="btn-view" @click="openDetail(req)">
                  <i class="pi pi-eye"></i>
                  View
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reservation detail modal (credential-centric) -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content reservation-detail-modal">
        <div class="modal-header">
          <h3>Reservation: {{ selectedReservation?.referenceId || selectedReservation?.id }}</h3>
          <div class="modal-header-actions">
            <div class="view-toggle">
              <button type="button" :class="{ active: !showRawCredential }" @click="showRawCredential = false">
                <i class="pi pi-list"></i> Details
              </button>
              <button type="button" :class="{ active: showRawCredential }" @click="showRawCredential = true">
                <i class="pi pi-code"></i> JSON
              </button>
            </div>
            <button type="button" class="modal-close" aria-label="Close" @click="closeDetail">
              <i class="pi pi-times"></i>
            </button>
          </div>
        </div>
        <div v-if="selectedReservation" class="modal-body">
          <!-- Details view -->
          <template v-if="!showRawCredential">
          <div class="detail-pane">
            <div class="detail-hero">
              <div class="hero-main">
                <span class="hero-name">{{ selectedReservation.name }}</span>
                <span :class="['type-badge', tenancyTypeClass(selectedReservation.tenancyType)]">{{ selectedReservation.tenancyType }}</span>
              </div>
              <span :class="['status-badge status-badge-lg', selectedReservation.status]">{{ selectedReservation.status }}</span>
            </div>

            <div class="detail-strip">
              <span class="strip-item"><i class="pi pi-id-card"></i> {{ selectedReservation.referenceId }}</span>
              <span v-if="credValidFrom" class="strip-item"><i class="pi pi-calendar"></i> {{ credValidFrom }} – {{ credValidUntil }}</span>
              <span class="strip-item"><i class="pi pi-clock"></i> Submitted {{ formatDate(selectedReservation.submittedAt) }}</span>
            </div>

            <div class="detail-sections">
              <section class="detail-card">
                <h4><i class="pi pi-user"></i> Contact</h4>
                <dl class="detail-list">
                  <dt>Name</dt>
                  <dd>{{ selectedReservation.contactName || '—' }}{{ selectedReservation.contactTitle ? ` (${selectedReservation.contactTitle})` : '' }}</dd>
                  <dt>Email</dt>
                  <dd><a :href="`mailto:${selectedReservation.email}`">{{ selectedReservation.email }}</a></dd>
                  <dt>Phone</dt>
                  <dd>{{ selectedReservation.contactPhone || '—' }}</dd>
                </dl>
              </section>
              <section class="detail-card">
                <h4><i class="pi pi-building"></i> Business</h4>
                <dl class="detail-list">
                  <dt>Registration ID</dt>
                  <dd>{{ selectedReservation.registrationId || '—' }}</dd>
                  <dt>Jurisdiction</dt>
                  <dd>{{ selectedReservation.jurisdiction || '—' }}</dd>
                  <dt>Address</dt>
                  <dd>{{ selectedReservation.businessAddress || '—' }}</dd>
                  <dt>Industry</dt>
                  <dd>{{ selectedReservation.industry || '—' }}</dd>
                  <dt>Intended use</dt>
                  <dd>{{ selectedReservation.intendedUse || '—' }}</dd>
                  <dt>Website</dt>
                  <dd>
                    <a v-if="selectedReservation.website" :href="selectedReservation.website" target="_blank" rel="noopener">{{ selectedReservation.website }}</a>
                    <span v-else class="text-muted">—</span>
                  </dd>
                </dl>
              </section>
            </div>
          </div>

          <div v-if="selectedReservation.status === 'pending'" class="modal-actions">
            <button type="button" class="btn-reject" @click="rejectFromModal">
              <i class="pi pi-times"></i>
              Reject
            </button>
            <button type="button" class="btn-approve" @click="approveFromModal">
              <i class="pi pi-check"></i>
              Approve
            </button>
          </div>
          </template>

          <!-- JSON view -->
          <div v-else-if="selectedReservation.credential" class="raw-viewer raw-viewer-full">
            <div class="raw-toolbar">
              <span class="raw-title"><i class="pi pi-file"></i> ReservationCredential</span>
              <button type="button" class="btn-copy" @click="copyCredential" :class="{ copied: copyFeedback }">
                <i :class="copyFeedback ? 'pi pi-check' : 'pi pi-copy'"></i>
                {{ copyFeedback ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <div class="raw-content">
              <pre class="credential-json" v-html="highlightedCredential"></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- API key modal (shown after approval) -->
    <div v-if="approvedApiKey" class="modal-overlay" @click.self="closeApiKeyModal">
      <div class="modal-content api-key-modal">
        <div class="modal-header">
          <h3>Reservation approved</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="closeApiKeyModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="api-key-intro">Share this API key with the tenant. They will use their email and this API key to sign in.</p>
          <div class="api-key-display">
            <code class="api-key-value">{{ approvedApiKey }}</code>
            <button type="button" class="btn-copy-api-key" :class="{ copied: apiKeyCopyFeedback }" @click="copyApiKey">
              <i :class="apiKeyCopyFeedback ? 'pi pi-check' : 'pi pi-copy'"></i>
              {{ apiKeyCopyFeedback ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <p v-if="approvedEmail" class="api-key-hint">
            <strong>Email:</strong> {{ approvedEmail }}<br />
            <strong>API key:</strong> (shown above – save it, it won't be shown again)
          </p>
          <button type="button" class="modal-done-btn" @click="closeApiKeyModal">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import type { TenancyType } from '@/store/tenantRequestStore';
import type { TenantRequest } from '@/types/demo';

const tenantStore = useTenantRequestStore();
const loading = ref(false);
const showDetailModal = ref(false);
const selectedReservation = ref<TenantRequest | null>(null);
const showRawCredential = ref(false);
const copyFeedback = ref(false);
const approvedApiKey = ref<string | null>(null);
const approvedEmail = ref<string | null>(null);
const apiKeyCopyFeedback = ref(false);

const allRequests = computed(() => [
  ...tenantStore.pendingRequests,
  ...tenantStore.approvedRequests,
  ...tenantStore.rejectedRequests,
]);

const credValidFrom = computed(() => {
  const c = selectedReservation.value?.credential as Record<string, unknown> | undefined;
  const v = c?.validFrom as string | undefined;
  return v ? new Date(v).toLocaleDateString(undefined, { dateStyle: 'medium' }) : null;
});

const credValidUntil = computed(() => {
  const c = selectedReservation.value?.credential as Record<string, unknown> | undefined;
  const v = c?.validUntil as string | undefined;
  return v ? new Date(v).toLocaleDateString(undefined, { dateStyle: 'medium' }) : null;
});

const highlightedCredential = computed(() => {
  const cred = selectedReservation.value?.credential as Record<string, unknown> | undefined;
  if (!cred) return '';
  return highlightJson(JSON.stringify(cred, null, 2));
});

async function refresh() {
  loading.value = true;
  try {
    await tenantStore.fetchRequests();
  } finally {
    loading.value = false;
  }
}

onMounted(() => refresh());

function openDetail(req: TenantRequest) {
  selectedReservation.value = req;
  showDetailModal.value = true;
  showRawCredential.value = false;
}

function closeDetail() {
  showDetailModal.value = false;
  selectedReservation.value = null;
}

async function approveFromModal() {
  if (!selectedReservation.value?.id) return;
  const result = await tenantStore.approve(selectedReservation.value.id);
  closeDetail();
  if (result?.apiKey) {
    approvedApiKey.value = result.apiKey;
    approvedEmail.value = result.email ?? selectedReservation.value.email ?? null;
  }
}

async function rejectFromModal() {
  if (selectedReservation.value?.id) {
    await tenantStore.reject(selectedReservation.value.id);
    closeDetail();
  }
}

async function approveRequest(id: string) {
  const req = allRequests.value.find((r) => r.id === id);
  const result = await tenantStore.approve(id);
  if (result?.apiKey) {
    approvedApiKey.value = result.apiKey;
    approvedEmail.value = result.email ?? req?.email ?? null;
  }
}

function closeApiKeyModal() {
  approvedApiKey.value = null;
  approvedEmail.value = null;
}

async function copyApiKey() {
  if (!approvedApiKey.value) return;
  try {
    await navigator.clipboard.writeText(approvedApiKey.value);
    apiKeyCopyFeedback.value = true;
    setTimeout(() => { apiKeyCopyFeedback.value = false; }, 1500);
  } catch {
    /* clipboard fallback */
  }
}

async function rejectRequest(id: string) {
  await tenantStore.reject(id);
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCredential(cred: Record<string, unknown>) {
  return JSON.stringify(cred, null, 2);
}

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
  const cred = selectedReservation.value?.credential as Record<string, unknown> | undefined;
  if (!cred) return;
  try {
    await navigator.clipboard.writeText(formatCredential(cred));
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 1500);
  } catch {
    /* clipboard fallback */
  }
}

function tenancyTypeClass(type: TenancyType | undefined) {
  if (!type) return {};
  return {
    employer: type === 'Employer',
    'scholarship-admin': type === 'Scholarship Admin',
    'education-institution': type === 'Education Institution',
    'government-service': type === 'Government Service',
  };
}
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-requests {
  .section-desc {
    margin: -8px 0 0;
    font-size: 0.9rem;
    color: $marketplace-text-muted;
  }

  tr {
    cursor: pointer;
    transition: background 0.15s;
    &:hover {
      background: rgba(0, 51, 102, 0.04);
    }
  }

  tr.processed {
    opacity: 0.85;
  }

  .reservation-id {
    font-size: 0.8rem;
    padding: 2px 6px;
    background: rgba(0, 51, 102, 0.08);
    border-radius: 4px;
    color: $marketplace-primary;
  }

  .text-muted {
    color: $marketplace-text-muted;
    font-size: 0.85rem;
  }

  .text-small {
    font-size: 0.8rem;
  }

  .type-badge {
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

  .status-badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;

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

  .cell-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .btn-view,
  .btn-approve,
  .btn-reject {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: opacity 0.2s;
  }

  .btn-view {
    background: transparent;
    color: $marketplace-primary;
    border: 1px solid rgba(0, 51, 102, 0.3);
  }

  .btn-approve {
    background: $marketplace-success;
    color: white;
  }

  .btn-reject {
    background: transparent;
    color: $marketplace-danger;
    border: 1px solid rgba(248, 73, 73, 0.4);
  }
}

/* Modal */
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
  background: $marketplace-bg-card;
  border-radius: 12px;
  max-width: 680px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-header {
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
  padding: 20px;
}

.detail-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(0, 51, 102, 0.06) 0%, rgba(0, 51, 102, 0.02) 100%);
  border: 1px solid rgba(0, 51, 102, 0.15);
  border-radius: 12px;
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: $marketplace-text;
}

.detail-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 12px 0;
  font-size: 0.85rem;
  color: $marketplace-text-muted;
}

.strip-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  i { opacity: 0.7; font-size: 0.8rem; }
}

.status-badge-lg {
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: 20px;
}

.detail-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-card {
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

    i { color: $marketplace-primary; font-size: 0.85rem; }
  }
}

.detail-list {
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
      &:hover { text-decoration: underline; }
    }
  }
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
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
  height: 420px;
  .raw-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
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

  i { color: #7dd3fc; }
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

  &:hover { background: rgba(125, 211, 252, 0.2); }
  &.copied {
    color: #86efac;
    background: rgba(134, 239, 172, 0.15);
    border-color: rgba(134, 239, 172, 0.4);
  }
}

.raw-content {
  background: #1a1a1a;
  max-height: 320px;
  overflow: auto;
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

  :deep(.json-key) { color: #7dd3fc; }
  :deep(.json-string) { color: #86efac; }
  :deep(.json-number) { color: #fde047; }
  :deep(.json-bool) { color: #c084fc; }
  :deep(.json-null) { color: #94a3b8; }
}

.api-key-modal {
  max-width: 480px;
}

.api-key-intro {
  margin: 0 0 16px;
  font-size: 0.95rem;
  color: $marketplace-text-muted;
}

.api-key-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid $marketplace-panel-border;
  border-radius: 8px;
  margin-bottom: 16px;
}

.api-key-value {
  flex: 1;
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  word-break: break-all;
}

.btn-copy-api-key {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: $marketplace-primary;
  background: rgba(0, 51, 102, 0.08);
  border: 1px solid rgba(0, 51, 102, 0.25);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { background: rgba(0, 51, 102, 0.12); }
  &.copied {
    color: $marketplace-success;
    background: rgba(51, 108, 55, 0.1);
    border-color: rgba(51, 108, 55, 0.3);
  }
}

.api-key-hint {
  margin: 0 0 20px;
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  line-height: 1.6;
}

.modal-done-btn {
  display: block;
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: $marketplace-primary;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
}
</style>
