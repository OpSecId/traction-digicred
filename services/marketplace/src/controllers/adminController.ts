/**
 * Controller for the Marketplace Agency (single multitenant ACA-Py agent).
 * Handles platform admin operations, tenant approval, provisioning triggers.
 */

import { agentRequest } from './agentClient';
import { marketplaceAgencyConfig } from '../config';

export const adminController = {
  config: marketplaceAgencyConfig,

  /** Check if the admin agent is configured and reachable */
  async status(): Promise<{ configured: boolean; reachable?: boolean }> {
    if (!marketplaceAgencyConfig.uri) {
      return { configured: false };
    }
    try {
      await agentRequest(marketplaceAgencyConfig, '/status');
      return { configured: true, reachable: true };
    } catch {
      return { configured: true, reachable: false };
    }
  },

  /** Get agent status/details (ACA-Py /status endpoint) */
  async getStatus(): Promise<unknown> {
    return agentRequest(marketplaceAgencyConfig, '/status');
  },

  /** Provision a tenant (trigger workflow - implementation depends on agent setup) */
  async provisionTenant(tenantRequestId: string, payload?: Record<string, unknown>): Promise<unknown> {
    return agentRequest(marketplaceAgencyConfig, '/admin/provision-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenant_request_id: tenantRequestId, ...payload }),
    });
  },
};
