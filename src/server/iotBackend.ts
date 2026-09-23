// ─── ElderSafe IoT Backend Integration Layer ────────────────────────────────
//
// Clean REST API backend for ESP32-based hardware (specifically Medicine Box).
//
// Architecture:
//   ESP32 (Wi-Fi) → HTTP REST (/api/devices/*) → IoT Backend Layer
//                 → Device & Event Processing → Medication State Manager
//                 → Server-Sent Events (SSE) → React Dashboard
//
// ─────────────────────────────────────────────────────────────────────────────

import type { IncomingMessage, ServerResponse } from 'http';

// ─── Data Models ─────────────────────────────────────────────────────────────

export interface DeviceRecord {
  deviceId: string;
  deviceType: string;
  name: string;
  elderId: string;
  online: boolean;
  lastSeen: string; // ISO string
  lastSeenMs: number;
  firmwareVersion: string;
  createdAt: string;
}

export type MedicationStatus = 'scheduled' | 'due' | 'reminded' | 'taken' | 'missed';

export interface BackendMedication {
  id: string;
  name: string;
  compartment: number;
  scheduledTime: string; // e.g., "09:00 AM" or "10:00 AM"
  scheduledHour: number; // 0-23
  scheduledMinute: number; // 0-59
  status: MedicationStatus;
  takenAt?: string;
  updatedAt: string;
}

export type IotEventType = 
  | 'DEVICE_ONLINE'
  | 'DEVICE_OFFLINE'
  | 'HEARTBEAT'
  | 'MEDICINE_BOX_OPENED'
  | 'MEDICINE_COMPARTMENT_OPENED'
  | 'MEDICINE_TAKEN';

export const VALID_EVENTS: IotEventType[] = [
  'DEVICE_ONLINE',
  'DEVICE_OFFLINE',
  'HEARTBEAT',
  'MEDICINE_BOX_OPENED',
  'MEDICINE_COMPARTMENT_OPENED',
  'MEDICINE_TAKEN',
];

export interface StoredIotEvent {
  id: string;
  deviceId: string;
  event: IotEventType;
  compartment?: number;
  timestamp: string;
  receivedAt: string;
  matchedMedicationId?: string;
}

export interface IotConfig {
  gracePeriodMinutes: number; // configurable grace period (default 60 mins)
  reminderWindowMinutes: number; // configurable reminder window before schedule (default 15 mins)
  missedWindowMinutes: number; // configurable escalation window before marked missed (default 90 mins)
  deviceToken: string;
}

// ─── In-Memory Store (Prototype Persistence) ─────────────────────────────────

class IotBackendStore {
  private devices = new Map<string, DeviceRecord>();
  private events: StoredIotEvent[] = [];
  private sseClients = new Set<ServerResponse>();

  public config: IotConfig = {
    gracePeriodMinutes: 60,
    reminderWindowMinutes: 15,
    missedWindowMinutes: 90,
    deviceToken: process.env.DEVICE_API_KEY || 'eldersafe_esp32_secret_token',
  };

