/**
 * OOB invitation API (public).
 */

import axios from 'axios';

const API_TIMEOUT_MS = 5000;

export interface ActiveInvitation {
  invitation_url: string | null;
  qr_url: string | null;
}

export async function getActiveInvitation(): Promise<ActiveInvitation> {
  try {
    const res = await axios.get<ActiveInvitation>(
      '/api/oob/active',
      { timeout: API_TIMEOUT_MS }
    );
    return res.data ?? { invitation_url: null, qr_url: null };
  } catch {
    return { invitation_url: null, qr_url: null };
  }
}
