/**
 * Plugin controller - proxies tenant provisioning to the traction_marketplace plugin.
 * Uses MARKETPLACE_AGENCY_URI (plugin runs in multitenant agent).
 */

import { agentRequest } from './agentClient';
import { marketplaceAgencyConfig } from '../config';

/** Create tenant via plugin (provisions sub-wallet). Returns plugin response or null. */
export async function createTenant(
  tenantRequestId: string,
  options?: { credential?: Record<string, unknown> }
): Promise<Record<string, unknown> | null> {
  const res = await agentRequest<Record<string, unknown>>(marketplaceAgencyConfig, '/marketplace/tenants', {
    method: 'POST',
    body: JSON.stringify({ tenantRequestId, credential: options?.credential }),
  });
  return res;
}
