/**
 * Controller for the Marketplace Tenancy agent (ACA-Py multitenant).
 * Handles sub-wallet creation, tenant DIDs, credential issuance per employer.
 */

import { agentRequest } from './agentClient';
import { marketplaceAgencyConfig } from '../config';

export const tenancyController = {
  config: marketplaceAgencyConfig,

  /** Check if the tenancy agent is configured and reachable */
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

  /** Create a tenant / sub-wallet */
  async createTenant(walletName: string, payload?: Record<string, unknown>): Promise<unknown> {
    return agentRequest(marketplaceAgencyConfig, '/multitenancy/wallet', {
      method: 'POST',
      body: JSON.stringify({ wallet_name: walletName, ...payload }),
    });
  },

  /** Get tenant wallet by ID */
  async getTenant(walletId: string): Promise<unknown> {
    return agentRequest(marketplaceAgencyConfig, `/multitenancy/wallet/${walletId}`);
  },
};
