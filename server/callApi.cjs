// ─── ElderSafe Call API (Exotel outbound calling) ───────────────────────────
//
// Shared by vite.config.ts middleware and server/standalone.cjs.
// Node built-ins only — no extra packages. Credentials read from .env / process.env.
//
// Routes (all under /api/calls):
//   GET  /api/calls/config          → { configured } (never secrets)
//   POST /api/calls                 → initiate call (real Exotel or demo)
//   POST /api/calls/webhook         → Exotel status callback (token-guarded)
//   POST /api/calls/:id/end         → hang up / finalize
//   GET  /api/calls/history         → recent in-memory records
//   GET  /api/calls/stream          → SSE CALL_UPDATE events
//   GET  /api/calls/:id             → single record
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// ─── Env loading (process.env wins; reads project root .env) ────────────────

function loadEnvFile() {
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const raw = fs.readFileSync(file, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && !(key in process.env)) process.env[key] = val;
      }
    } catch {
      // ignore unreadable env file
    }
  }
}

loadEnvFile();

// ─── Exotel configuration ────────────────────────────────────────────────────

function getExotelConfig() {
  const sid = process.env.EXOTEL_SID || '';
  const apiKey = process.env.EXOTEL_API_KEY || '';
  const apiToken = process.env.EXOTEL_API_TOKEN || '';
  const virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER || '';
  const fromNumber = process.env.EXOTEL_FROM_NUMBER || '';
  const publicUrl = (process.env.EXOTEL_PUBLIC_URL || '').replace(/\/+$/, '');
  const webhookToken = process.env.EXOTEL_WEBHOOK_TOKEN || '';
  const configured = Boolean(sid && apiKey && apiToken && virtualNumber && fromNumber);
  return { sid, apiKey, apiToken, virtualNumber, fromNumber, publicUrl, webhookToken, configured };
}

// ─── Phone validation / normalization ───────────────────────────────────────

/** Returns E.164 (+91…) or null if not dialable. */
function normalizePhone(raw) {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
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

/** Exotel API wants digits without '+'. */
function toExotelNumber(e164) {
  return String(e164 || '').replace(/^\+/, '');
}

// ─── In-memory call store ───────────────────────────────────────────────────

/** @type {Map<string, any>} */
const calls = new Map();
/** @type {Set<import('http').ServerResponse>} */
const sseClients = new Set();
const HISTORY_LIMIT = 100;
const demoTimers = new Map();
const pollTimers = new Map();

const TERMINAL = new Set(['completed', 'failed', 'no_answer']);

function publicView(record) {
  if (!record) return null;
  return {
    id: record.id,
    to: record.to,
    toLabel: record.toLabel || '',
    contactId: record.contactId || null,
    alertId: record.alertId || null,
    status: record.status,
    durationSec: record.durationSec || 0,
    reason: record.reason || null,
    error: record.error || null,
    demo: Boolean(record.demo),
    escalationChain: (record.escalationChain || []).slice(),
    escalatedFrom: record.escalatedFrom || null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    connectedAt: record.connectedAt,
    completedAt: record.completedAt,
    exotelCallSid: record.exotelCallSid ? String(record.exotelCallSid) : null,
  };
}

function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function updateCall(id, patch, opts = {}) {
  const record = calls.get(id);
  if (!record) return null;
  Object.assign(record, patch, { updatedAt: new Date().toISOString() });
  if (!opts.silent) {
    broadcast({ type: 'CALL_UPDATE', call: publicView(record) });
  }
  if (TERMINAL.has(record.status)) {
    stopTimers(id);
  }
  return record;
}

function stopTimers(id) {
  const t1 = demoTimers.get(id);
  if (t1) {
    clearTimeout(t1);
    demoTimers.delete(id);
  }
  const t2 = pollTimers.get(id);
  if (t2) {
    clearInterval(t2);
    pollTimers.delete(id);
  }
}

function sanitizeError(err) {
  const msg = err instanceof Error ? err.message : String(err || 'Unknown error');
  return msg
    .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, 'Basic [redacted]')
    .replace(/(api[_-]?key|api[_-]?token|authorization)=([^&\s]+)/gi, '$1=[redacted]')
    .slice(0, 300);
}

