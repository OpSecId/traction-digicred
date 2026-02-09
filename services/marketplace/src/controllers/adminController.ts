/**
 * Controller for the Marketplace Agency (single multitenant ACA-Py agent).
 * Handles platform admin operations, tenant approval, provisioning triggers.
 */

import { agentRequest } from './agentClient';
import { marketplaceAgencyConfig, marketplaceBaseUrl, marketplaceContextUri, marketplaceIssuer } from '../config';

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

  /** Get settings for Innkeeper UI: agent config from ACA-Py + marketplace config (sanitized) */
  async getSettings(): Promise<{
    agent: {
      configured: boolean;
      reachable: boolean;
      status?: Record<string, unknown>;
      walletDids?: Array<{ did: string; posture?: string; method?: string }>;
    };
    marketplace: { baseUrl: string; contextUri: string; issuerId: string };
  }> {
    let agentStatus: Record<string, unknown> | undefined;
    let walletDids: Array<{ did: string; posture?: string; method?: string }> | undefined;
    let reachable = false;
    if (marketplaceAgencyConfig.uri) {
      try {
        agentStatus = (await agentRequest(marketplaceAgencyConfig, '/status')) as Record<string, unknown>;
        reachable = true;
      } catch {
        reachable = false;
      }
      // Fetch wallet DIDs when agent is reachable (from base wallet)
      if (reachable) {
        try {
          const didRes = (await agentRequest(marketplaceAgencyConfig, '/wallet/did')) as {
            results?: Array<{ did?: string; posture?: string; method?: string }>;
          };
          const list = didRes?.results ?? [];
          walletDids = list
            .filter((r) => r?.did)
            .map((r) => ({ did: r.did!, posture: r.posture, method: r.method }));
        } catch {
          walletDids = undefined;
        }
      }
    }
    return {
      agent: {
        configured: !!marketplaceAgencyConfig.uri,
        reachable,
        status: agentStatus,
        walletDids,
      },
      marketplace: {
        baseUrl: marketplaceBaseUrl,
        contextUri: marketplaceContextUri,
        issuerId: marketplaceIssuer.id,
      },
    };
  },
};
