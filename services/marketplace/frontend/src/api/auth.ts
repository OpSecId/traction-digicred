/**
 * Auth API client.
 */

import axios from 'axios';

const AUTH_TIMEOUT_MS = 5000;

export interface EmployerLoginResponse {
  employerId: string;
  employerName: string;
}

export interface TenantSessionResponse {
  employerId: string | null;
  employerName: string | null;
}

export async function tenantLogin(
  email: string,
  apiKey: string
): Promise<EmployerLoginResponse> {
  const res = await axios.post<EmployerLoginResponse>(
    '/api/auth/tenant-login',
    { email, apiKey },
    { timeout: AUTH_TIMEOUT_MS, withCredentials: true }
  );
  return res.data;
}

export async function getTenantSession(): Promise<TenantSessionResponse> {
  const res = await axios.get<TenantSessionResponse>('/api/auth/tenant-session', {
    timeout: 5000,
    withCredentials: true,
  });
  return res.data;
}

export async function tenantLogout(): Promise<void> {
  await axios.post('/api/auth/tenant-logout', {}, { withCredentials: true });
}

export async function innkeeperLogin(email: string, password: string): Promise<{ success: boolean }> {
  const res = await axios.post<{ success: boolean }>(
    '/api/auth/innkeeper-login',
    { email, password },
    { timeout: AUTH_TIMEOUT_MS, withCredentials: true }
  );
  return res.data;
}

export interface InnkeeperSessionResponse {
  isAdmin: boolean;
}

export async function getInnkeeperSession(): Promise<InnkeeperSessionResponse> {
  const res = await axios.get<InnkeeperSessionResponse>('/api/auth/innkeeper-session', {
    timeout: 5000,
    withCredentials: true,
  });
  return res.data;
}

export async function innkeeperLogout(): Promise<void> {
  await axios.post('/api/auth/innkeeper-logout', {}, { withCredentials: true });
}
