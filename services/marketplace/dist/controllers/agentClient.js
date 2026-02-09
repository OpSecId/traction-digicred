"use strict";
/**
 * Base HTTP client for ACA-Py agent requests.
 * Adds API key auth and handles common request/response patterns.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRequest = agentRequest;
async function agentRequest(config, path, options = {}) {
    const { uri, apiKey, bearerToken } = config;
    if (!uri) {
        throw new Error('Agent URI not configured (set MARKETPLACE_AGENCY_URI)');
    }
    const base = uri.replace(/\/$/, '');
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    try {
        new URL(url);
    }
    catch {
        throw new Error(`Invalid MARKETPLACE_AGENCY_URI: "${uri}" contains invalid characters (e.g. spaces). Use a valid URL like https://your-agent.railway.app`);
    }
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (apiKey) {
        headers['X-API-Key'] = apiKey;
    }
    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    const res = await fetch(url, {
        ...options,
        headers,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Agent request failed (${res.status}): ${text}`);
    }
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return res.json();
    }
    return res.text();
}
