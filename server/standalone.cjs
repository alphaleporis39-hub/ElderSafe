// ─── Standalone ElderSafe IoT Backend Server ────────────────────────────────
//
// Allows running the ElderSafe IoT API independently of Vite (e.g. on port 3001,
// or on a Raspberry Pi / gateway / Docker container).
//
// Usage:
//   node server/standalone.cjs
//   PORT=3001 DEVICE_API_KEY=my_secret_token node server/standalone.cjs
// ─────────────────────────────────────────────────────────────────────────────

const http = require('http');
const { handleCallApiRequest } = require('./callApi.cjs');

const PORT = process.env.PORT || 3001;
const DEVICE_TOKEN = process.env.DEVICE_API_KEY || 'eldersafe_esp32_secret_token';

// Never log the full device token.
function maskSecret(secret) {
  if (!secret) return '(unset)';
  if (secret.length <= 8) return '****';
  return `${secret.slice(0, 4)}****${secret.slice(-2)}`;
}

// Normalize the request path so common URL variants still route correctly:
//   "//api/devices/events"  → "/api/devices/events"  (double slash)
//   "/api/devices/events/"  → "/api/devices/events"  (trailing slash)
// Without this, ESP32 requests whose SERVER_URL ends with "/" get HTTP 404.
function normalizePathname(rawUrl) {
  let path = String(rawUrl || '/');
  const qIndex = path.indexOf('?');
  if (qIndex >= 0) path = path.slice(0, qIndex);
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path || '/';
}

// In-memory state
const devices = new Map();
const events = [];
const sseClients = new Set();

const config = {
  gracePeriodMinutes: 60,
  reminderWindowMinutes: 15,
  missedWindowMinutes: 90,
  deviceToken: DEVICE_TOKEN,
};

const medications = [
  {
    id: 'm1',
    name: 'Blood Pressure Medicine',
    compartment: 1,
    scheduledTime: '09:00 AM',
    scheduledHour: 9,
    scheduledMinute: 0,
    status: 'taken',
    takenAt: '09:04 AM',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm2',
    name: 'Afternoon Medicine (Multivitamin)',
    compartment: 2,
    scheduledTime: '01:30 PM',
    scheduledHour: 13,
    scheduledMinute: 30,
    status: 'due',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm3',
    name: 'Evening Medicine (Cholesterol)',
    compartment: 3,
    scheduledTime: '08:30 PM',
    scheduledHour: 20,
    scheduledMinute: 30,
    status: 'scheduled',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'm4',
    name: 'Night Medicine',
    compartment: 4,
    scheduledTime: '09:00 PM',
    scheduledHour: 21,
    scheduledMinute: 0,
    status: 'scheduled',
    updatedAt: new Date().toISOString(),
  },
];

// Pre-seed MEDBOX-001
const now = new Date();
devices.set('MEDBOX-001', {
  deviceId: 'MEDBOX-001',
  deviceType: 'medicine_box',
  name: 'Mohan Medicine Box',
  elderId: 'elder-001',
  online: true,
  lastSeen: now.toISOString(),
  lastSeenMs: now.getTime(),
  firmwareVersion: 'v1.0.0-esp32',
  createdAt: now.toISOString(),
});

const VALID_EVENTS = [
  'DEVICE_ONLINE',
  'DEVICE_OFFLINE',
  'HEARTBEAT',
  'MEDICINE_BOX_OPENED',
  'MEDICINE_COMPARTMENT_OPENED',
  'MEDICINE_TAKEN',
];

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

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function checkAuthorization(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return false;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return false;
  return parts[1] === config.deviceToken;
}