// ─── Demo pipeline (same shape as real, clearly labeled) ────────────────────

function runDemoTimeline(record) {
  const id = record.id;
  const t1 = setTimeout(() => {
    const c = calls.get(id);
    if (!c || TERMINAL.has(c.status)) return;
    updateCall(id, { status: 'ringing', reason: 'DEMO ringing…' });

    const hasChain = Array.isArray(c.escalationChain) && c.escalationChain.length > 0;
    const t2 = setTimeout(() => {
      const c2 = calls.get(id);
      if (!c2 || TERMINAL.has(c2.status)) return;

      if (hasChain) {
        // Simulate unanswered primary → escalate to next contact
        updateCall(id, { status: 'no_answer', reason: 'No answer (DEMO)', completedAt: new Date().toISOString() });
        escalateChain(c2);
        return;
      }

      updateCall(id, {
        status: 'connected',
        connectedAt: new Date().toISOString(),
        reason: 'Connected (DEMO)',
      });

      const t3 = setTimeout(() => {
        const c3 = calls.get(id);
        if (!c3 || TERMINAL.has(c3.status)) return;
        const started = c3.connectedAt ? Date.parse(c3.connectedAt) : Date.now();
        const dur = Math.max(1, Math.round((Date.now() - started) / 1000));
        updateCall(id, {
          status: 'completed',
          durationSec: dur,
          reason: 'Completed (DEMO)',
          completedAt: new Date().toISOString(),
        });
      }, 15000);
      demoTimers.set(id, t3);
    }, 2500);
    demoTimers.set(id, t2);
  }, 1200);
  demoTimers.set(id, t1);
}

// ─── Escalation chain (primary → secondary) ─────────────────────────────────

function escalateChain(fromRecord) {
  const chain = Array.isArray(fromRecord.escalationChain) ? fromRecord.escalationChain.slice() : [];
  if (!chain.length) return;
  const next = chain.shift();
  const normalized = normalizePhone(next);
  if (!normalized) return;
  startCall({
    to: normalized,
    toLabel: fromRecord.toLabel ? `Escalation → ${normalized}` : '',
    contactId: null,
    alertId: fromRecord.alertId,
    mode: fromRecord.demo ? 'demo' : 'real',
    escalationChain: chain,
    escalatedFrom: fromRecord.id,
  }).catch(() => {
    // failure already recorded on the child call when possible
  });
}

// ─── Exotel HTTP ─────────────────────────────────────────────────────────────

function exotelRequest(method, urlPath, formObj) {
  const cfg = getExotelConfig();
  const auth = Buffer.from(`${cfg.apiKey}:${cfg.apiToken}`).toString('base64');
  const payload = formObj ? new URLSearchParams(formObj).toString() : null;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.exotel.com',
        path: urlPath,
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {
            /* non-JSON */
          }
          resolve({ statusCode: res.statusCode || 0, body, json });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Exotel request timed out'));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function mapExotelStatus(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().replace(/[\s]+/g, '-');
  if (s === 'in-progress' || s === 'in_progress' || s === 'inprogress') return 'connected';
  if (s === 'queued' || s === 'initiated' || s === 'ringing') return 'ringing';
  if (s === 'completed') return 'completed';
  if (s === 'no-answer' || s === 'no_answer' || s === 'noanswer') return 'no_answer';
  if (s === 'busy') return 'failed';
  if (s === 'failed' || s === 'canceled' || s === 'cancelled') return 'failed';
  return null;
}

