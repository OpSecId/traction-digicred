/**
 * Tenant requests API client.
 */

import axios from 'axios';
import type { TenantRequest } from '@/types/demo';

const API_TIMEOUT_MS = 15000;

export interface CreateTenantRequestInput {
  tenantType: string;
  name: string;
  email: string;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  registrationId?: string;
  jurisdiction?: string;
  businessAddress?: string;
  website?: string;
  industry?: string;
  intendedUse?: string;
  hiringVolume?: string;
  primaryIndustries?: string;
  fundingSource?: string;
  eligibilityOverview?: string;
  accreditation?: string;
  credentialTypes?: string;
}

export async function createTenantRequest(
  input: CreateTenantRequestInput
): Promise<TenantRequest> {
  const res = await axios.post<TenantRequest>('/api/tenant-requests', input, {
    timeout: API_TIMEOUT_MS,
  });
  return res.data;
}

export async function listTenantRequests(): Promise<TenantRequest[]> {
  const res = await axios.get<{ requests?: TenantRequest[] }>('/api/tenant-requests', {
    timeout: API_TIMEOUT_MS,
  });
  return Array.isArray(res.data?.requests) ? res.data.requests : [];
}

export async function approveTenantRequest(id: string): Promise<TenantRequest | null> {
  const res = await axios.patch<TenantRequest>(
    `/api/tenant-requests/${id}`,
    { status: 'approved' },
    { timeout: API_TIMEOUT_MS }
  );
  return res.data;
}

export async function rejectTenantRequest(
  id: string,
  rejectionReason?: string
): Promise<TenantRequest | null> {
  const res = await axios.patch<TenantRequest>(
    `/api/tenant-requests/${id}`,
    { status: 'rejected', rejectionReason },
    { timeout: API_TIMEOUT_MS }
  );
  return res.data;
}
