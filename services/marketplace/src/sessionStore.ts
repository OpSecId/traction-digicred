/**
 * Redis-backed session store for tenant (employer) and innkeeper sessions.
 * If REDIS_URL is not set, sessions are disabled and no persistence occurs.
 */

import Redis from 'ioredis';
import { randomBytes } from 'crypto';

const REDIS_URL = process.env.REDIS_URL;
const TENANT_TTL = Number(process.env.TENANT_SESSION_TTL_SECONDS) || 7 * 24 * 60 * 60; // 7 days
const INNKEEPER_TTL = Number(process.env.INNKEEPER_SESSION_TTL_SECONDS) || 7 * 24 * 60 * 60; // 7 days
const SESSION_COOKIE_NAME = 'tenant_session';
const INNKEEPER_COOKIE_NAME = 'innkeeper_session';
const SESSION_PREFIX = 'tenant_sess:';
const INNKEEPER_PREFIX = 'innkeeper_sess:';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
    redis.on('error', (err) => console.error('[session] Redis error:', err.message));
  }
  return redis;
}

export interface TenantSession {
  employerId: string;
  employerName: string;
}

export interface InnkeeperSession {
  type: 'innkeeper';
}

export async function createSession(data: TenantSession): Promise<string> {
  const client = getRedis();
  if (!client) return '';

  const id = randomBytes(24).toString('base64url');
  const key = SESSION_PREFIX + id;
  await client.setex(key, TENANT_TTL, JSON.stringify(data));
  return id;
}

export async function getSession(id: string): Promise<TenantSession | null> {
  const client = getRedis();
  if (!client || !id) return null;

  const key = SESSION_PREFIX + id;
  const raw = await client.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TenantSession;
  } catch {
    return null;
  }
}

export async function destroySession(id: string): Promise<void> {
  const client = getRedis();
  if (!client || !id) return;

  const key = SESSION_PREFIX + id;
  await client.del(key);
}

export async function createInnkeeperSession(): Promise<string> {
  const client = getRedis();
  if (!client) return '';

  const id = randomBytes(24).toString('base64url');
  const key = INNKEEPER_PREFIX + id;
  await client.setex(key, INNKEEPER_TTL, JSON.stringify({ type: 'innkeeper' } as InnkeeperSession));
  return id;
}

export async function getInnkeeperSession(id: string): Promise<InnkeeperSession | null> {
  const client = getRedis();
  if (!client || !id) return null;

  const key = INNKEEPER_PREFIX + id;
  const raw = await client.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as InnkeeperSession;
  } catch {
    return null;
  }
}

export async function destroyInnkeeperSession(id: string): Promise<void> {
  const client = getRedis();
  if (!client || !id) return;

  const key = INNKEEPER_PREFIX + id;
  await client.del(key);
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
export const INNKEEPER_COOKIE = INNKEEPER_COOKIE_NAME;

export function isSessionEnabled(): boolean {
  return !!REDIS_URL;
}