async function initiateExotelCall(record) {
  const cfg = getExotelConfig();
  if (!cfg.configured) {
    throw Object.assign(new Error('Exotel is not configured'), { code: 'EXOTEL_NOT_CONFIGURED' });
  }

  const params = {
    From: toExotelNumber(cfg.fromNumber),
    To: toExotelNumber(record.to),
    CallerId: toExotelNumber(cfg.virtualNumber),
    Record: 'false',
    StatusCallbackEventType: 'in-progress,completed,busy,no-answer,failed',
  };

  if (cfg.publicUrl && cfg.webhookToken) {
    params.StatusCallback = `${cfg.publicUrl}/api/calls/webhook?token=${encodeURIComponent(cfg.webhookToken)}`;
  }

  const res = await exotelRequest('POST', `/v1/Accounts/${cfg.sid}/Calls/connect.json`, params);

  if (res.statusCode < 200 || res.statusCode >= 300) {
    const providerMsg =
      (res.json && (res.json.message || res.json.Message || res.json.error)) ||
      `Exotel HTTP ${res.statusCode}`;
    const err = new Error(`Exotel provider error: ${providerMsg}`);
    err.code = 'EXOTEL_PROVIDER_ERROR';
    throw err;
  }

  const sid =
    (res.json && (res.json.Sid || res.json.sid || res.json.CallSid)) ||
    extractSid(res.body) ||
    null;

  if (!sid) {
    const err = new Error('Exotel accepted the request but returned no CallSid');
    err.code = 'EXOTEL_PROVIDER_ERROR';
    throw err;
  }

  return String(sid);
}

function extractSid(body) {
  if (typeof body !== 'string') return null;
  const m = body.match(/"Sid"\s*:\s*"([A-Za-z0-9]+)"/) || body.match(/CallSid[=:]\s*([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

function startStatusPolling(recordId) {
  // Fallback when webhooks are unreachable (local dev without public URL).
  if (pollTimers.has(recordId)) return;
  let ticks = 0;
  const timer = setInterval(async () => {
    ticks += 1;
    const record = calls.get(recordId);
    if (!record || TERMINAL.has(record.status) || !record.exotelCallSid) {
      clearInterval(timer);
      pollTimers.delete(recordId);
      return;
    }
    if (ticks > 40) {
      clearInterval(timer);
      pollTimers.delete(recordId);
      return;
    }
    try {
      const cfg = getExotelConfig();
      const res = await exotelRequest(
        'GET',
        `/v1/Accounts/${cfg.sid}/Calls/${record.exotelCallSid}.json`,
        null
      );
      if (res.statusCode >= 200 && res.statusCode < 300 && res.json) {
        applyProviderStatus(recordId, res.json);
      }
    } catch {
      // keep polling quietly
    }
  }, 3000);
  pollTimers.set(recordId, timer);
}

function applyProviderStatus(recordId, payload) {
  const record = calls.get(recordId);
  if (!record || TERMINAL.has(record.status)) return;

  const statusRaw =
    payload.Status ||
    payload.status ||
    (payload.Call && (payload.Call.Status || payload.Call.status)) ||
    '';
  const mapped = mapExotelStatus(statusRaw);
  if (!mapped) return;

  if (mapped === 'connected' && record.status !== 'connected') {
    updateCall(recordId, {
      status: 'connected',
      connectedAt: record.connectedAt || new Date().toISOString(),
      reason: 'Connected',
    });
    return;
  }

  if (mapped === 'ringing' && (record.status === 'calling' || record.status === 'ready')) {
    updateCall(recordId, { status: 'ringing', reason: 'Ringing' });
    return;
  }

  if (TERMINAL.has(mapped)) {
    const durationRaw = payload.Duration ?? payload.duration ?? payload.CallDuration;
    let durationSec = record.durationSec || 0;
    if (mapped === 'completed') {
      const n = Number(durationRaw);
      if (Number.isFinite(n) && n >= 0) {
        durationSec = Math.round(n);
      } else if (record.connectedAt) {
        durationSec = Math.max(0, Math.round((Date.now() - Date.parse(record.connectedAt)) / 1000));
      }
    }

    const reasonMap = {
      completed: 'Call completed',
      no_answer: 'No answer',
      failed: statusRaw ? `Provider status: ${statusRaw}` : 'Call failed',
    };

    const updated = updateCall(recordId, {
      status: mapped,
      durationSec,
      reason: reasonMap[mapped] || mapped,
      completedAt: new Date().toISOString(),
    });

    if (updated && (mapped === 'no_answer' || mapped === 'failed')) {
      escalateChain(updated);
    }
  }
}

async function hangupExotel(record) {
  if (!record.exotelCallSid || record.demo) return;
  try {
    const cfg = getExotelConfig();
    if (!cfg.configured) return;
    await exotelRequest('POST', `/v1/Accounts/${cfg.sid}/Calls/${record.exotelCallSid}.json`, {
      Status: 'completed',
    });
  } catch {
    // hangup best-effort — status polling/webhook still finalizes
  }
}

// ─── Start a call ───────────────────────────────────────────────────────────

async function startCall({
  to,
  toLabel,
  contactId,
  alertId,
  mode,
  escalationChain,
  escalatedFrom,
}) {
  const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const record = {
    id,
    to,
    toLabel: toLabel || '',
    contactId: contactId || null,
    alertId: alertId || null,
    mode: mode === 'demo' ? 'demo' : 'real',
    demo: mode === 'demo',
    status: 'calling',
    durationSec: 0,
    reason: 'Dialing…',
    error: null,
    escalationChain: Array.isArray(escalationChain) ? escalationChain.slice() : [],
    escalatedFrom: escalatedFrom || null,
    exotelCallSid: null,
    createdAt: now,
    updatedAt: now,
    connectedAt: null,
    completedAt: null,
  };
  calls.set(id, record);
  broadcast({ type: 'CALL_UPDATE', call: publicView(record) });

  if (record.demo) {
    record.reason = 'DEMO dialing…';
    runDemoTimeline(record);
    return publicView(record);
  }

  try {
    const sid = await initiateExotelCall(record);
    updateCall(id, {
      exotelCallSid: sid,
      status: 'ringing',
      reason: 'Ringing via Exotel',
    });
    startStatusPolling(id);
  } catch (err) {
    updateCall(id, {
      status: 'failed',
      reason: 'Provider error',
      error: sanitizeError(err),
      completedAt: new Date().toISOString(),
    });
    const rec = calls.get(id);
    if (rec) escalateChain(rec);
  }

  return publicView(calls.get(id));
}

// ─── HTTP helpers ───────────────────────────────────────────────────────────

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({ raw: '', json: {}, form: {} });
      let json = {};
      try {
        json = JSON.parse(body);
      } catch {
        json = {};
      }
      const form = {};
      try {
        const params = new URLSearchParams(body);
        for (const [k, v] of params) form[k] = v;
      } catch {
        /* not form-encoded */
      }
      resolve({ raw: body, json, form });
    });
    req.on('error', reject);
  });
}

