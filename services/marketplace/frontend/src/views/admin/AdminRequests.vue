<template>
  <div class="admin-requests">
    <div class="section-header">
      <h2 class="section-title">Onboarding requests</h2>
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
      <p>Loading requests...</p>
    </div>
    <div v-else-if="allRequests.length === 0" class="empty-state">
      <i class="pi pi-inbox"></i>
      <p>No tenant requests</p>
    </div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Ref ID</th>
            <th>Type</th>
            <th>Name</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Date</th>
            <th>Status</th>
            <th class="cell-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="req in allRequests"
            :key="req.id"
            :class="{ processed: req.status !== 'pending' }"
          >
            <td>
              <code v-if="req.referenceId" class="ref-id">{{ req.referenceId }}</code>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <span class="type-badge" :class="tenantTypeClass(req.tenantType)">
                {{ req.tenantType }}
              </span>
            </td>
            <td>{{ req.name }}</td>
            <td>{{ req.email }}</td>
            <td>
              <span v-if="req.contactName">
                {{ req.contactName }}{{ req.contactTitle ? ` (${req.contactTitle})` : '' }}
              </span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>{{ formatDate(req.submittedAt) }}</td>
            <td>
              <span v-if="req.status !== 'pending'" class="status-badge" :class="req.status">
                {{ req.status }}
              </span>
              <span v-else class="text-muted">Pending</span>
            </td>
            <td class="cell-actions">
              <template v-if="req.status === 'pending'">
                <button class="btn-reject" @click="rejectRequest(req.id)">
                  <i class="pi pi-times"></i>
                  Reject
                </button>
                <button class="btn-approve" @click="approveRequest(req.id)">
                  <i class="pi pi-check"></i>
                  Approve
                </button>
              </template>
              <span v-else class="text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import type { TenantType } from '@/store/tenantRequestStore';

const tenantStore = useTenantRequestStore();
const loading = ref(false);

const allRequests = computed(() => [
  ...tenantStore.pendingRequests,
  ...tenantStore.approvedRequests,
  ...tenantStore.rejectedRequests,
]);

async function refresh() {
  loading.value = true;
  try {
    await tenantStore.fetchRequests();
  } finally {
    loading.value = false;
  }
}

onMounted(() => refresh());

async function approveRequest(id: string) {
  await tenantStore.approve(id);
}

async function rejectRequest(id: string) {
  await tenantStore.reject(id);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function tenantTypeClass(type: TenantType) {
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
  tr.processed {
    opacity: 0.85;
  }

  .ref-id {
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
</style>
