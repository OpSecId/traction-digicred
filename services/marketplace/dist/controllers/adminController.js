"use strict";
/**
 * Controller for the Marketplace Agency (single multitenant ACA-Py agent).
 * Handles platform admin operations, tenant approval, provisioning triggers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const agentClient_1 = require("./agentClient");
const config_1 = require("../config");
exports.adminController = {
    config: config_1.marketplaceAgencyConfig,
    /** Check if the admin agent is configured and reachable */
    async status() {
        if (!config_1.marketplaceAgencyConfig.uri) {
            return { configured: false };
        }
        try {
            await (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/status');
            return { configured: true, reachable: true };
        }
        catch {
            return { configured: true, reachable: false };
        }
    },
    /** Get agent status/details (ACA-Py /status endpoint) */
    async getStatus() {
        return (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/status');
    },
    /** Provision a tenant (trigger workflow - implementation depends on agent setup) */
    async provisionTenant(tenantRequestId, payload) {
        return (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/admin/provision-tenant', {
            method: 'POST',
            body: JSON.stringify({ tenant_request_id: tenantRequestId, ...payload }),
        });
    },
    /** Get settings for Innkeeper UI: agent config from ACA-Py + marketplace config (sanitized) */
    async getSettings() {
        let agentStatus;
        let reachable = false;
        if (config_1.marketplaceAgencyConfig.uri) {
            try {
                agentStatus = (await (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/status'));
                reachable = true;
            }
            catch {
                reachable = false;
            }
        }
        return {
            agent: {
                configured: !!config_1.marketplaceAgencyConfig.uri,
                reachable,
                status: agentStatus,
            },
            marketplace: {
                baseUrl: config_1.marketplaceBaseUrl,
                contextUri: config_1.marketplaceContextUri,
                issuerId: config_1.marketplaceIssuer.id,
            },
        };
    },
};
