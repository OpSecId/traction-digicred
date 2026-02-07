/**
 * Auth API client.
 */

import axios from 'axios';

const AUTH_TIMEOUT_MS = 5000;

export interface EmployerLoginResponse {
  employerId: string;
  employerName: string;
}

export async function employerLogin(
  email: string,
  password: string
): Promise<EmployerLoginResponse> {
  const res = await axios.post<EmployerLoginResponse>(
    '/api/auth/employer-login',
    { email, password },
    { timeout: AUTH_TIMEOUT_MS }
  );
  return res.data;
}

export async function adminLogin(email: string, password: string): Promise<{ success: boolean }> {
  const res = await axios.post<{ success: boolean }>(
    '/api/auth/admin-login',
    { email, password },
    { timeout: AUTH_TIMEOUT_MS }
  );
  return res.data;
}
