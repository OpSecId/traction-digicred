"use strict";
/**
 * Marketplace plugin controller - proxies to ACA-Py multitenant agent.
 * Create invitation, analyze transcript. Uses MARKETPLACE_AGENCY_URI + API key.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceController = void 0;
const agentClient_1 = require("./agentClient");
const config_1 = require("../config");
exports.marketplaceController = {
    config: config_1.marketplaceAgencyConfig,
    async createInvitation(body) {
        return (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/marketplace/invitation', {
            method: 'POST',
            body: JSON.stringify(body ?? {}),
        });
    },
    async analyzeTranscript(body) {
        return (0, agentClient_1.agentRequest)(config_1.marketplaceAgencyConfig, '/marketplace/analyze-transcript', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },
};