const server = http.createServer(async (req, res) => {
  const pathname = normalizePathname(req.url);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // GET /api/health (also /health) — simple liveness probe for browsers,
  // curl, ESP32 diagnostics, and hosting-platform uptime checks.
  if ((pathname === '/api/health' || pathname === '/health') && req.method === 'GET') {
    return sendJson(res, 200, { success: true, service: 'ElderSafe IoT' });
  }

  // SSE Stream
  if (pathname === '/api/devices/events/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // GET /api/devices
  if (pathname === '/api/devices' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      devices: Array.from(devices.values()),
      medications,
      config: {
        gracePeriodMinutes: config.gracePeriodMinutes,
        reminderWindowMinutes: config.reminderWindowMinutes,
        missedWindowMinutes: config.missedWindowMinutes,
      },
    });
  }

  // POST /api/devices/register
  if (pathname === '/api/devices/register' && req.method === 'POST') {
    if (!checkAuthorization(req)) {
      return sendJson(res, 401, {
        success: false,
        error: 'Unauthorized: Invalid or missing device token in Authorization header',
      });
    }

    try {
      const body = await parseJsonBody(req);
      const { deviceId, deviceType, name, elderId, firmwareVersion } = body;
      if (!deviceId || typeof deviceId !== 'string') {
        return sendJson(res, 400, {
          success: false,
          error: 'Missing required field: deviceId (string)',
        });
      }

      const dNow = new Date();
      const existing = devices.get(deviceId.trim());
      const dev = {
        deviceId: deviceId.trim(),
        deviceType: deviceType || 'medicine_box',
        name: name || 'Medicine Box',
        elderId: elderId || 'elder-001',
        online: true,
        lastSeen: dNow.toISOString(),
        lastSeenMs: dNow.getTime(),
        firmwareVersion: firmwareVersion || existing?.firmwareVersion || 'v1.0.0-esp32',
        createdAt: existing?.createdAt || dNow.toISOString(),
      };
      devices.set(dev.deviceId, dev);
      broadcast({ type: 'DEVICE_REGISTERED', device: dev });

      return sendJson(res, 200, {
        success: true,
        deviceId: dev.deviceId,
      });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // POST /api/devices/heartbeat
  if (pathname === '/api/devices/heartbeat' && req.method === 'POST') {
    if (!checkAuthorization(req)) {
      return sendJson(res, 401, {
        success: false,
        error: 'Unauthorized: Invalid or missing device token in Authorization header',
      });
    }

    try {
      const body = await parseJsonBody(req);
      const { deviceId, timestamp } = body;
      if (!deviceId || typeof deviceId !== 'string') {
        return sendJson(res, 400, {
          success: false,
          error: 'Missing required field: deviceId (string)',
        });
      }

      const dev = devices.get(deviceId.trim());
      if (!dev) {
        return sendJson(res, 403, {
          success: false,
          error: `Device "${deviceId}" is not registered. Call POST /api/devices/register first.`,
        });
      }

      const ts = timestamp ? new Date(timestamp) : new Date();
      const validTs = isNaN(ts.getTime()) ? new Date() : ts;
      dev.online = true;
      dev.lastSeen = validTs.toISOString();
      dev.lastSeenMs = validTs.getTime();

      broadcast({
        type: 'HEARTBEAT',
        deviceId: dev.deviceId,
        online: true,
        lastSeen: dev.lastSeen,
      });

      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // POST /api/devices/events
  if (pathname === '/api/devices/events' && req.method === 'POST') {
    if (!checkAuthorization(req)) {
      return sendJson(res, 401, {
        success: false,
        error: 'Unauthorized: Invalid or missing device token in Authorization header',
      });
    }

    try {
      const body = await parseJsonBody(req);
      const { deviceId, event, compartment, timestamp } = body;

      if (!deviceId || typeof deviceId !== 'string') {
        return sendJson(res, 400, {
          success: false,
          error: 'Missing required field: deviceId (string)',
        });
      }

      const dev = devices.get(deviceId.trim());
      if (!dev) {
        return sendJson(res, 403, {
          success: false,
          error: `Device "${deviceId}" is not registered. Call POST /api/devices/register first.`,
        });
      }

      if (!event || !VALID_EVENTS.includes(event)) {
        return sendJson(res, 400, {
          success: false,
          error: `Invalid event "${event}". Must be one of: ${VALID_EVENTS.join(', ')}`,
        });
      }

      if (event === 'DEVICE_OFFLINE') {
        dev.online = false;
        dev.lastSeen = new Date().toISOString();
      } else {
        dev.online = true;
        dev.lastSeen = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
      }

      // Medication matching
      let matchedMed = null;
      if (['MEDICINE_BOX_OPENED', 'MEDICINE_COMPARTMENT_OPENED', 'MEDICINE_TAKEN'].includes(event)) {
        const comp = compartment !== undefined ? Number(compartment) : undefined;
        matchedMed = medications.find(m => comp !== undefined ? m.compartment === comp : m.status !== 'taken');
        if (matchedMed) {
          matchedMed.status = 'taken';
          matchedMed.takenAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }

      const eventRecord = {
        id: `evt-${Date.now()}`,
        deviceId: dev.deviceId,
        event,
        compartment,
        timestamp: timestamp || new Date().toISOString(),
        matchedMedicationId: matchedMed?.id,
      };
      events.unshift(eventRecord);

      broadcast({
        type: 'IOT_EVENT',
        event: eventRecord,
        device: dev,
        matchedMedication: matchedMed,
      });

      return sendJson(res, 200, {
        success: true,
        event,
        deviceId: dev.deviceId,
        matchedMedication: matchedMed ? {
          id: matchedMed.id,
          name: matchedMed.name,
          status: matchedMed.status,
          takenAt: matchedMed.takenAt,
        } : null,
      });

    } catch (err) {
      return sendJson(res, 400, { success: false, error: err.message });
    }
  }

  // Call API (Exotel) — shared module
  if (pathname.startsWith('/api/calls')) {
    try {
      const handled = await handleCallApiRequest(req, res);
      if (handled) return;
    } catch (err) {
      return sendJson(res, 500, {
        success: false,
        error: err && err.message ? err.message : 'Call service error',
      });
    }
  }

  // 404 — include the valid route list so misconfigured clients
  // (e.g. ESP32 with a wrong SERVER_URL path) are self-diagnosing.
  return sendJson(res, 404, {
    success: false,
    error: `Endpoint ${pathname} not found`,
    availableEndpoints: [
      'GET  /api/health',
      'GET  /api/devices',
      'GET  /api/devices/events/stream',
      'POST /api/devices/register',
      'POST /api/devices/heartbeat',
      'POST /api/devices/events',
      'GET/POST /api/devices/config',
      'GET  /api/calls/config | /api/calls/stream | /api/calls/history',
      'POST /api/calls | /api/calls/webhook | /api/calls/:id/end',
    ],
  });
});

server.listen(PORT, () => {
  console.log(`ElderSafe Standalone IoT Server running at http://localhost:${PORT}`);
  console.log(`Device token configured: ${maskSecret(DEVICE_TOKEN)}`);
});
