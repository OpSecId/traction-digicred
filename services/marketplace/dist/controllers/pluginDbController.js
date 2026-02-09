"use strict";
/**
 * Plugin controller - proxies tenant provisioning to the traction_marketplace plugin.
 * Uses MARKETPLACE_AGENCY_URI (plugin runs in multitenant agent).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTenant = createTenant;
const agentClient_1 = require("./agentClient");
const config_1 = require("../config");
/** Create tenant via plugin (provisions sub-wallet). Returns plugin response or null. */
async function createTenant(tenantRequestId, options) {
    const res = await (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/marketplace/tenants', {
        method: 'POST',
        body: JSON.stringify({ tenantRequestId, credential: options?.credential }),
    });
    return res;
}
