/**
 * Base HTTP client for ACA-Py agent requests.
 * Adds API key auth and handles common request/response patterns.
 */

export interface AgentConfig {
  uri: string;
  apiKey: string;
}

export async function agentRequest<T = unknown>(
  config: AgentConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { uri, apiKey } = config;
  if (!uri) {
    throw new Error('Agent URI not configured');
  }

  const url = `${uri.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
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
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}
