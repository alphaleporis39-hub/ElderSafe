// ─── ElderSafe backend API base URL (single source of truth) ────────────────
//
// Configure ONCE via the environment — never hardcode a host in components:
//
//   VITE_API_BASE_URL=https://eldersafe-production.up.railway.app
//
// Every frontend REST call and SSE stream must be built with apiUrl() so it
// honours this value. When the variable is empty/unset, paths stay relative to
// the page origin, which preserves local development against the Vite
// dev-server middleware (see vite.config.ts) and `npm run preview`.

const rawBase: string = String(import.meta.env.VITE_API_BASE_URL ?? '').trim();

/** Remote backend origin without a trailing slash ("" = same-origin/local). */
export const API_BASE_URL: string = rawBase.replace(/\/+$/, '');

/** True when a remote backend (Railway/Render) is configured. */
export const USING_REMOTE_API: boolean = API_BASE_URL.length > 0;

/** Build a full URL for a backend path: apiUrl('/api/devices/state'). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * fetch() a backend JSON endpoint with uniform error handling.
 * Network failures and HTTP errors both surface as a clean Error with a
 * human-readable message (never a raw stack trace) so callers can show it
 * without breaking the UI.
 */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), init);
  } catch {
    throw new Error(
      USING_REMOTE_API
        ? `Cannot reach ElderSafe backend at ${API_BASE_URL}`
        : 'Cannot reach the local ElderSafe backend'
    );
  }
  const data = (await res.json().catch(() => ({}))) as T & {
    success?: boolean;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status}) for ${path}`);
  }
  return data;
}