  // Seed default medications aligned with ElderSafe demo state
  public medications: BackendMedication[] = [
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

  constructor() {
    // Pre-seed default medicine box device
    const now = new Date();
    this.devices.set('MEDBOX-001', {
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
  }

  // ─── Device Management ───────────────────────────────────────────────────

  registerDevice(data: {
    deviceId: string;
    deviceType: string;
    name: string;
    elderId: string;
    firmwareVersion?: string;
  }): DeviceRecord {
    const now = new Date();
    const existing = this.devices.get(data.deviceId);
    const device: DeviceRecord = {
      deviceId: data.deviceId,
      deviceType: data.deviceType || 'medicine_box',
      name: data.name || 'Medicine Box',
      elderId: data.elderId || 'elder-001',
      online: true,
      lastSeen: now.toISOString(),
      lastSeenMs: now.getTime(),
      firmwareVersion: data.firmwareVersion || existing?.firmwareVersion || 'v1.0.0-esp32',
      createdAt: existing?.createdAt || now.toISOString(),
    };
    this.devices.set(data.deviceId, device);
    this.broadcast({ type: 'DEVICE_REGISTERED', device });
    return device;
  }

  getDevice(deviceId: string): DeviceRecord | undefined {
    return this.devices.get(deviceId);
  }

  getAllDevices(): DeviceRecord[] {
    return Array.from(this.devices.values());
  }

  updateHeartbeat(deviceId: string, timestamp?: string): DeviceRecord | null {
    const device = this.devices.get(deviceId);
    if (!device) return null;

    const ts = timestamp ? new Date(timestamp) : new Date();
    const validTs = isNaN(ts.getTime()) ? new Date() : ts;

    device.online = true;
    device.lastSeen = validTs.toISOString();
    device.lastSeenMs = validTs.getTime();

    this.broadcast({
      type: 'HEARTBEAT',
      deviceId,
      online: true,
      lastSeen: device.lastSeen,
      lastSeenMs: device.lastSeenMs,
    });
    return device;
  }

  setDeviceOnline(deviceId: string, online: boolean): DeviceRecord | null {
    const device = this.devices.get(deviceId);
    if (!device) return null;
    device.online = online;
    device.lastSeen = new Date().toISOString();
    device.lastSeenMs = Date.now();
    this.broadcast({
      type: online ? 'DEVICE_ONLINE' : 'DEVICE_OFFLINE',
      deviceId,
      online,
      lastSeen: device.lastSeen,
    });
    return device;
  }

  // ─── Medication Matching & State ─────────────────────────────────────────

  /**
   * Evaluates current status for all medications based on time and grace window.
   */
  recomputeMedicationStatuses(currentTime = new Date()): void {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    for (const med of this.medications) {
      if (med.status === 'taken') continue; // already taken

      const scheduledMinutes = med.scheduledHour * 60 + med.scheduledMinute;
      const diffMinutes = currentMinutes - scheduledMinutes;

      if (diffMinutes < -this.config.reminderWindowMinutes) {
        med.status = 'scheduled';
      } else if (diffMinutes < 0) {
        med.status = 'reminded';
      } else if (diffMinutes <= this.config.gracePeriodMinutes) {
        med.status = 'due';
      } else if (diffMinutes > this.config.missedWindowMinutes) {
        med.status = 'missed';
      }
    }
  }

  /**
   * Matches an incoming hardware event to a scheduled medication.
   */
  processMedicationEvent(
    event: IotEventType,
    compartment?: number,
    eventTimestamp?: string
  ): BackendMedication | null {
    if (!['MEDICINE_BOX_OPENED', 'MEDICINE_COMPARTMENT_OPENED', 'MEDICINE_TAKEN'].includes(event)) {
      return null;
    }

    const eventDate = eventTimestamp ? new Date(eventTimestamp) : new Date();
    const validDate = isNaN(eventDate.getTime()) ? new Date() : eventDate;
    const eventMinutes = validDate.getHours() * 60 + validDate.getMinutes();

    // 1. Try matching by compartment first
    let candidate: BackendMedication | undefined;
    if (compartment !== undefined) {
      candidate = this.medications.find(m => m.compartment === compartment);
    }

    // 2. If no compartment or not found, match by closest scheduled window
    if (!candidate) {
      candidate = this.medications.find(m => {
        if (m.status === 'taken') return false;
        const scheduledMinutes = m.scheduledHour * 60 + m.scheduledMinute;
        const diff = Math.abs(eventMinutes - scheduledMinutes);
        return diff <= this.config.gracePeriodMinutes;
      });
    }

    // 3. If candidate found, transition status to taken
    if (candidate) {
      candidate.status = 'taken';
      candidate.takenAt = validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      candidate.updatedAt = validDate.toISOString();

      this.broadcast({
        type: 'MEDICATION_TAKEN',
        medication: candidate,
        compartment,
        event,
      });

      return candidate;
    }

    return null;
  }

  // ─── Event Store ─────────────────────────────────────────────────────────

  storeEvent(
    deviceId: string,
    event: IotEventType,
    compartment?: number,
    timestamp?: string,
    matchedMedId?: string
  ): StoredIotEvent {
    const record: StoredIotEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      deviceId,
      event,
      compartment,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      matchedMedicationId: matchedMedId,
    };
    this.events.unshift(record);
    if (this.events.length > 200) {
      this.events.pop(); // keep last 200 events
    }
    return record;
  }

  getRecentEvents(limit = 50): StoredIotEvent[] {
    return this.events.slice(0, limit);
  }

  // ─── Real-Time SSE (Server-Sent Events) ───────────────────────────────────

  addSseClient(res: ServerResponse): () => void {
    this.sseClients.add(res);
    return () => {
      this.sseClients.delete(res);
    };
  }

  broadcast(payload: unknown): void {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(data);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }
}

// Global singleton store instance for backend
export const iotStore = new IotBackendStore();

// ─── HTTP Utilities ──────────────────────────────────────────────────────────

function parseJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function checkAuthorization(req: IncomingMessage): boolean {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    // If no token header is provided, reject
    return false;
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return false;
  }
  const token = parts[1];
  return token === iotStore.config.deviceToken;
}

// ─── Main Request Dispatcher ─────────────────────────────────────────────────

export async function handleIotApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  const parsedUrl = new URL(url, 'http://localhost');
  const pathname = parsedUrl.pathname;

