// ─── ElderSafe Call Service (frontend → backend → Exotel) ───────────────────
// Never holds Exotel credentials — only talks to /api/calls on the backend.
// All URLs go through the centralized API base (src/config/api.ts).

import { apiUrl } from '../config/api';

export type CallStatus =
  | 'ready'
  | 'calling'
  | 'ringing'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'no_answer';

export interface CallRecord {
  id: string;
  to: string;
  toLabel?: string;
  contactId?: string | null;
  alertId?: string | null;
  status: CallStatus;
  durationSec: number;
  reason?: string | null;
  error?: string | null;
  demo: boolean;
  escalationChain?: string[];
  escalatedFrom?: string | null;
  createdAt: string;
  updatedAt?: string;
  connectedAt?: string | null;
  completedAt?: string | null;
  exotelCallSid?: string | null;
}

export interface InitiateCallPayload {
  to: string;
  toLabel?: string;
  contactId?: string;
  alertId?: string;
  mode?: 'real' | 'demo';
  chain?: string[];
}

export interface CallConfig {
  configured: boolean;
  webhookReady?: boolean;
}

/** Normalize to E.164 (+91…) or null if not dialable. Mirrors backend validation. */
export function normalizePhone(raw: string | undefined | null): string | null {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[\s\-().\u00A0]/g, '');
  if (!/^\+?\d+$/.test(s)) return null;
  let digits = s.replace(/^\+/, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^\d{10,15}$/.test(digits)) return `+${digits}`;
  return null;
}

export function isValidPhone(raw: string | undefined | null): boolean {
  return normalizePhone(raw) !== null;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T & {
    success?: boolean;
    error?: string;
    code?: string;
  };
  if (!res.ok) {
    const err = new Error(
      (data && data.error) || `Request failed (${res.status})`
    ) as Error & { code?: string; status?: number };
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function getCallConfig(): Promise<CallConfig> {
  const data = await jsonFetch<{ configured: boolean; webhookReady?: boolean }>(
    apiUrl('/api/calls/config')
  );
  return { configured: Boolean(data.configured), webhookReady: data.webhookReady };
}

export async function initiateCall(payload: InitiateCallPayload): Promise<CallRecord> {
  const data = await jsonFetch<{ success: boolean; call: CallRecord }>(apiUrl('/api/calls'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: payload.to,
      toLabel: payload.toLabel,
      contactId: payload.contactId,
      alertId: payload.alertId,
      mode: payload.mode || 'real',
      chain: payload.chain || [],
    }),
  });
  return data.call;
}

export async function endCall(callId: string): Promise<CallRecord> {
  const data = await jsonFetch<{ success: boolean; call: CallRecord }>(
    apiUrl(`/api/calls/${encodeURIComponent(callId)}/end`),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
  );
  return data.call;
}

export async function fetchCallHistory(): Promise<CallRecord[]> {
  const data = await jsonFetch<{ success: boolean; calls: CallRecord[] }>(
    apiUrl('/api/calls/history')
  );
  return Array.isArray(data.calls) ? data.calls : [];
}

/** Subscribe to CALL_UPDATE SSE events. Returns unsubscribe. */
export function subscribeToCallUpdates(
  onUpdate: (call: CallRecord) => void
): () => void {
  if (typeof window === 'undefined' || !window.EventSource) {
    return () => {};
  }
  let source: EventSource | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const connect = () => {
    if (closed) return;
    try {
      source = new EventSource(apiUrl('/api/calls/stream'));
      source.onmessage = (event) => {
        try {
          if (!event.data || event.data.startsWith(':')) return;
          const payload = JSON.parse(event.data);
          if (payload && payload.type === 'CALL_UPDATE' && payload.call) {
            onUpdate(payload.call as CallRecord);
          }
        } catch {
          // ignore non-json
        }
      };
      source.onerror = () => {
        if (source) {
          source.close();
          source = null;
        }
        if (!closed) retry = setTimeout(connect, 4000);
      };
    } catch {
      // SSE unavailable
    }
  };

  connect();

  return () => {
    closed = true;
    if (source) source.close();
    if (retry) clearTimeout(retry);
  };
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export const TERMINAL_CALL_STATUSES: CallStatus[] = [
  'completed',
  'failed',
  'no_answer',
];

export function isTerminalStatus(status: CallStatus): boolean {
  return TERMINAL_CALL_STATUSES.includes(status);
}

export function statusLabel(status: CallStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'calling':
      return 'Calling';
    case 'ringing':
      return 'Ringing';
    case 'connected':
      return 'Connected';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'no_answer':
      return 'No Answer';
    default:
      return status;
  }
}
