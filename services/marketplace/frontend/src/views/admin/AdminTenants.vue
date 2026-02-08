<template>
  <div class="admin-tenants">
    <div class="section-header">
      <div>
        <h2 class="section-title">Provisioned tenants</h2>
        <p class="section-desc">Tenants created when onboarding requests are approved, or via out-of-band creation.</p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="create-btn"
          @click="showCreateModal = true"
        >
          <i class="pi pi-plus"></i>
          Create tenant
        </button>
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
    </div>

    <div v-if="loading && tenants.length === 0" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading tenants...</p>
    </div>
    <div v-else-if="tenants.length === 0" class="empty-state">
      <i class="pi pi-users"></i>
      <p>No provisioned tenants yet</p>
      <p class="hint">Tenants are created when onboarding requests are approved, or create one manually for out-of-band onboarding.</p>
    </div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Tenant ID</th>
            <th>Status</th>
            <th>DID</th>
            <th>Wallet</th>
            <th>Request</th>
            <th>Created</th>
            <th class="cell-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(t, idx) in validTenants"
            :key="t?.id ?? `row-${idx}`"
            :class="{ processed: t?.status === 'revoked' }"
            @click="t?.id && openDetails(t.id)"
          >
            <td><code class="tenant-id">{{ t?.id }}</code></td>
            <td>
              <span v-if="t?.status === 'revoked'" class="status-badge revoked">Revoked</span>
              <span v-else class="status-badge active">Active</span>
            </td>
            <td><code v-if="t?.did" class="mono">{{ t.did }}</code><span v-else class="text-muted">—</span></td>
            <td><code v-if="t?.walletId" class="mono">{{ t.walletId }}</code><span v-else class="text-muted">—</span></td>
            <td><code v-if="t?.tenantRequestId" class="mono truncate">{{ shortId(t.tenantRequestId) }}</code><span v-else class="text-muted">—</span></td>
            <td>{{ t?.createdAt ? formatDate(t.createdAt) : '—' }}</td>
            <td class="cell-actions" @click.stop>
              <div class="actions-wrap">
                <button type="button" class="btn-view" @click="t?.id && openDetails(t.id)">
                  <i class="pi pi-eye"></i>
                  View
                </button>
                <button
                  v-if="t?.status !== 'revoked'"
                  type="button"
                  class="btn-revoke"
                  @click="t && confirmRevoke(t)"
                >
                  <i class="pi pi-ban"></i>
                  Revoke
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tenant details modal -->
    <DetailModalCard
      v-if="showDetailsModal"
      title="Tenant details"
      :credential="selectedDetails?.tenant?.credential ?? null"
      credential-title="MarketplaceProfileCredential"
      @close="closeDetailsModal"
    >
      <template v-if="detailsLoading" #details>
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading...</p>
        </div>
      </template>
      <template v-else-if="selectedDetails && !selectedDetails.tenant" #details>
        <p class="text-muted">Tenant not found.</p>
      </template>
      <template v-else-if="selectedDetails?.tenant" #details>
        <div class="detail-pane">
          <div class="detail-hero">
            <div class="hero-main">
              <span class="hero-name">{{ tenantDisplayName }}</span>
            </div>
            <span :class="['status-badge status-badge-lg', selectedDetails.tenant.status || 'active']">{{ selectedDetails.tenant.status || 'Active' }}</span>
          </div>

          <div class="detail-strip">
            <span v-if="selectedDetails.tenant.id" class="strip-item"><i class="pi pi-id-card"></i> {{ selectedDetails.tenant.id }}</span>
            <span v-if="selectedDetails.tenant.did" class="strip-item"><i class="pi pi-key"></i> {{ selectedDetails.tenant.did }}</span>
            <span v-if="selectedDetails.tenant.walletId" class="strip-item"><i class="pi pi-wallet"></i> {{ selectedDetails.tenant.walletId }}</span>
            <span class="strip-item"><i class="pi pi-clock"></i> Created {{ formatDate(selectedDetails.tenant.createdAt) }}</span>
          </div>

          <div class="detail-sections">
            <section class="detail-card">
              <h4><i class="pi pi-database"></i> Tenant</h4>
              <dl class="detail-list">
                <dt>ID</dt>
                <dd><code>{{ selectedDetails.tenant.id }}</code></dd>
                <dt>Status</dt>
                <dd><span :class="['status-badge', selectedDetails.tenant.status || 'active']">{{ selectedDetails.tenant.status || 'Active' }}</span></dd>
                <dt>DID</dt>
                <dd><code v-if="selectedDetails.tenant.did">{{ selectedDetails.tenant.did }}</code><span v-else class="text-muted">—</span></dd>
                <dt>Wallet ID</dt>
                <dd><code v-if="selectedDetails.tenant.walletId">{{ selectedDetails.tenant.walletId }}</code><span v-else class="text-muted">—</span></dd>
                <dt>Created</dt>
                <dd>{{ selectedDetails.tenant.createdAt ? formatDate(selectedDetails.tenant.createdAt) : '—' }}</dd>
              </dl>
            </section>
            <section v-if="selectedDetails.tenantRequest" class="detail-card">
              <h4><i class="pi pi-user"></i> Request details</h4>
              <dl class="detail-list">
                <dt>Name</dt>
                <dd>{{ selectedDetails.tenantRequest.name }}</dd>
                <dt>Email</dt>
                <dd><a :href="`mailto:${selectedDetails.tenantRequest.email}`">{{ selectedDetails.tenantRequest.email }}</a></dd>
                <dt>Type</dt>
                <dd>{{ selectedDetails.tenantRequest.tenancyType || '—' }}</dd>
                <dt>Industry</dt>
                <dd>{{ selectedDetails.tenantRequest.industry || '—' }}</dd>
                <dt>Website</dt>
                <dd><a v-if="selectedDetails.tenantRequest.website" :href="selectedDetails.tenantRequest.website" target="_blank" rel="noopener">{{ selectedDetails.tenantRequest.website }}</a><span v-else class="text-muted">—</span></dd>
                <dt>Contact</dt>
                <dd>{{ selectedDetails.tenantRequest.contactName || '—' }}{{ selectedDetails.tenantRequest.contactTitle ? ` (${selectedDetails.tenantRequest.contactTitle})` : '' }}</dd>
              </dl>
            </section>
          </div>
        </div>
      </template>
      <template v-if="selectedDetails?.tenant && selectedDetails.tenant.status !== 'revoked'" #actions>
        <button type="button" class="btn-danger" @click="doRevoke(selectedDetails.tenant.id)">
          <i class="pi pi-ban"></i>
          Revoke access
        </button>
      </template>
    </DetailModalCard>

    <!-- Revoke confirmation modal -->
    <div v-if="revokeTarget" class="modal-overlay" @click.self="revokeTarget = null">
      <div class="modal-content revoke-modal">
        <div class="revoke-icon"><i class="pi pi-ban"></i></div>
        <h3>Revoke access</h3>
        <p>This tenant will no longer be able to use the marketplace.</p>
        <p v-if="revokeError" class="revoke-error">{{ revokeError }}</p>
        <div class="revoke-actions">
          <button type="button" class="revoke-cancel" @click="revokeTarget = null">Cancel</button>
          <button type="button" class="revoke-confirm" :disabled="revoking" @click="confirmRevokeSubmit">
            <i v-if="revoking" class="pi pi-spin pi-spinner"></i>
            {{ revoking ? 'Revoking...' : 'Revoke' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create tenant modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-content create-tenant-modal">
        <div class="modal-header">
          <h3>Create tenant (out-of-band)</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="closeCreateModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <p class="modal-hint">Add a tenant that was provisioned outside the normal onboarding flow. All fields are optional.</p>
        <form @submit.prevent="submitCreate">
          <div class="form-row">
            <label for="tenantRequestId">Tenant request ID</label>
            <input
              id="tenantRequestId"
              v-model="createForm.tenantRequestId"
              type="text"
              placeholder="urn:uuid:..."
            />
          </div>
          <div class="form-row">
            <label for="did">DID</label>
            <input
              id="did"
              v-model="createForm.did"
              type="text"
              placeholder="did:web:..."
            />
          </div>
          <div class="form-row">
            <label for="walletId">Wallet ID</label>
            <input
              id="walletId"
              v-model="createForm.walletId"
              type="text"
              placeholder="wallet-id"
            />
          </div>
          <p v-if="createError" class="form-error">{{ createError }}</p>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeCreateModal">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="creating">
              <i v-if="creating" class="pi pi-spin pi-spinner"></i>
              {{ creating ? 'Creating...' : 'Create tenant' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import * as adminApi from '@/api/admin';
import DetailModalCard from '@/components/DetailModalCard.vue';

const tenants = ref<adminApi.Tenant[]>([]);
const validTenants = computed(() => tenants.value.filter((t): t is adminApi.Tenant => t != null && t.id != null));
const loading = ref(false);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref('');
const showDetailsModal = ref(false);
const detailsLoading = ref(false);
const selectedDetails = ref<adminApi.TenantDetails | null>(null);
const revokeTarget = ref<adminApi.Tenant | null>(null);
const revoking = ref(false);
const revokeError = ref('');

const createForm = reactive({
  tenantRequestId: '',
  did: '',
  walletId: '',
});

const tenantDisplayName = computed(() => {
  const d = selectedDetails.value;
  if (!d?.tenant) return '';
  return d.tenantRequest?.name || d.tenant.id || 'Tenant';
});

function shortId(id: string) {
  if (!id) return '';
  if (id.length <= 20) return id;
  return id.slice(0, 8) + '…' + id.slice(-8);
}

async function openDetails(id: string) {
  showDetailsModal.value = true;
  selectedDetails.value = null;
  detailsLoading.value = true;
  try {
    const data = await adminApi.getTenantDetails(id);
    // Normalize: API returns { tenant, tenantRequest }; handle if tenant is at root (legacy/different format)
    const raw = data as unknown as Record<string, unknown> | null | undefined;
    selectedDetails.value = raw?.tenant
      ? (data as adminApi.TenantDetails)
      : raw?.id
        ? { tenant: raw as unknown as adminApi.Tenant, tenantRequest: (raw?.tenantRequest as adminApi.TenantRequest | null) ?? null }
        : null;
  } catch {
    selectedDetails.value = null;
  } finally {
    detailsLoading.value = false;
  }
}

function closeDetailsModal() {
  showDetailsModal.value = false;
  selectedDetails.value = null;
}

function confirmRevoke(t: adminApi.Tenant) {
  revokeTarget.value = t;
  revokeError.value = '';
}

async function confirmRevokeSubmit() {
  if (!revokeTarget.value) return;
  revoking.value = true;
  revokeError.value = '';
  try {
    await adminApi.revokeTenant(revokeTarget.value.id);
    revokeTarget.value = null;
    closeDetailsModal();
    await refresh();
  } catch (err: unknown) {
    const msg = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
      : null;
    revokeError.value = msg || 'Failed to revoke tenant';
  } finally {
    revoking.value = false;
  }
}

async function doRevoke(id: string) {
  revokeTarget.value = { id };
  closeDetailsModal();
  await confirmRevokeSubmit();
}

function closeCreateModal() {
  showCreateModal.value = false;
  createForm.tenantRequestId = '';
  createForm.did = '';
  createForm.walletId = '';
  createError.value = '';
}

async function submitCreate() {
  createError.value = '';
  creating.value = true;
  try {
    await adminApi.createTenant({
      tenantRequestId: createForm.tenantRequestId.trim() || undefined,
      did: createForm.did.trim() || undefined,
      walletId: createForm.walletId.trim() || undefined,
    });
    closeCreateModal();
    await refresh();
  } catch (err: unknown) {
    const msg = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
      : null;
    createError.value = msg || 'Failed to create tenant';
  } finally {
    creating.value = false;
  }
}

async function refresh() {
  loading.value = true;
  try {
    tenants.value = await adminApi.listTenants();
  } catch {
    tenants.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => refresh());

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-tenants {
  .section-desc {
    margin: -8px 0 0;
    font-size: 0.9rem;
    color: $marketplace-text-muted;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .create-btn {
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

    &:hover {
      opacity: 0.9;
    }
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

  .tenant-id {
    font-size: 0.8rem;
    padding: 2px 6px;
    background: rgba(0, 51, 102, 0.08);
    border-radius: 4px;
    color: $marketplace-primary;
    font-family: ui-monospace, monospace;
  }

  .mono {
    font-size: 0.8rem;
    word-break: break-all;
    font-family: ui-monospace, monospace;
  }

  .text-muted {
    color: $marketplace-text-muted;
    font-size: 0.85rem;
  }

  .text-small {
    font-size: 0.8rem;
  }

  .hint {
    font-size: 0.85rem;
    margin-top: 8px;
    opacity: 0.8;
  }

  .truncate {
    max-width: 120px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cell-actions {
    min-width: 180px;
    white-space: nowrap;
  }

  .actions-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .btn-view,
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

  .btn-view {
    background: transparent;
    color: $marketplace-primary;
    border: 1px solid rgba(0, 51, 102, 0.3);
  }

  .btn-revoke {
    background: transparent;
    color: $marketplace-warning;
    border: 1px solid rgba(207, 150, 5, 0.5);
  }

  .btn-revoke:hover {
    background: rgba(207, 150, 5, 0.1);
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 6px;

    &.active {
      background: rgba(51, 108, 55, 0.15);
      color: $marketplace-success;
    }

    &.revoked {
      background: rgba(200, 50, 50, 0.15);
      color: $marketplace-danger;
    }
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
  padding: 1rem;
}

.modal-content {
  background: $marketplace-bg-card;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 440px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  &.confirm-modal {
    max-width: 400px;
  }

  &.revoke-modal {
    max-width: 320px;
    padding: 1.25rem 1.5rem;
    text-align: center;

    .revoke-icon {
      width: 44px;
      height: 44px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(200, 50, 50, 0.12);
      color: $marketplace-danger;

      i {
        font-size: 1.25rem;
      }
    }

    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: $marketplace-primary;
      margin: 0 0 6px 0;
    }

    > p {
      font-size: 0.9rem;
      color: $marketplace-text-muted;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }

    .revoke-error {
      font-size: 0.85rem;
      color: $marketplace-danger;
      margin: 0 0 12px 0 !important;
    }

    .revoke-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 4px;

      button {
        padding: 8px 18px;
        font-size: 0.9rem;
        font-weight: 500;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .revoke-cancel {
        background: transparent;
        color: $marketplace-text-muted;
        border: 1px solid $marketplace-panel-border;

        &:hover {
          background: rgba(0, 51, 102, 0.04);
          color: $marketplace-text;
        }
      }

      .revoke-confirm {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: $marketplace-danger;
        color: white;

        &:hover:not(:disabled) {
          opacity: 0.92;
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }
  }
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: $marketplace-danger;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid $marketplace-panel-border;

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0;
  }
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: $marketplace-text-muted;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(0, 51, 102, 0.08);
    color: $marketplace-primary;
  }
}

.modal-hint {
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  margin: 0 1.5rem 1rem;
}

.create-tenant-modal form {
  padding: 0 1.5rem 1.5rem;
}

.form-row {
  margin-bottom: 1rem;

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    color: $marketplace-text;
    margin-bottom: 6px;
  }

  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid $marketplace-panel-border;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: ui-monospace, monospace;

    &::placeholder {
      color: $marketplace-text-muted;
    }
  }
}

.form-error {
  font-size: 0.9rem;
  color: $marketplace-danger;
  margin: 0 0 1rem;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 1.25rem;

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    font-size: 0.95rem;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    background: $marketplace-primary;
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    padding: 10px 20px;
    font-size: 0.95rem;
    font-weight: 500;
    border: 1px solid $marketplace-panel-border;
    border-radius: 8px;
    background: transparent;
    color: $marketplace-text;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 51, 102, 0.06);
    }
  }
}
</style>
