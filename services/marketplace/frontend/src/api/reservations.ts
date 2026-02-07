/**
 * Reservations API - public lookup by ID (check on my reservation).
 */

import axios from 'axios';
import type { TenantRequest } from '@/types/demo';

const API_TIMEOUT_MS = 15000;

export async function getReservationById(id: string): Promise<TenantRequest | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const res = await axios.get<TenantRequest>(`/api/reservations/${encodeURIComponent(trimmed)}`, {
    timeout: API_TIMEOUT_MS,
    validateStatus: (s) => s === 200 || s === 404,
  });
  if (res.status === 404) return null;
  return res.data;
}