// ─── Main dispatcher ────────────────────────────────────────────────────────

async function handleCallApiRequest(req, res) {
  const url = req.url || '';
  let parsed;
  try {
    parsed = new URL(url, 'http://localhost');
  } catch {
    return false;
  }
  const pathname = parsed.pathname;
  if (!pathname.startsWith('/api/calls')) return false;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  try {
    // GET /api/calls/config
    if (pathname === '/api/calls/config' && req.method === 'GET') {
      const cfg = getExotelConfig();
      sendJson(res, 200, {
        success: true,
        configured: cfg.configured,
        webhookReady: Boolean(cfg.publicUrl && cfg.webhookToken),
      });
      return true;
    }

    // GET /api/calls/stream (SSE)
    if (pathname === '/api/calls/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(': connected\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return true;
    }

    // GET /api/calls/history
    if (pathname === '/api/calls/history' && req.method === 'GET') {
      const list = Array.from(calls.values())
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, HISTORY_LIMIT)
        .map(publicView);
      sendJson(res, 200, { success: true, calls: list });
      return true;
    }

    // POST /api/calls/webhook — Exotel status callback
    if (pathname === '/api/calls/webhook' && req.method === 'POST') {
      const token = parsed.searchParams.get('token') || '';
      const cfg = getExotelConfig();
      if (cfg.webhookToken && token !== cfg.webhookToken) {
        sendJson(res, 401, { success: false, error: 'Invalid webhook token' });
        return true;
      }
      const { json, form } = await readBody(req);
      const payload = { ...form, ...(json && typeof json === 'object' ? json : {}) };
      // Also merge query params (some providers use GET-style callbacks)
      for (const [k, v] of parsed.searchParams) {
        if (k !== 'token' && payload[k] === undefined) payload[k] = v;
      }

      const callSid = payload.CallSid || payload.call_sid || payload.Sid || '';
      const status = payload.Status || payload.status || '';
      let target = null;
      if (callSid) {
        target = Array.from(calls.values()).find((c) => c.exotelCallSid === callSid);
      }
      if (target) {
        applyProviderStatus(target.id, payload);
      } else if (status) {
        // Unknown sid — acknowledge but do not invent a record
        console.warn('[calls] webhook for unknown CallSid', String(callSid).slice(0, 40));
      }
      // Exotel expects 200 quickly
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return true;
    }

    // POST /api/calls — initiate
    if (pathname === '/api/calls' && req.method === 'POST') {
      const { json } = await readBody(req);
      const rawTo = json.to ?? json.phone ?? '';
      const mode = json.mode === 'demo' ? 'demo' : 'real';
      const chain = Array.isArray(json.chain) ? json.chain.filter(Boolean) : [];

      const normalized = normalizePhone(rawTo);
      if (!normalized) {
        sendJson(res, 400, {
          success: false,
          code: 'INVALID_PHONE',
          error:
            'Invalid phone number. Enter a valid Indian mobile number (e.g. +91 98765 43210).',
        });
        return true;
      }

      if (mode !== 'demo') {
        const cfg = getExotelConfig();
        if (!cfg.configured) {
          sendJson(res, 503, {
            success: false,
            code: 'EXOTEL_NOT_CONFIGURED',
            error:
              'Exotel is not configured. Add EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_VIRTUAL_NUMBER, and EXOTEL_FROM_NUMBER to .env, then restart the server.',
          });
          return true;
        }
      }

      const record = await startCall({
        to: normalized,
        toLabel: typeof json.toLabel === 'string' ? json.toLabel.slice(0, 120) : '',
        contactId: json.contactId || null,
        alertId: json.alertId || null,
        mode,
        escalationChain: chain.map((c) => normalizePhone(c)).filter(Boolean),
      });

      sendJson(res, 200, { success: true, call: record });
      return true;
    }

    // POST /api/calls/:id/end
    const endMatch = pathname.match(/^\/api\/calls\/([^/]+)\/end$/);
    if (endMatch && req.method === 'POST') {
      const id = decodeURIComponent(endMatch[1]);
      const record = calls.get(id);
      if (!record) {
        sendJson(res, 404, { success: false, error: 'Call not found' });
        return true;
      }
      if (TERMINAL.has(record.status)) {
        sendJson(res, 200, { success: true, call: publicView(record) });
        return true;
      }
      await hangupExotel(record);
      const dur = record.connectedAt
        ? Math.max(0, Math.round((Date.now() - Date.parse(record.connectedAt)) / 1000))
        : 0;
      const updated = updateCall(id, {
        status: 'completed',
        durationSec: dur,
        reason: 'Ended by user',
        completedAt: new Date().toISOString(),
      });
      sendJson(res, 200, { success: true, call: publicView(updated) });
      return true;
    }

    // GET /api/calls/:id
    const getMatch = pathname.match(/^\/api\/calls\/([^/]+)$/);
    if (getMatch && req.method === 'GET') {
      const id = decodeURIComponent(getMatch[1]);
      const record = calls.get(id);
      if (!record) {
        sendJson(res, 404, { success: false, error: 'Call not found' });
        return true;
      }
      sendJson(res, 200, { success: true, call: publicView(record) });
      return true;
    }

    sendJson(res, 404, { success: false, error: `Endpoint ${pathname} not found` });
    return true;
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      code: 'CALL_API_ERROR',
      error: sanitizeError(error),
    });
    return true;
  }
}

module.exports = {
  handleCallApiRequest,
  normalizePhone,
  getExotelConfig,
  loadEnvFile,
};
