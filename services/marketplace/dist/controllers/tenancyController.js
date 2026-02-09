"use strict";
/**
 * Controller for the Marketplace Tenancy agent (ACA-Py multitenant).
 * Handles sub-wallet creation, tenant DIDs, credential issuance per employer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenancyController = void 0;
const agentClient_1 = require("./agentClient");
const config_1 = require("../config");
exports.tenancyController = {
    config: config_1.marketplaceAgencyConfig,
    /** Check if the tenancy agent is configured and reachable */
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
    /** Create a tenant / sub-wallet */
    async createTenant(walletName, payload) {
        return (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/multitenancy/wallet', {
            method: 'POST',
            body: JSON.stringify({ wallet_name: walletName, ...payload }),
        });
    },
    /** Get tenant wallet by ID */
    async getTenant(walletId) {
        return (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, `/multitenancy/wallet/${walletId}`);
    },
};
