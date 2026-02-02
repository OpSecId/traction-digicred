<template>
  <div class="admin-hub">
    <div class="hub-hero">
      <h1>Platform Admin</h1>
      <p>Approve or reject tenant onboarding requests</p>
    </div>

    <div class="requests-section">
      <h2 class="section-title">Pending requests</h2>
      <div v-if="tenantStore.pendingRequests.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>No pending tenant requests</p>
      </div>
      <div v-else class="request-list">
        <div
          v-for="req in tenantStore.pendingRequests"
          :key="req.id"
          class="marketplace-card request-card"
        >
          <div class="request-header">
            <span class="tenant-type-badge" :class="tenantTypeClass(req.tenantType)">
              {{ req.tenantType }}
            </span>
            <span class="request-date">{{ formatDate(req.submittedAt) }}</span>
          </div>
          <div class="request-body">
            <h3 class="request-name">{{ req.name }}</h3>
            <p class="request-email">{{ req.email }}</p>
          </div>
          <div class="request-actions">
            <button class="btn-reject" @click="tenantStore.reject(req.id)">
              <i class="pi pi-times"></i>
              Reject
            </button>
            <button class="btn-approve" @click="tenantStore.approve(req.id)">
              <i class="pi pi-check"></i>
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="tenantStore.approvedRequests.length > 0 || tenantStore.rejectedRequests.length > 0" class="requests-section">
      <h2 class="section-title">Processed requests</h2>
      <div class="request-list">
        <div
          v-for="req in [...tenantStore.approvedRequests, ...tenantStore.rejectedRequests]"
          :key="req.id"
          class="marketplace-card request-card request-card-processed"
        >
          <div class="request-header">
            <span class="tenant-type-badge" :class="tenantTypeClass(req.tenantType)">
              {{ req.tenantType }}
            </span>
            <span class="status-badge" :class="req.status">{{ req.status }}</span>
          </div>
          <div class="request-body">
            <h3 class="request-name">{{ req.name }}</h3>
            <p class="request-email">{{ req.email }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTenantRequestStore } from '@/store/tenantRequestStore';
import type { TenantType } from '@/store/tenantRequestStore';

const tenantStore = useTenantRequestStore();

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
  };
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;

.admin-hub {
  padding: 16px;
  padding-bottom: 24px;
}

.hub-hero {
  margin-bottom: 24px;

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: $marketplace-primary;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 1rem;
    color: $marketplace-text-muted;
    margin: 0;
  }
}

.requests-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: $marketplace-text;
  margin: 0 0 16px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: $marketplace-text-muted;

  i {
    font-size: 2.5rem;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
  }
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-card {
  padding: 16px;
}

.request-card-processed {
  opacity: 0.85;
}

.request-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.tenant-type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.3px;

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

.request-date {
  font-size: 0.8rem;
  color: $marketplace-text-muted;
}

.request-body {
  margin-bottom: 16px;
}

.request-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: $marketplace-primary;
  margin: 0 0 4px 0;
}

.request-email {
  font-size: 0.9rem;
  color: $marketplace-text-muted;
  margin: 0;
}

.request-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-approve,
.btn-reject {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.9;
  }
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
</style>
