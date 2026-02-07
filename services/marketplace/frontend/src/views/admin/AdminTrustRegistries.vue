<template>
  <div class="admin-trust-registries">
    <div class="section-header">
      <h2 class="section-title">Trust registry</h2>
      <div class="header-actions">
        <button
          type="button"
          class="create-invitation-btn"
          @click="showInvitationModal = true"
        >
          <i class="pi pi-qrcode"></i>
          Create invitation
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

    <!-- Create invitation modal -->
    <div v-if="showInvitationModal" class="modal-overlay" @click.self="showInvitationModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Create invitation</h3>
          <button type="button" class="modal-close" @click="showInvitationModal = false">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <form v-if="!invitationResult" class="modal-form" @submit.prevent="createInvitation">
          <div class="form-row">
            <label>Goal</label>
            <input v-model="invitationForm.goal" type="text" placeholder="Browse jobs and opportunities" />
          </div>
          <div class="form-row checkbox-row">
            <label>
              <input v-model="invitationForm.multi_use" type="checkbox" />
              Multi-use invitation
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showInvitationModal = false">Cancel</button>
            <button type="submit" class="btn-create" :disabled="creating">
              <i :class="creating ? 'pi pi-spin pi-spinner' : 'pi pi-plus'"></i>
              {{ creating ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
        <div v-else class="invitation-result">
          <p class="success-msg">Invitation created</p>
          <div class="url-row">
            <input :value="invitationResult?.invitation_url" readonly class="url-input" />
            <button type="button" class="btn-copy" @click="copyInvitationUrl">
              <i class="pi pi-copy"></i> Copy
            </button>
          </div>
          <button type="button" class="btn-done" @click="closeInvitationModal">Done</button>
        </div>
      </div>
    </div>

    <div v-if="loading && educationInstitutions.length === 0" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading trust registry...</p>
    </div>
    <div v-else-if="educationInstitutions.length === 0" class="empty-state">
      <i class="pi pi-shield"></i>
      <p>No education institutions in trust registry</p>
      <p class="hint">Add education institutions to config/trust-registry.yaml</p>
    </div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>DID</th>
            <th>Website</th>
            <th>Credential types</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reg in educationInstitutions" :key="reg.id">
            <td>
              <div class="registry-name-cell">
                <img
                  v-if="reg.logo"
                  :src="reg.logo"
                  :alt="reg.name"
                  class="registry-logo"
                />
                <span>{{ reg.name }}</span>
              </div>
            </td>
            <td><code v-if="reg.did" class="mono">{{ reg.did }}</code><span v-else class="text-muted">—</span></td>
            <td>
              <a v-if="reg.website" :href="reg.website" target="_blank" rel="noopener" class="link">
                {{ reg.website }}
              </a>
              <span v-else class="text-muted">—</span>
            </td>
            <td class="cred-types-cell">
              <div class="cred-types-detail">
                <div
                  v-for="cat in CREDENTIAL_CATEGORIES"
                  :key="cat.id"
                  class="cred-category-row"
                >
                  <i
                    v-if="supportsCategory(reg, cat.id)"
                    class="pi pi-check cred-check"
                    aria-label="Supported"
                  />
                  <i
                    v-else
                    class="pi pi-minus cred-minus"
                    aria-label="Not supported"
                  />
                  <span class="cred-category-label">{{ cat.label }}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import * as adminApi from '@/api/admin';
import { getAppDomain } from '@/services/configService';

const CREDENTIAL_CATEGORIES = [
  { id: 'k12', label: 'K-12', types: ['HighSchoolTranscript'] },
  { id: 'college', label: 'College', types: ['CollegeTranscript'] },
  { id: 'university', label: 'University', types: ['StudentCard', 'Diploma'] },
] as const;

function supportsCategory(reg: adminApi.TrustRegistry, categoryId: string): boolean {
  const cat = CREDENTIAL_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat || !Array.isArray(reg.credentialTypes)) return false;
  return cat.types.some((t) => reg.credentialTypes!.includes(t));
}

const registries = ref<adminApi.TrustRegistry[]>([]);
const loading = ref(false);
const showInvitationModal = ref(false);
const creating = ref(false);
const invitationResult = ref<adminApi.MarketplaceInvitationResponse | null>(null);

const invitationForm = reactive({
  goal: 'Browse jobs and opportunities from Apply Utopia',
  multi_use: true,
});

const educationInstitutions = computed(() =>
  registries.value.filter((r) => r.type === 'EducationInstitution')
);

async function refresh() {
  loading.value = true;
  try {
    registries.value = await adminApi.listTrustRegistries();
  } catch {
    registries.value = [];
  } finally {
    loading.value = false;
  }
}

async function createInvitation() {
  creating.value = true;
  invitationResult.value = null;
  try {
    const domain = getAppDomain() || window.location.origin;
    const res = await adminApi.createMarketplaceInvitation({
      content_url: `${domain}/channel`,
      goal: invitationForm.goal || undefined,
      image_url: `${domain}/img/digicred/logo-marketplace.svg`,
      multi_use: invitationForm.multi_use,
    });
    invitationResult.value = res;
  } catch (err) {
    console.error('Create invitation error:', err);
    alert('Failed to create invitation. Check that MARKETPLACE_TENANCY_URI is configured.');
  } finally {
    creating.value = false;
  }
}

function copyInvitationUrl() {
  if (!invitationResult.value?.invitation_url) return;
  navigator.clipboard.writeText(invitationResult.value.invitation_url);
  alert('Copied to clipboard');
}

function closeInvitationModal() {
  showInvitationModal.value = false;
  invitationResult.value = null;
}

onMounted(() => refresh());
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.admin-trust-registries {
  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .create-invitation-btn {
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

  .modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    max-width: 640px;
    min-width: 320px;
    width: 100%;
    flex-shrink: 0;
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
      color: $marketplace-primary;
    }
  }

  .modal-close {
    padding: 8px;
    border: none;
    background: transparent;
    color: $marketplace-text-muted;
    cursor: pointer;
    border-radius: 6px;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: $marketplace-text;
    }
  }

  .modal-form {
    padding: 20px;
  }

  .form-row {
    margin-bottom: 16px;

    label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 6px;
      color: $marketplace-text;
    }

    input[type='text'],
    input[type='url'] {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid $marketplace-panel-border;
      font-size: 0.9rem;
    }

    &.checkbox-row label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid $marketplace-panel-border;
  }

  .btn-cancel {
    padding: 10px 18px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    border: 1px solid $marketplace-panel-border;
    background: transparent;
    cursor: pointer;
    color: $marketplace-text-muted;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .btn-create {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
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
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .invitation-result {
    padding: 20px;

    .success-msg {
      font-weight: 600;
      color: $marketplace-success;
      margin: 0 0 12px 0;
    }

    .url-row {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .url-input {
        flex: 1;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid $marketplace-panel-border;
        font-size: 0.85rem;
        font-family: monospace;
      }

      .btn-copy {
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

        &:hover {
          background: rgba(0, 51, 102, 0.06);
        }
      }
    }

    .btn-done {
      padding: 10px 18px;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      background: $marketplace-primary;
      color: white;
      cursor: pointer;

      &:hover {
        opacity: 0.9;
      }
    }
  }

  .registry-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .registry-logo {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: cover;
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

  .link {
    color: $marketplace-link;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .cred-types-cell {
    width: 110px;
  }

  .cred-types-detail {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 8px;
    background: rgba(0, 51, 102, 0.04);
    border-radius: 6px;
    border: 1px solid $marketplace-panel-border;
  }

  .cred-category-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    padding: 1px 0;

    .cred-category-label {
      font-weight: 500;
    }

    .cred-check {
      color: $marketplace-success;
      font-size: 0.8rem;
    }

    .cred-minus {
      color: $marketplace-text-muted;
      font-size: 0.75rem;
      opacity: 0.5;
    }
  }

  .hint {
    font-size: 0.85rem;
    margin-top: 8px;
    opacity: 0.8;
  }
}
</style>
