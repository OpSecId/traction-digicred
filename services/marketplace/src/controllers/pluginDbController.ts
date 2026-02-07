/**
 * Plugin DB controller - proxies DB operations to the traction_marketplace plugin.
 * Uses MARKETPLACE_TENANCY_URI (plugin runs in tenancy agent).
 */

import { agentRequest } from './agentClient';
import { marketplaceTenancyConfig } from '../config';

const base = '/marketplace';

async function pluginRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  searchParams?: Record<string, string>
): Promise<T> {
  const url = searchParams
    ? `${path}?${new URLSearchParams(searchParams).toString()}`
    : path;
  return agentRequest(marketplaceTenancyConfig, url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as Promise<T>;
}

/** GET that returns null on 404 instead of throwing */
async function pluginGetOptional<T>(
  path: string,
  searchParams?: Record<string, string>
): Promise<T | null> {
  try {
    return await pluginRequest<T>('GET', path, undefined, searchParams);
  } catch (err) {
    if (err instanceof Error && err.message.includes('(404)')) return null;
    throw err;
  }
}

export const pluginDb = {
  // Tenant requests
  async createTenantRequest(input: Record<string, unknown>) {
    return pluginRequest<Record<string, unknown>>('POST', `${base}/tenant-requests`, input);
  },
  async listTenantRequests() {
    const res = await pluginRequest<{ requests: unknown[] }>('GET', `${base}/tenant-requests`);
    return res.requests;
  },
  async getTenantRequestById(id: string) {
    return pluginGetOptional<Record<string, unknown>>(
      `${base}/tenant-requests/${encodeURIComponent(id)}`
    );
  },
  async updateTenantRequestStatus(
    id: string,
    status: 'approved' | 'rejected',
    options?: { rejectionReason?: string }
  ) {
    return pluginRequest<Record<string, unknown>>(
      'PATCH',
      `${base}/tenant-requests/${encodeURIComponent(id)}`,
      { status, rejectionReason: options?.rejectionReason }
    );
  },
  async seedTenantRequests(requests: unknown[]) {
    return pluginRequest<{ seeded: number }>('POST', `${base}/tenant-requests/seed`, {
      requests,
    });
  },

  // Tenants
  async listTenants() {
    const res = await pluginRequest<{ tenants: unknown[] }>('GET', `${base}/tenants`);
    return res.tenants;
  },
  async getTenantById(id: string) {
    return pluginGetOptional<Record<string, unknown>>(
      `${base}/tenants/${encodeURIComponent(id)}`
    );
  },
  async createTenant(
    tenantRequestId: string,
    options?: { did?: string; walletId?: string; credential?: Record<string, unknown> }
  ) {
    return pluginRequest<Record<string, unknown>>('POST', `${base}/tenants`, {
      tenantRequestId,
      did: options?.did,
      walletId: options?.walletId,
      credential: options?.credential,
    });
  },
  async createTenantManual(options: {
    tenantRequestId?: string;
    did?: string;
    walletId?: string;
  }) {
    return pluginRequest<Record<string, unknown>>('POST', `${base}/tenants/manual`, options);
  },
  async revokeTenant(id: string) {
    const res = await pluginRequest<{ revoked: boolean }>(
      'POST',
      `${base}/tenants/${encodeURIComponent(id)}/revoke`
    );
    return res.revoked;
  },

  // Workflows
  async listWorkflowInstances() {
    const res = await pluginRequest<{ workflows: unknown[] }>('GET', `${base}/workflows`);
    return res.workflows;
  },
  async listWorkflowInstancesByEmployerId(employerId: string) {
    const res = await pluginRequest<{ workflows: unknown[] }>(
      'GET',
      `${base}/workflows/employer`,
      undefined,
      { employerId }
    );
    return res.workflows;
  },
  async createWorkflowInstance(tenantRequestId: string, workflowType: string) {
    return pluginRequest<Record<string, unknown>>('POST', `${base}/workflows`, {
      tenantRequestId,
      workflowType,
    });
  },

  // Employer profiles
  async getEmployerProfile(employerId: string) {
    return pluginGetOptional<{ employerId: string; credential: Record<string, unknown> }>(
      `${base}/employer/profile`,
      { employerId }
    );
  },
  async createEmployerProfile(employerId: string, credential: Record<string, unknown>) {
    return pluginRequest<{ employerId: string; credential: Record<string, unknown> }>(
      'POST',
      `${base}/employer/profile`,
      { employerId, credential }
    );
  },
  async ensureEmployerProfile(employerId: string, credential: Record<string, unknown>) {
    return pluginRequest<{ employerId: string; credential: Record<string, unknown> }>(
      'POST',
      `${base}/employer/profile/ensure`,
      { employerId, credential }
    );
  },

  // Job postings
  async listJobPostingsByEmployer(employerId: string) {
    const res = await pluginRequest<{ jobs: unknown[] }>('GET', `${base}/jobs`, undefined, {
      employerId,
    });
    return res.jobs;
  },
  async getJobPostingById(id: string) {
    return pluginGetOptional<Record<string, unknown>>(
      `${base}/jobs/${encodeURIComponent(id)}`
    );
  },
  async createJobPosting(data: Record<string, unknown>) {
    return pluginRequest<Record<string, unknown>>('POST', `${base}/jobs`, data);
  },

  // Credential analysis config
  async getCredentialAnalysisConfig() {
    return pluginRequest<Record<string, unknown>>('GET', `${base}/credential-analysis`);
  },
  async updateCredentialAnalysisConfig(config: Record<string, unknown>) {
    return pluginRequest<Record<string, unknown>>('PUT', `${base}/credential-analysis`, config);
  },
};
