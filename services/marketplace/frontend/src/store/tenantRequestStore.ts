import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useDemoStore } from './demoStore';
import type { TenantRequest, TenantType } from '@/types/demo';

export type { TenantType };

export const useTenantRequestStore = defineStore('tenantRequest', () => {
  const demoStore = useDemoStore();

  // Local overrides for approve/reject (persists across config reloads)
  const statusOverrides = ref<Record<string, 'approved' | 'rejected'>>({});

  const requests = computed(() => {
    const base = demoStore.tenantRequests;
    return base.map((r) => ({
      ...r,
      status: (statusOverrides.value[r.id] ?? r.status ?? 'pending') as TenantRequest['status'],
    }));
  });

  const pendingRequests = computed(() =>
    requests.value.filter((r) => r.status === 'pending')
  );

  const approvedRequests = computed(() =>
    requests.value.filter((r) => r.status === 'approved')
  );

  const rejectedRequests = computed(() =>
    requests.value.filter((r) => r.status === 'rejected')
  );

  function approve(id: string) {
    statusOverrides.value[id] = 'approved';
  }

  function reject(id: string) {
    statusOverrides.value[id] = 'rejected';
  }

  return {
    requests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    approve,
    reject,
  };
});
