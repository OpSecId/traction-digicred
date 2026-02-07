/**
 * OOB invitation API (public).
 */

import axios from 'axios';

const API_TIMEOUT_MS = 5000;

export async function getActiveInvitationUrl(): Promise<string | null> {
  try {
    const res = await axios.get<{ invitation_url: string | null }>(
      '/api/oob/active',
      { timeout: API_TIMEOUT_MS }
    );
    return res.data?.invitation_url ?? null;
  } catch {
    return null;
  }
}