  // Only handle /api/devices routes
  if (!pathname.startsWith('/api/devices')) {
    return false;
  }

  // Handle CORS preflight
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
    // ─────────────────────────────────────────────────────────────────────────
    // 1. GET /api/devices/events/stream (Server-Sent Events for React frontend)
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/api/devices/events/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(': connected\n\n');

      const removeClient = iotStore.addSseClient(res);
      req.on('close', removeClient);
      return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. GET /api/devices (List all devices and current states)
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/api/devices' && req.method === 'GET') {
      sendJson(res, 200, {
        success: true,
        devices: iotStore.getAllDevices(),
        medications: iotStore.medications,
        config: {
          gracePeriodMinutes: iotStore.config.gracePeriodMinutes,
          reminderWindowMinutes: iotStore.config.reminderWindowMinutes,
          missedWindowMinutes: iotStore.config.missedWindowMinutes,
        },
      });
      return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. GET /api/devices/state (Full state snapshot for dashboard)
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/api/devices/state' && req.method === 'GET') {
      iotStore.recomputeMedicationStatuses();
      sendJson(res, 200, {
        success: true,
        devices: iotStore.getAllDevices(),
        medications: iotStore.medications,
        recentEvents: iotStore.getRecentEvents(20),
        config: iotStore.config,
      });
      return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. POST /api/devices/register
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/api/devices/register' && req.method === 'POST') {
      // Validate device token
      if (!checkAuthorization(req)) {
        sendJson(res, 401, {
          success: false,
          error: 'Unauthorized: Invalid or missing device token in Authorization header',
        });
        return true;
      }

      const body = await parseJsonBody(req);
      const { deviceId, deviceType, name, elderId, firmwareVersion } = body as Record<string, string>;

      if (!deviceId || typeof deviceId !== 'string') {
        sendJson(res, 400, {
          success: false,
          error: 'Missing required field: deviceId (string)',
        });
        return true;
      }

      const registered = iotStore.registerDevice({
        deviceId: deviceId.trim(),
        deviceType: deviceType || 'medicine_box',
        name: name || 'Mohan Medicine Box',
        elderId: elderId || 'elder-001',
        firmwareVersion: firmwareVersion || 'v1.0.0-esp32',
      });

      // Record device online event
      iotStore.storeEvent(registered.deviceId, 'DEVICE_ONLINE');

      sendJson(res, 200, {
        success: true,
        deviceId: registered.deviceId,
      });
      return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. POST /api/devices/heartbeat
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/api/devices/heartbeat' && req.method === 'POST') {
      // Validate device token
      if (!checkAuthorization(req)) {
        sendJson(res, 401, {
          success: false,
          error: 'Unauthorized: Invalid or missing device token in Authorization header',
        });
        return true;
      }

      const body = await parseJsonBody(req);
      const { deviceId, timestamp } = body as Record<string, string>;

      if (!deviceId || typeof deviceId !== 'string') {
        sendJson(res, 400, {
          success: false,
          error: 'Missing required field: deviceId (string)',
        });
        return true;
      }

      const device = iotStore.getDevice(deviceId.trim());
      if (!device) {
        sendJson(res, 403, {
          success: false,
          error: `Device "${deviceId}" is not registered. Call POST /api/devices/register first.`,
        });
        return true;
      }

