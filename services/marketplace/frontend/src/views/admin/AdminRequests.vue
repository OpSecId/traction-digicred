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
            <th>ID</th>
            <th>Type</th>
            <th>Organization</th>
            <th>Contact</th>
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
              <span class="org-name">{{ req.name }}</span>
              <span v-if="req.industry || req.jurisdiction" class="org-detail">
                {{ [req.industry, req.jurisdiction].filter(Boolean).join(' · ') }}
              </span>
            </td>
            <td>
              <template v-if="req.contactName || req.contactTitle || req.email">
                <span v-if="req.contactName || req.contactTitle" class="contact-name">
                  {{ req.contactName }}{{ req.contactTitle ? ` · ${req.contactTitle}` : '' }}
                </span>
                <span v-if="req.email" :class="(req.contactName || req.contactTitle) ? 'contact-email' : 'contact-name'">{{ req.email }}</span>
              </template>
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
              <div class="actions-group">
                <button type="button" class="btn-icon" title="View" @click="openDetail(req)">
                  <i class="pi pi-eye"></i>
                </button>
                <template v-if="req.status === 'pending'">
                  <button type="button" class="btn-icon btn-icon-reject" title="Reject" @click="rejectRequest(req.id)">
                    <i class="pi pi-times"></i>
                  </button>
                  <button type="button" class="btn-icon btn-icon-approve" title="Approve" @click="approveRequest(req.id)">
                    <i class="pi pi-check"></i>
                  </button>
                </template>
                <button
                  v-else-if="req.status === 'approved' && tenantByRequestId[req.id]"
                  type="button"
                  class="btn-icon btn-icon-revoke"
                  title="Revoke"
                  @click="confirmRevoke(tenantByRequestId[req.id].id)"
                >
                  <i class="pi pi-ban"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reservation detail modal -->
    <DetailModalCard
      v-if="showDetailModal"
      :title="`Reservation: ${selectedReservation?.referenceId || selectedReservation?.id || ''}`"
      :credential="selectedReservation?.credential ?? null"
      credential-title="ReservationCredential"
      @close="closeDetail"
    >
      <template v-if="selectedReservation" #details>
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
      </template>
      <template v-if="selectedReservation" #actions>
        <template v-if="selectedReservation.status === 'pending'">
          <button type="button" class="btn-reject" @click="rejectFromModal">
            <i class="pi pi-times"></i>
            Reject
          </button>
          <button type="button" class="btn-approve" @click="approveFromModal">
            <i class="pi pi-check"></i>
            Approve
          </button>
        </template>
        <template v-else-if="selectedReservation.status === 'approved' && selectedTenant">
          <button type="button" class="btn-revoke" @click="revokeFromModal">
            <i class="pi pi-ban"></i>
            Revoke tenant
          </button>
        </template>
      </template>
    </DetailModalCard>

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
import DetailModalCard from '@/components/DetailModalCard.vue';
import type { TenancyType } from '@/store/tenantRequestStore';
import type { TenantRequest } from '@/types/demo';
import * as adminApi from '@/api/admin';

const tenantStore = useTenantRequestStore();
const loading = ref(false);
const tenants = ref<adminApi.Tenant[]>([]);
const showDetailModal = ref(false);
const selectedReservation = ref<TenantRequest | null>(null);
const approvedApiKey = ref<string | null>(null);
const approvedEmail = ref<string | null>(null);
const apiKeyCopyFeedback = ref(false);

const allRequests = computed(() => [
  ...tenantStore.pendingRequests,
  ...tenantStore.approvedRequests,
  ...tenantStore.rejectedRequests,
]);

const tenantByRequestId = computed(() => {
  const map: Record<string, adminApi.Tenant> = {};
  for (const t of tenants.value) {
    if (t.tenantRequestId) map[t.tenantRequestId] = t;
  }
  return map;
});

const selectedTenant = computed(() => {
  const req = selectedReservation.value;
  if (!req?.id) return null;
  return tenantByRequestId.value[req.id] ?? null;
});

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

async function refresh() {
  loading.value = true;
  try {
    await Promise.all([tenantStore.fetchRequests(), loadTenants()]);
  } finally {
    loading.value = false;
  }
}

async function loadTenants() {
  try {
    tenants.value = await adminApi.listTenants();
  } catch {
    tenants.value = [];
  }
}

onMounted(() => refresh());

function openDetail(req: TenantRequest) {
  selectedReservation.value = req;
  showDetailModal.value = true;
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

async function confirmRevoke(tenantId: string) {
  if (!confirm('Revoke this tenant? They will no longer be able to sign in.')) return;
  try {
    await adminApi.revokeTenant(tenantId);
    await loadTenants();
    closeDetail();
  } catch {
    alert('Failed to revoke tenant.');
  }
}

async function revokeFromModal() {
  const t = selectedTenant.value;
  if (!t?.id) return;
  try {
    await adminApi.revokeTenant(t.id);
    await loadTenants();
    closeDetail();
  } catch {
    alert('Failed to revoke tenant.');
  }
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
    font-size: 0.7rem;
    font-weight: 600;
    padding: 3px 8px;
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
    padding: 2px 8px;
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

  /* Compact table rows */
  .admin-table th,
  .admin-table td {
    padding: 8px 12px;
    font-size: 0.875rem;
  }

  .org-name {
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .org-email,
  .org-detail {
    display: block;
    font-size: 0.75rem;
    color: $marketplace-text-muted;
  }

  .contact-name {
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .contact-email {
    display: block;
    font-size: 0.75rem;
    color: $marketplace-text-muted;
  }

  .contact-cell {
    font-size: 0.8125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }

  .cell-actions {
    min-width: 100px;
    white-space: nowrap;
  }

  .actions-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 0.875rem;
    border-radius: 6px;
    border: 1px solid $marketplace-panel-border;
    background: rgba(0, 0, 0, 0.02);
    color: $marketplace-text-muted;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s;

    &:hover {
      background: rgba(0, 51, 102, 0.06);
      color: $marketplace-primary;
      border-color: rgba(0, 51, 102, 0.2);
    }
  }

  .btn-icon-reject:hover {
    background: rgba(248, 73, 73, 0.08);
    color: $marketplace-danger;
    border-color: rgba(248, 73, 73, 0.3);
  }

  .btn-icon-approve:hover {
    background: rgba(51, 108, 55, 0.12);
    color: $marketplace-success;
    border-color: rgba(51, 108, 55, 0.3);
  }

  .btn-icon-revoke:hover {
    background: rgba(207, 150, 5, 0.1);
    color: $marketplace-warning;
    border-color: rgba(207, 150, 5, 0.4);
  }

  /* Modal action buttons (keep full-size) */
  .btn-approve,
  .btn-reject,
  .btn-revoke {
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

  .btn-approve {
    background: $marketplace-success;
    color: white;
  }

  .btn-reject {
    background: transparent;
    color: $marketplace-danger;
    border: 1px solid rgba(248, 73, 73, 0.4);
  }

  .btn-revoke {
    background: transparent;
    color: $marketplace-warning;
    border: 1px solid rgba(207, 150, 5, 0.5);

    &:hover {
      background: rgba(207, 150, 5, 0.1);
    }
  }
}

/* Modal - API key modal */
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
