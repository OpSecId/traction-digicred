import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as tenantApi from '@/api/tenantRequests';
import type { TenantRequest, TenancyType } from '@/types/demo';

export type { TenancyType };

export const useTenantRequestStore = defineStore('tenantRequest', () => {
  // Local overrides for approve/reject (when API unavailable)
  const statusOverrides = ref<Record<string, 'approved' | 'rejected'>>({});

  // Requests from API (DB)
  const apiRequests = ref<TenantRequest[]>([]);

  // Locally submitted requests (fallback when API unavailable)
  const localRequests = ref<TenantRequest[]>([]);

  // Whether API is available (tenant-requests endpoint)
  const apiAvailable = ref<boolean | null>(null);

  const requests = computed(() => {
    const base =
      apiAvailable.value === true ? apiRequests.value : localRequests.value;
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

  async function fetchRequests(): Promise<void> {
    try {
      const list = await tenantApi.listTenantRequests();
      apiRequests.value = list;
      apiAvailable.value = true;
    } catch {
      apiAvailable.value = false;
    }
  }

  async function addRequest(data: Omit<TenantRequest, 'id'>): Promise<{ success: boolean; referenceId?: string; error?: string }> {
    try {
      const created = await tenantApi.createTenantRequest({
        tenancyType: data.tenancyType,
        name: data.name,
        email: data.email,
        contactName: data.contactName,
        contactTitle: data.contactTitle,
        contactPhone: data.contactPhone,
        registrationId: data.registrationId,
        jurisdiction: data.jurisdiction,
        businessAddress: data.businessAddress,
        website: data.website,
        industry: data.industry,
        intendedUse: data.intendedUse,
        hiringVolume: data.hiringVolume,
        primaryIndustries: data.primaryIndustries,
        fundingSource: data.fundingSource,
        eligibilityOverview: data.eligibilityOverview,
        accreditation: data.accreditation,
        credentialTypes: data.credentialTypes,
      });
      apiRequests.value = [created, ...apiRequests.value];
      return { success: true, referenceId: created.referenceId };
    } catch (err: unknown) {
      const axErr = err && typeof err === 'object' && 'code' in err
        ? (err as { code?: string; message?: string })
        : null;
      const isTimeout = axErr?.code === 'ECONNABORTED' || axErr?.message?.includes('timeout');
      const msg = isTimeout
        ? 'Request timed out. Is the backend running? Ensure MongoDB is running and MONGO_URI is set.'
        : err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status === 400
            ? 'Invalid request. Please check your input.'
            : 'Failed to submit. Is the server running? Check backend logs.'
          : 'Failed to submit.';
      return { success: false, error: msg };
    }
  }

  async function approve(id: string): Promise<{ apiKey?: string; email?: string } | void> {
    try {
      const updated = await tenantApi.approveTenantRequest(id);
      if (updated) {
        apiRequests.value = apiRequests.value.map((r) => (r.id === id ? updated : r));
        return {
          apiKey: (updated as { apiKey?: string }).apiKey,
          email: updated.email,
        };
      }
    } catch {
      statusOverrides.value[id] = 'approved';
    }
  }

  async function reject(id: string) {
    try {
      const updated = await tenantApi.rejectTenantRequest(id);
      if (updated) {
        apiRequests.value = apiRequests.value.map((r) => (r.id === id ? updated : r));
      }
    } catch {
      statusOverrides.value[id] = 'rejected';
    }
  }

  return {
    requests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    apiAvailable,
    fetchRequests,
    addRequest,
    approve,
    reject,
  };
});