      iotStore.updateHeartbeat(device.deviceId, timestamp);
      iotStore.storeEvent(device.deviceId, 'HEARTBEAT', undefined, timestamp);

      sendJson(res, 200, {
        success: true,
      });
      return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. POST /api/devices/events
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/api/devices/events' && req.method === 'POST') {
      // Validate device token
      if (!checkAuthorization(req)) {
        sendJson(res, 401, {
          success: false,
          error: 'Unauthorized: Invalid or missing device token in Authorization header',
        });
        return true;
      }

      const body = await parseJsonBody(req);
      const { deviceId, event, compartment, timestamp } = body as {
        deviceId?: string;
        event?: string;
        compartment?: number;
        timestamp?: string;
      };

      // 1. Validate deviceId
      if (!deviceId || typeof deviceId !== 'string') {
        sendJson(res, 400, {
          success: false,
          error: 'Missing required field: deviceId (string)',
        });
        return true;
      }

      const device = iotStore.getDevice(deviceId.trim());
      if (!device) {
        sendJson(res, 403, {
          success: false,
          error: `Device "${deviceId}" is not registered. Call POST /api/devices/register first.`,
        });
        return true;
      }

      // 2. Validate event type
      if (!event || !VALID_EVENTS.includes(event as IotEventType)) {
        sendJson(res, 400, {
          success: false,
          error: `Invalid event "${event}". Must be one of: ${VALID_EVENTS.join(', ')}`,
        });
        return true;
      }

      const validEvent = event as IotEventType;
      const compNumber = compartment !== undefined ? Number(compartment) : undefined;

      // 3. Update device status
      if (validEvent === 'DEVICE_OFFLINE') {
        iotStore.setDeviceOnline(device.deviceId, false);
      } else {
        iotStore.updateHeartbeat(device.deviceId, timestamp);
      }

      // 4. Process medication matching if applicable
      const matchedMed = iotStore.processMedicationEvent(validEvent, compNumber, timestamp);

      // 5. Store the event
      const storedEvent = iotStore.storeEvent(
        device.deviceId,
        validEvent,
        compNumber,
        timestamp,
        matchedMed?.id
      );

      // 6. Broadcast event to connected frontend clients
      iotStore.broadcast({
        type: 'IOT_EVENT',
        event: storedEvent,
        device: iotStore.getDevice(device.deviceId),
        matchedMedication: matchedMed,
      });

      sendJson(res, 200, {
        success: true,
        event: validEvent,
        deviceId: device.deviceId,
        matchedMedication: matchedMed ? {
          id: matchedMed.id,
          name: matchedMed.name,
          status: matchedMed.status,
          takenAt: matchedMed.takenAt,
        } : null,
      });
      return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. GET / POST /api/devices/config (Configurable grace period)
    // ─────────────────────────────────────────────────────────────────────────
    if (pathname === '/api/devices/config') {
      if (req.method === 'GET') {
        sendJson(res, 200, {
          success: true,
          config: {
            gracePeriodMinutes: iotStore.config.gracePeriodMinutes,
            reminderWindowMinutes: iotStore.config.reminderWindowMinutes,
            missedWindowMinutes: iotStore.config.missedWindowMinutes,
          },
        });
        return true;
      }

      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        if (typeof body.gracePeriodMinutes === 'number') {
          iotStore.config.gracePeriodMinutes = body.gracePeriodMinutes;
        }
        if (typeof body.reminderWindowMinutes === 'number') {
          iotStore.config.reminderWindowMinutes = body.reminderWindowMinutes;
        }
        if (typeof body.missedWindowMinutes === 'number') {
          iotStore.config.missedWindowMinutes = body.missedWindowMinutes;
        }
        sendJson(res, 200, {
          success: true,
          config: iotStore.config,
        });
        return true;
      }
    }

    // Default 404 for unknown /api/devices route
    sendJson(res, 404, {
      success: false,
      error: `Endpoint ${pathname} not found on ElderSafe IoT API`,
    });
    return true;

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    sendJson(res, 500, {
      success: false,
      error: msg,
    });
    return true;
  }
}
