<template>
  <div class="admin-tenants">
    <div class="section-header">
      <h2 class="section-title">Provisioned tenants</h2>
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
            <th>ID</th>
            <th>Status</th>
            <th>DID</th>
            <th>Wallet</th>
            <th>Request</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, idx) in validTenants" :key="t?.id ?? `row-${idx}`">
            <td><code class="tenant-id">{{ t?.id }}</code></td>
            <td>
              <span v-if="t?.status === 'revoked'" class="status-badge revoked">Revoked</span>
              <span v-else class="status-badge active">Active</span>
            </td>
            <td><code v-if="t?.did" class="mono">{{ t.did }}</code><span v-else class="text-muted">—</span></td>
            <td><code v-if="t?.walletId" class="mono">{{ t.walletId }}</code><span v-else class="text-muted">—</span></td>
            <td><code v-if="t?.tenantRequestId" class="mono truncate">{{ shortId(t.tenantRequestId) }}</code><span v-else class="text-muted">—</span></td>
            <td>{{ t?.createdAt ? formatDate(t.createdAt) : '—' }}</td>
            <td>
              <button
                type="button"
                class="btn-icon"
                title="View details"
                @click="t?.id && openDetails(t.id)"
              >
                <i class="pi pi-eye"></i>
              </button>
              <button
                type="button"
                class="btn-icon"
                title="Show credential"
                @click="t?.id && openCredentialModal(t.id)"
              >
                <i class="pi pi-file"></i>
              </button>
              <button
                v-if="t?.status !== 'revoked'"
                type="button"
                class="btn-icon danger"
                title="Revoke access"
                @click="t && confirmRevoke(t)"
              >
                <i class="pi pi-ban"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tenant details modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal-content details-modal">
        <div class="modal-header">
          <h3>Tenant details</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="closeDetailsModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div v-if="detailsLoading" class="modal-body loading">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading...</p>
        </div>
        <div v-else-if="selectedDetails && !selectedDetails.tenant" class="modal-body">
          <p class="text-muted">Tenant not found.</p>
        </div>
        <div v-else-if="selectedDetails?.tenant" class="modal-body">
          <div class="detail-section">
            <h4>Tenant</h4>
            <dl class="detail-list">
              <dt>ID</dt>
              <dd><code>{{ selectedDetails.tenant.id }}</code></dd>
              <dt>Status</dt>
              <dd><span :class="['status-badge', selectedDetails.tenant.status]">{{ selectedDetails.tenant.status || 'active' }}</span></dd>
              <dt>DID</dt>
              <dd><code v-if="selectedDetails.tenant.did">{{ selectedDetails.tenant.did }}</code><span v-else class="text-muted">—</span></dd>
              <dt>Wallet ID</dt>
              <dd><code v-if="selectedDetails.tenant.walletId">{{ selectedDetails.tenant.walletId }}</code><span v-else class="text-muted">—</span></dd>
              <dt>Created</dt>
              <dd>{{ selectedDetails.tenant.createdAt ? formatDate(selectedDetails.tenant.createdAt) : '—' }}</dd>
            </dl>
          </div>
          <div v-if="selectedDetails.tenantRequest" class="detail-section">
            <h4>Request details</h4>
            <dl class="detail-list">
              <dt>Name</dt>
              <dd>{{ selectedDetails.tenantRequest.name }}</dd>
              <dt>Email</dt>
              <dd>{{ selectedDetails.tenantRequest.email }}</dd>
              <dt>Type</dt>
              <dd>{{ selectedDetails.tenantRequest.tenancyType || '—' }}</dd>
              <dt>Industry</dt>
              <dd>{{ selectedDetails.tenantRequest.industry || '—' }}</dd>
              <dt>Website</dt>
              <dd><a v-if="selectedDetails.tenantRequest.website" :href="selectedDetails.tenantRequest.website" target="_blank" rel="noopener">{{ selectedDetails.tenantRequest.website }}</a><span v-else class="text-muted">—</span></dd>
              <dt>Contact</dt>
              <dd>{{ selectedDetails.tenantRequest.contactName || '—' }}{{ selectedDetails.tenantRequest.contactTitle ? ` (${selectedDetails.tenantRequest.contactTitle})` : '' }}</dd>
            </dl>
          </div>
          <div v-if="selectedDetails.tenant.credential" class="detail-section">
            <h4>Tenant credential (MarketplaceProfileCredential)</h4>
            <pre class="credential-json">{{ formatCredential(selectedDetails.tenant.credential) }}</pre>
          </div>
          <div v-else class="detail-section">
            <h4>Tenant credential</h4>
            <p class="text-muted">No credential stored for this tenant.</p>
          </div>
          <div v-if="selectedDetails.tenant.status !== 'revoked'" class="modal-actions">
            <button type="button" class="btn-danger" @click="doRevoke(selectedDetails.tenant.id)">
              <i class="pi pi-ban"></i>
              Revoke access
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Credential modal -->
    <div v-if="showCredentialModal" class="modal-overlay" @click.self="closeCredentialModal">
      <div class="modal-content credential-modal">
        <div class="modal-header">
          <h3>Tenant credential</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="closeCredentialModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div v-if="credentialLoading" class="modal-body loading">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading...</p>
        </div>
        <div v-else-if="credentialData" class="modal-body">
          <pre class="credential-json">{{ formatCredential(credentialData) }}</pre>
        </div>
        <div v-else class="modal-body">
          <p class="text-muted">No credential stored for this tenant.</p>
        </div>
      </div>
    </div>

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

