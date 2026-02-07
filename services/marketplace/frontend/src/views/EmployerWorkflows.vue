<template>
  <div class="employer-workflows-page">
    <router-link to="/tenant" class="back-link">
      <i class="pi pi-arrow-left"></i>
      Back
    </router-link>

    <div v-if="!employerStore.isEmployer" class="no-employer">
      <p>Please sign in at the Marketplace Tenants Hub first.</p>
      <router-link to="/tenant" class="action-btn primary">Go to Marketplace Tenants Hub</router-link>
    </div>

    <div v-else>
      <div class="page-header">
        <h1>Manage workflows</h1>
        <p>View workflow status for your tenant and related processes.</p>
      </div>

      <button type="button" class="refresh-btn" :disabled="loading" @click="refresh">
        <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
        {{ loading ? 'Loading...' : 'Refresh' }}
      </button>

      <div v-if="loading && workflows.length === 0" class="empty-state">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Loading workflows...</p>
      </div>
      <div v-else class="workflow-list">
        <article v-for="wf in workflowTypes" :key="wf.id" class="marketplace-card workflow-card">
          <div class="card-header">
            <span class="workflow-type">{{ wf.label }}</span>
            <span class="status-badge" :class="wf.status">{{ wf.statusLabel }}</span>
          </div>
          <div v-if="wf.instance" class="card-body">
            <p v-if="wf.instance.currentStep"><strong>Step:</strong> {{ wf.instance.currentStep }}</p>
            <p v-if="wf.instance.errorMessage" class="error-msg">{{ wf.instance.errorMessage }}</p>
            <p class="date">Started {{ formatDate(wf.instance.startedAt) }}</p>
            <p v-if="wf.instance.completedAt" class="date">Completed {{ formatDate(wf.instance.completedAt) }}</p>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useEmployerStore } from '@/store/employerStore';
import {
  listEmployerWorkflows,
  WORKFLOW_TYPES,
  workflowStatusLabel,
  type EmployerWorkflow,
} from '@/api/employerJobs';

const employerStore = useEmployerStore();
const workflows = ref<EmployerWorkflow[]>([]);
const loading = ref(false);

const workflowTypes = computed(() => {
  const byType = new Map<string, EmployerWorkflow>();
  for (const w of workflows.value) {
    const key = w.workflowType.toLowerCase().replace(/\s+/g, '-');
    if (!byType.has(key) || !byType.get(key)!.completedAt) byType.set(key, w);
  }
  const verifyInstance = byType.get('verify-tenant') ?? byType.get('tenant-provisioning');
  return WORKFLOW_TYPES.map(({ id, label }) => {
    const instance = id === 'verify-tenant' ? verifyInstance : byType.get(id);
    const status = instance?.status ?? 'available';
    return {
      id,
      label,
      status,
      statusLabel: workflowStatusLabel(status),
      instance: instance ?? undefined,
    };
  });
});

async function refresh() {
  if (!employerStore.currentEmployerId) return;
  loading.value = true;
  try {
    workflows.value = await listEmployerWorkflows(employerStore.currentEmployerId);
  } catch {
    workflows.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => employerStore.currentEmployerId,
  (id) => (id ? refresh() : (workflows.value = [])),
  { immediate: true }
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped lang="scss">
@use '@/assets/variables.scss' as *;
@use '@/assets/employer-common.scss';

.employer-workflows-page {
  padding: 16px 20px 32px;
  max-width: 560px;
  margin: 0 auto;

  .refresh-btn {
    margin-bottom: 20px;
  }
}

.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-card {
  padding: 20px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .workflow-type {
    font-weight: 600;
    color: $marketplace-primary;
  }

  .status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;

    &.running {
      background: rgba(207, 150, 5, 0.15);
      color: $marketplace-warning;
    }
    &.completed {
      background: rgba(51, 108, 55, 0.15);
      color: $marketplace-success;
    }
    &.failed {
      background: rgba(248, 73, 73, 0.12);
      color: $marketplace-danger;
    }
    &.available {
      background: rgba($marketplace-primary, 0.08);
      color: $marketplace-text-muted;
    }
  }

  .card-body {
    p {
      font-size: 0.9rem;
      color: $marketplace-text;
      margin: 0 0 4px 0;
    }
    .error-msg {
      color: $marketplace-danger;
    }
  }
}
</style>
