<template>
  <div class="admin-workflows">
    <div class="section-header">
      <h2 class="section-title">Workflow instances</h2>
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

    <div v-if="loading && workflows.length === 0" class="empty-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>Loading workflows...</p>
    </div>
    <div v-else-if="workflows.length === 0" class="empty-state">
      <i class="pi pi-sitemap"></i>
      <p>No workflow instances</p>
      <p class="hint">Workflows are created when tenant provisioning is triggered.</p>
    </div>
    <div v-else class="card-grid">
      <article
        v-for="w in workflows"
        :key="w.id"
        class="marketplace-card admin-card workflow-card"
      >
        <div class="card-header">
          <span class="workflow-type">{{ w.workflowType }}</span>
          <span class="status-badge" :class="w.status">{{ w.status }}</span>
        </div>
        <div class="card-body">
          <p v-if="w.tenantRequestId"><strong>Request:</strong> {{ w.tenantRequestId }}</p>
          <p v-if="w.currentStep"><strong>Step:</strong> {{ w.currentStep }}</p>
          <p v-if="w.errorMessage" class="error-msg">{{ w.errorMessage }}</p>
          <p class="date">Started {{ formatDate(w.startedAt) }}</p>
          <p v-if="w.completedAt" class="date">Completed {{ formatDate(w.completedAt) }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as adminApi from '@/api/admin';

const workflows = ref<adminApi.Workflow[]>([]);
const loading = ref(false);

async function refresh() {
  loading.value = true;
  try {
    workflows.value = await adminApi.listWorkflows();
  } catch {
    workflows.value = [];
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
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<style scoped lang="scss">
@use '@/assets/admin-common.scss';
@use '@/assets/variables.scss' as *;

.workflow-card {
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
  }

  .error-msg {
    color: $marketplace-danger;
    font-size: 0.9rem;
  }

  .hint {
    font-size: 0.85rem;
    margin-top: 8px;
    opacity: 0.8;
  }
}
</style>