const tenants = ref<adminApi.Tenant[]>([]);
const validTenants = computed(() => tenants.value.filter((t): t is adminApi.Tenant => t != null && t.id != null));
const loading = ref(false);
const showCreateModal = ref(false);
const creating = ref(false);
const createError = ref('');
const showDetailsModal = ref(false);
const detailsLoading = ref(false);
const selectedDetails = ref<adminApi.TenantDetails | null>(null);
const showCredentialModal = ref(false);
const credentialLoading = ref(false);
const credentialData = ref<Record<string, unknown> | null>(null);
const revokeTarget = ref<adminApi.Tenant | null>(null);
const revoking = ref(false);
const revokeError = ref('');

const createForm = reactive({
  tenantRequestId: '',
  did: '',
  walletId: '',
});

function shortId(id: string) {
  if (!id) return '';
  if (id.length <= 20) return id;
  return id.slice(0, 8) + '…' + id.slice(-8);
}

function formatCredential(cred: Record<string, unknown> | null | undefined) {
  if (cred == null) return '{}';
  return JSON.stringify(cred, null, 2);
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

async function openCredentialModal(id: string) {
  showCredentialModal.value = true;
  credentialData.value = null;
  credentialLoading.value = true;
  try {
    const data = await adminApi.getTenantDetails(id);
    const raw = data as unknown as Record<string, unknown> | null | undefined;
    const tenant = raw?.tenant ?? (raw?.id ? raw : null);
    credentialData.value = (tenant as { credential?: Record<string, unknown> })?.credential ?? null;
  } catch {
    credentialData.value = null;
  } finally {
    credentialLoading.value = false;
  }
}

function closeCredentialModal() {
  showCredentialModal.value = false;
  credentialData.value = null;
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

  .tenant-id,
  .mono {
    font-size: 0.8rem;
    word-break: break-all;
    font-family: ui-monospace, monospace;
  }

  .text-muted {
    color: $marketplace-text-muted;
    font-size: 0.85rem;
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

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: $marketplace-text-muted;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;

    &:hover {
      background: rgba(0, 51, 102, 0.08);
      color: $marketplace-primary;
    }

    &.danger:hover {
      background: rgba(200, 50, 50, 0.1);
      color: $marketplace-danger;
    }
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

  &.details-modal {
    max-width: 560px;
  }

  &.credential-modal {
    max-width: 640px;

    .credential-json {
      max-height: 400px;
    }
  }

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

.modal-body {
  padding: 1.25rem 1.5rem;

  &.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: $marketplace-text-muted;
  }
}

.detail-section {
  margin-bottom: 1.5rem;

  &:last-of-type {
    margin-bottom: 0;
  }

  h4 {
    font-size: 0.9rem;
    font-weight: 600;
    color: $marketplace-primary;
    margin: 0 0 10px 0;
  }
}

.detail-list {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 6px 16px;
  font-size: 0.9rem;
  margin: 0;

  dt {
    color: $marketplace-text-muted;
    font-weight: 500;
  }

  dd {
    margin: 0;
    word-break: break-word;

    code {
      font-size: 0.85rem;
      font-family: ui-monospace, monospace;
    }

    a {
      color: $marketplace-primary;
    }
  }
}

.credential-json {
  font-size: 0.8rem;
  font-family: ui-monospace, monospace;
  background: rgba(0, 0, 0, 0.04);
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.modal-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid $marketplace-panel-border;
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
