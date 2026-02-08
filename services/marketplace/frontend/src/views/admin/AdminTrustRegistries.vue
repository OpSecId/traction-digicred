<template>
  <div class="admin-trust-registries">
    <div class="section-header">
      <h2 class="section-title">Trust registry</h2>
      <div class="header-actions">
        <button
          type="button"
          class="add-entry-btn"
          @click="showAddEntryModal = true"
        >
          <i class="pi pi-plus"></i>
          Add entry
        </button>
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

    <!-- Add trust registry entry modal (wizard) -->
    <div v-if="showAddEntryModal" class="modal-overlay" @click.self="closeAddEntryModal">
      <div class="modal wizard-modal">
        <div class="modal-header">
          <h3>Add trust registry entry</h3>
          <button type="button" class="modal-close" @click="closeAddEntryModal">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="wizard-steps">
          <div
            v-for="(step, i) in ADD_ENTRY_STEPS"
            :key="step.id"
            class="wizard-step-dot"
            :class="{ active: addEntryStep === i + 1, done: addEntryStep > i + 1 }"
          >
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
        <form class="modal-form" @submit.prevent="addEntryStep < ADD_ENTRY_STEPS.length ? nextEntryStep() : addEntry()">
          <div v-show="addEntryStep === 1" class="wizard-panel">
            <h4 class="wizard-title">Basic information</h4>
            <p class="wizard-desc">Enter the name and type of the organization.</p>
            <div class="form-row">
              <label>Name <span class="req">*</span></label>
              <input id="add-entry-name" v-model="addEntryForm.name" type="text" name="name" required placeholder="e.g. University of Example" />
            </div>
            <div class="form-row">
              <label>Type</label>
              <select id="add-entry-type" v-model="addEntryForm.type" name="type">
                <option value="EducationInstitution">Education Institution</option>
                <option value="Employer">Employer</option>
              </select>
            </div>
          </div>
          <div v-show="addEntryStep === 2" class="wizard-panel">
            <h4 class="wizard-title">Decentralized identifier</h4>
            <p class="wizard-desc">The DID used to verify credentials from this issuer.</p>
            <div class="form-row">
              <label>DID <span class="req">*</span></label>
              <input id="add-entry-did" v-model="addEntryForm.did" type="text" name="did" required placeholder="e.g. did:web:example.edu" />
            </div>
          </div>
          <div v-show="addEntryStep === 3" class="wizard-panel">
            <h4 class="wizard-title">Credential types</h4>
            <p class="wizard-desc">Which credential types can this issuer provide?</p>
            <div class="form-row">
              <label>Credential types (comma-separated)</label>
              <input id="add-entry-credential-types" v-model="addEntryForm.credentialTypesStr" type="text" name="credentialTypes" placeholder="e.g. CollegeTranscript, Diploma, HighSchoolTranscript" />
            </div>
          </div>
          <div v-show="addEntryStep === 4" class="wizard-panel">
            <h4 class="wizard-title">Branding (optional)</h4>
            <p class="wizard-desc">Website and logo for display in the marketplace.</p>
            <div class="form-row">
              <label>Website</label>
              <input id="add-entry-website" v-model="addEntryForm.website" type="url" name="website" placeholder="https://example.edu" />
            </div>
            <div class="form-row">
              <label>Logo URL</label>
              <input id="add-entry-logo" v-model="addEntryForm.logo" type="url" name="logo" placeholder="https://example.edu/logo.png" />
            </div>
          </div>
          <p v-if="addEntryError" class="form-error">{{ addEntryError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="addEntryStep === 1 ? closeAddEntryModal() : prevEntryStep()">
              {{ addEntryStep === 1 ? 'Cancel' : 'Back' }}
            </button>
            <button v-if="addEntryStep < ADD_ENTRY_STEPS.length" type="button" class="btn-next" @click="nextEntryStep">
              Next
              <i class="pi pi-arrow-right"></i>
            </button>
            <button v-else type="submit" class="btn-create" :disabled="addingEntry">
              <i :class="addingEntry ? 'pi pi-spin pi-spinner' : 'pi pi-plus'"></i>
              {{ addingEntry ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </form>
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
            <input id="trust-registry-goal" v-model="invitationForm.goal" type="text" name="goal" placeholder="Browse jobs and opportunities" />
          </div>
          <div class="form-row checkbox-row">
            <label>
              <input id="trust-registry-multi-use" v-model="invitationForm.multi_use" type="checkbox" name="multi_use" />
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
            <input id="trust-registry-invitation-url" :value="invitationResult?.invitation_url" name="invitation_url" readonly class="url-input" />
            <button type="button" class="btn-copy" :class="{ copied: copyFeedback }" @click="copyInvitationUrl">
              <i :class="copyFeedback ? 'pi pi-check' : 'pi pi-copy'"></i>
              {{ copyFeedback ? 'Copied!' : 'Copy' }}
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

const ADD_ENTRY_STEPS = [
  { id: 'basic', label: 'Basic' },
  { id: 'did', label: 'DID' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'branding', label: 'Branding' },
] as const;

function supportsCategory(reg: adminApi.TrustRegistry, categoryId: string): boolean {
  const cat = CREDENTIAL_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat || !Array.isArray(reg.credentialTypes)) return false;
  return cat.types.some((t) => reg.credentialTypes!.includes(t));
}

const registries = ref<adminApi.TrustRegistry[]>([]);
const loading = ref(false);
const showAddEntryModal = ref(false);
const addEntryStep = ref(1);
const addingEntry = ref(false);
const addEntryError = ref('');
const addEntryForm = reactive({
  name: '',
  type: 'EducationInstitution',
  did: '',
  credentialTypesStr: '',
  website: '',
  logo: '',
});
const showInvitationModal = ref(false);
const creating = ref(false);
const copyFeedback = ref(false);
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

function nextEntryStep() {
  addEntryError.value = '';
  if (addEntryStep.value === 1 && !addEntryForm.name.trim()) {
    addEntryError.value = 'Name is required';
    return;
  }
  if (addEntryStep.value === 2 && !addEntryForm.did.trim()) {
    addEntryError.value = 'DID is required';
    return;
  }
  addEntryStep.value++;
}

function prevEntryStep() {
  addEntryError.value = '';
  addEntryStep.value--;
}

function closeAddEntryModal() {
  showAddEntryModal.value = false;
  addEntryStep.value = 1;
  addEntryError.value = '';
  addEntryForm.name = '';
  addEntryForm.type = 'EducationInstitution';
  addEntryForm.did = '';
  addEntryForm.credentialTypesStr = '';
  addEntryForm.website = '';
  addEntryForm.logo = '';
}

async function addEntry() {
  addEntryError.value = '';
  if (!addEntryForm.name.trim()) return;
  addingEntry.value = true;
  try {
    const credentialTypes = addEntryForm.credentialTypesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await adminApi.addTrustRegistryEntry({
      name: addEntryForm.name.trim(),
      type: addEntryForm.type,
      ...(addEntryForm.did.trim() ? { did: addEntryForm.did.trim() } : {}),
      ...(credentialTypes.length ? { credentialTypes } : {}),
      ...(addEntryForm.website.trim() ? { website: addEntryForm.website.trim() } : {}),
      ...(addEntryForm.logo.trim() ? { logo: addEntryForm.logo.trim() } : {}),
    });
    closeAddEntryModal();
    await refresh();
  } catch (err: unknown) {
    const ax = err && typeof err === 'object' && 'response' in err ? err as { response?: { data?: { error?: string } } } : null;
    addEntryError.value = ax?.response?.data?.error ?? 'Failed to add entry';
  } finally {
    addingEntry.value = false;
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
  } catch (err: unknown) {
    console.error('Create invitation error:', err);
    const ax = err && typeof err === 'object' && 'response' in err ? err as { response?: { data?: { error?: string } } } : null;
    const msg = ax?.response?.data?.error ?? 'Failed to create invitation. Ensure MARKETPLACE_AGENCY_URI is configured and the agency is reachable.';
    alert(msg);
  } finally {
    creating.value = false;
  }
}

async function copyInvitationUrl() {
  if (!invitationResult.value?.invitation_url) return;
  try {
    await navigator.clipboard.writeText(invitationResult.value.invitation_url);
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 1800);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = invitationResult.value.invitation_url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    copyFeedback.value = true;
    setTimeout(() => { copyFeedback.value = false; }, 1800);
  }
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

  .add-entry-btn,
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

  .wizard-modal {
    max-width: 560px;
  }

  .wizard-steps {
    display: flex;
    gap: 0;
    padding: 16px 20px;
    border-bottom: 1px solid $marketplace-panel-border;
    background: rgba(0, 51, 102, 0.03);
  }

  .wizard-step-dot {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 11px;
      left: 50%;
      right: -50%;
      height: 2px;
      background: $marketplace-panel-border;
      z-index: 0;
    }

    &:last-child::after {
      display: none;
    }

    .step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      background: white;
      border: 2px solid $marketplace-panel-border;
      color: $marketplace-text-muted;
      position: relative;
      z-index: 1;
    }

    .step-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: $marketplace-text-muted;
    }

    &.active .step-num {
      border-color: $marketplace-primary;
      background: $marketplace-primary;
      color: white;
    }

    &.active .step-label {
      color: $marketplace-primary;
    }

    &.done .step-num {
      border-color: $marketplace-success;
      background: $marketplace-success;
      color: white;
    }

    &.done .step-label {
      color: $marketplace-text-muted;
    }

    &.done::after {
      background: $marketplace-success;
    }
  }

  .wizard-panel {
    min-height: 140px;
  }

  .wizard-title {
    margin: 0 0 6px 0;
    font-size: 1rem;
    font-weight: 600;
    color: $marketplace-text;
  }

  .wizard-desc {
    margin: 0 0 16px 0;
    font-size: 0.9rem;
    color: $marketplace-text-muted;
    line-height: 1.4;
  }

  .btn-next {
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

    &:hover {
      opacity: 0.9;
    }
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
    input[type='url'],
    select {
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

  .form-error {
    font-size: 0.9rem;
    color: $marketplace-danger;
    margin: 0 0 1rem;
  }

  .req {
    color: $marketplace-danger;
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
        transition: background 0.2s, border-color 0.2s, color 0.2s;

        &:hover {
          background: rgba(0, 51, 102, 0.06);
        }

        &.copied {
          border-color: #22c55e;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.08);
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
