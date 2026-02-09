"use strict";
/**
 * Redis-backed session store for tenant (employer) and innkeeper sessions.
 * If REDIS_URL is not set, sessions are disabled and no persistence occurs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INNKEEPER_COOKIE = exports.SESSION_COOKIE = void 0;
exports.createSession = createSession;
exports.getSession = getSession;
exports.destroySession = destroySession;
exports.createInnkeeperSession = createInnkeeperSession;
exports.getInnkeeperSession = getInnkeeperSession;
exports.destroyInnkeeperSession = destroyInnkeeperSession;
exports.isSessionEnabled = isSessionEnabled;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = require("crypto");
const REDIS_URL = process.env.REDIS_URL;
const TENANT_TTL = Number(process.env.TENANT_SESSION_TTL_SECONDS) || 7 * 24 * 60 * 60; // 7 days
const INNKEEPER_TTL = Number(process.env.INNKEEPER_SESSION_TTL_SECONDS) || 7 * 24 * 60 * 60; // 7 days
const SESSION_COOKIE_NAME = 'tenant_session';
const INNKEEPER_COOKIE_NAME = 'innkeeper_session';
const SESSION_PREFIX = 'tenant_sess:';
const INNKEEPER_PREFIX = 'innkeeper_sess:';
let redis = null;
function getRedis() {
    if (!REDIS_URL)
        return null;
    if (!redis) {
        redis = new ioredis_1.default(REDIS_URL, { maxRetriesPerRequest: 3 });
        redis.on('error', (err) => console.error('[session] Redis error:', err.message));
    }
    return redis;
}
async function createSession(data) {
    const client = getRedis();
    if (!client)
        return '';
    const id = (0, crypto_1.randomBytes)(24).toString('base64url');
    const key = SESSION_PREFIX + id;
    await client.setex(key, TENANT_TTL, JSON.stringify(data));
    return id;
}
async function getSession(id) {
    const client = getRedis();
    if (!client || !id)
        return null;
    const key = SESSION_PREFIX + id;
    const raw = await client.get(key);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function destroySession(id) {
    const client = getRedis();
    if (!client || !id)
        return;
    const key = SESSION_PREFIX + id;
    await client.del(key);
}
async function createInnkeeperSession() {
    const client = getRedis();
    if (!client)
        return '';
    const id = (0, crypto_1.randomBytes)(24).toString('base64url');
    const key = INNKEEPER_PREFIX + id;
    await client.setex(key, INNKEEPER_TTL, JSON.stringify({ type: 'innkeeper' }));
    return id;
}
async function getInnkeeperSession(id) {
    const client = getRedis();
    if (!client || !id)
        return null;
    const key = INNKEEPER_PREFIX + id;
    const raw = await client.get(key);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function destroyInnkeeperSession(id) {
    const client = getRedis();
    if (!client || !id)
        return;
    const key = INNKEEPER_PREFIX + id;
    await client.del(key);
}
exports.SESSION_COOKIE = SESSION_COOKIE_NAME;
exports.INNKEEPER_COOKIE = INNKEEPER_COOKIE_NAME;
function isSessionEnabled() {
    return !!REDIS_URL;
}
