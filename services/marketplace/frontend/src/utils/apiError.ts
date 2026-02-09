interface ApiErrorOptions {
  fallback?: string;
  unauthMessage?: string;
}

/**
 * Extract user-friendly error message from axios/API errors.
 */
export function getApiErrorMessage(
  err: unknown,
  fallbackOrOpts: string | ApiErrorOptions = 'Something went wrong'
): string {
  const opts = typeof fallbackOrOpts === 'string'
    ? { fallback: fallbackOrOpts }
    : { fallback: 'Something went wrong', ...fallbackOrOpts };
  const { fallback, unauthMessage = 'Invalid email or password' } = opts;

  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
    if (ax.response?.data?.error) return ax.response.data.error;
    if (ax.response?.status === 401) return unauthMessage;
    if (ax.response?.status === 400) return 'Invalid request. Please check your input.';
    if (
      !ax.response ||
      ax.message === 'Network Error' ||
      (ax.response.status && ax.response.status >= 500) ||
      [502, 503, 504].includes(ax.response.status ?? 0)
    ) {
      return 'Server unavailable. Is it running?';
    }
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      return 'Request timed out. Is the backend running?';
    }
  }
  return fallback;
}
