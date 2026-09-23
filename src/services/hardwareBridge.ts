// ─── Hardware Bridge Service ─────────────────────────────────────────────────
//
// This service bridges raw ESP32 sensor data to the existing SensorEvent format.
// It normalizes incoming hardware data so the risk engine processes it identically
// to simulated Demo Mode events. No ML, no SMS, no calling — just data normalization.
//
// Architecture: ESP32 → Wi-Fi → This Bridge → SensorEvent[] → Risk Engine
//
// ──────────────────────────────────────────────────────────────────────────────

import type {
  SensorEvent,
  AccelerometerData,
  GyroscopeData,
  MotionEvent,
  DoorEvent,
  MedicineBoxEvent,
  BatteryEvent,
  RoomZone,
} from '../types';

// ─── Raw ESP32 Data Types ───────────────────────────────────────────────────
// These match the JSON payloads the ESP32 firmware sends over Wi-Fi/WebSocket.

export interface RawAccelerometerPayload {
  sensor: 'accelerometer';
  device_id: string;
  x: number;
  y: number;
  z: number;
  magnitude: number;
  ts: number; // unix ms
}

export interface RawGyroscopePayload {
  sensor: 'gyroscope';
  device_id: string;
  pitch: number;
  roll: number;
  yaw: number;
  angular_velocity: number;
  ts: number;
}

export interface RawMotionPayload {
  sensor: 'motion';
  device_id: string;
  room: string;
  detected: boolean;
  duration: number;
  ts: number;
}

export interface RawDoorPayload {
  sensor: 'door';
  device_id: string;
  opened: boolean;
  duration: number;
  ts: number;
}

export interface RawMedicinePayload {
  sensor: 'medicine_box';
  device_id: string;
  opened: boolean;
  duration: number;
  ts: number;
  compartment?: number;
}

export interface RawBatteryPayload {
  sensor: 'battery';
  device_id: string;
  level: number;
  ts: number;
}

export interface RawHeartbeatPayload {
  sensor: 'heartbeat';
  device_id: string;
  ts: number;
}

export type RawHardwarePayload =
  | RawAccelerometerPayload
  | RawGyroscopePayload
  | RawMotionPayload
  | RawDoorPayload
  | RawMedicinePayload
  | RawBatteryPayload
  | RawHeartbeatPayload;

// ─── Device Registry Entry ──────────────────────────────────────────────────

export interface DeviceHeartbeat {
  deviceId: string;
  lastSeen: number; // unix ms
  online: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEVICE_OFFLINE_TIMEOUT_MS = 60_000; // 60 seconds without heartbeat = offline
const ROOM_ZONE_MAP: Record<string, RoomZone> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  living_room: 'Living Room',
  living: 'Living Room',
  entrance: 'Entrance',
  door: 'Entrance',
};

// ─── Normalization Functions ────────────────────────────────────────────────
// Convert raw ESP32 payloads into the SensorEvent union type.

function normalizeRoom(raw: string): RoomZone {
  const key = raw.toLowerCase().trim();
  return ROOM_ZONE_MAP[key] ?? 'Living Room';
}

export function normalizeAccelerometer(raw: RawAccelerometerPayload): SensorEvent {
  const data: AccelerometerData = {
    x: raw.x,
    y: raw.y,
    z: raw.z,
    magnitude: raw.magnitude,
    timestamp: raw.ts,
  };
  return { type: 'accelerometer', data };
}

export function normalizeGyroscope(raw: RawGyroscopePayload): SensorEvent {
  const data: GyroscopeData = {
    pitch: raw.pitch,
    roll: raw.roll,
    yaw: raw.yaw,
    angularVelocity: raw.angular_velocity,
    timestamp: raw.ts,
  };
  return { type: 'gyroscope', data };
}

export function normalizeMotion(raw: RawMotionPayload): SensorEvent {
  const data: MotionEvent = {
    room: normalizeRoom(raw.room),
    detected: raw.detected,
    duration: raw.duration,
    timestamp: raw.ts,
  };
  return { type: 'motion', data };
}

export function normalizeDoor(raw: RawDoorPayload): SensorEvent {
  const data: DoorEvent = {
    opened: raw.opened,
    duration: raw.duration,
    timestamp: raw.ts,
  };
  return { type: 'door', data };
}

export function normalizeMedicineBox(raw: RawMedicinePayload): SensorEvent {
  const data: MedicineBoxEvent = {
    opened: raw.opened,
    duration: raw.duration,
    timestamp: raw.ts,
    ...(raw.compartment !== undefined ? { compartment: raw.compartment } : {}),
  };
  return { type: 'medicine', data };
}

export function normalizeBattery(raw: RawBatteryPayload): SensorEvent {
  const data: BatteryEvent = {
    level: raw.level,
    timestamp: raw.ts,
  };
  return { type: 'battery', data };
}

export function normalizeHardwarePayload(raw: RawHardwarePayload): SensorEvent | null {
  switch (raw.sensor) {
    case 'accelerometer':
      return normalizeAccelerometer(raw);
    case 'gyroscope':
      return normalizeGyroscope(raw);
    case 'motion':
      return normalizeMotion(raw);
    case 'door':
      return normalizeDoor(raw);
    case 'medicine_box':
      return normalizeMedicineBox(raw);
    case 'battery':
      return normalizeBattery(raw);
    case 'heartbeat':
      return null; // heartbeat is metadata, not a sensor event
    default:
      return null;
  }
}

// ─── Hardware Event Bridge ──────────────────────────────────────────────────
//
// The bridge accepts raw payloads from ESP32 (via WebSocket, HTTP POST, or
// Firebase Realtime Database) and normalizes them into SensorEvent format.
// It also tracks device heartbeats for offline detection.
//
// Usage:
//   const bridge = new HardwareEventBridge();
//   bridge.onEvents((events) => { ... feed to risk engine ... });
//   bridge.processRawPayload(rawPayload); // called by transport layer

export type EventCallback = (events: SensorEvent[]) => void;
export type DeviceStatusCallback = (deviceId: string, online: boolean) => void;

export class HardwareEventBridge {
  private heartbeats: Map<string, DeviceHeartbeat> = new Map();
  private eventListeners: EventCallback[] = [];
  private statusListeners: DeviceStatusCallback[] = [];
  private offlineCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(offlineTimeoutMs: number = DEVICE_OFFLINE_TIMEOUT_MS) {
    this.offlineTimeoutMs = offlineTimeoutMs;
  }

  private offlineTimeoutMs: number;

  // ─── Public API ──────────────────────────────────────────────────────────

  /** Subscribe to normalized events. Returns unsubscribe function. */
  onEvents(callback: EventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  /** Subscribe to device online/offline status changes. */
  onDeviceStatus(callback: DeviceStatusCallback): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Process a single raw payload from ESP32.
   * Returns the normalized SensorEvent, or null for heartbeats/unknown types.
   * Also updates the device heartbeat registry.
   */
  processRawPayload(raw: RawHardwarePayload): SensorEvent | null {
    // Track heartbeat
    this.updateHeartbeat(raw.device_id);

    // Normalize to SensorEvent
    const event = normalizeHardwarePayload(raw);
    if (event) {
      this.emitEvents([event]);
    }
    return event;
  }

  /** Process a batch of raw payloads. */
  processRawPayloads(raws: RawHardwarePayload[]): SensorEvent[] {
    const events: SensorEvent[] = [];
    for (const raw of raws) {
      this.updateHeartbeat(raw.device_id);
      const event = normalizeHardwarePayload(raw);
      if (event) events.push(event);
    }
    if (events.length > 0) {
      this.emitEvents(events);
    }
    return events;
  }

  /** Manually register a device for heartbeat tracking. */
  registerDevice(deviceId: string): void {
    if (!this.heartbeats.has(deviceId)) {
      this.heartbeats.set(deviceId, {
        deviceId,
        lastSeen: Date.now(),
        online: true,
      });
    }
  }

  /** Get current status of a tracked device. */
  getDeviceStatus(deviceId: string): DeviceHeartbeat | undefined {
    return this.heartbeats.get(deviceId);
  }

  /** Get all tracked devices. */
  getAllDevices(): DeviceHeartbeat[] {
    return Array.from(this.heartbeats.values());
  }

  /** Start periodic offline detection. */
  startOfflineDetection(): void {
    if (this.offlineCheckInterval) return;
    this.offlineCheckInterval = setInterval(() => {
      this.checkForOfflineDevices();
    }, 10_000); // check every 10 seconds
  }

  /** Stop offline detection. */
  stopOfflineDetection(): void {
    if (this.offlineCheckInterval) {
      clearInterval(this.offlineCheckInterval);
      this.offlineCheckInterval = null;
    }
  }

  /** Clean up all listeners and intervals. */
  destroy(): void {
    this.stopOfflineDetection();
    this.eventListeners = [];
    this.statusListeners = [];
    this.heartbeats.clear();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private updateHeartbeat(deviceId: string): void {
    const existing = this.heartbeats.get(deviceId);
    if (existing) {
      const wasOnline = existing.online;
      existing.lastSeen = Date.now();
      existing.online = true;
      if (!wasOnline) {
        this.notifyDeviceStatus(deviceId, true);
      }
    } else {
      this.heartbeats.set(deviceId, {
        deviceId,
        lastSeen: Date.now(),
        online: true,
      });
      this.notifyDeviceStatus(deviceId, true);
    }
  }

  private checkForOfflineDevices(): void {
    const now = Date.now();
    for (const [deviceId, heartbeat] of this.heartbeats) {
      if (heartbeat.online && (now - heartbeat.lastSeen) > this.offlineTimeoutMs) {
        heartbeat.online = false;
        this.notifyDeviceStatus(deviceId, false);
      }
    }
  }

  private emitEvents(events: SensorEvent[]): void {
    for (const listener of this.eventListeners) {
      listener(events);
    }
  }

  private notifyDeviceStatus(deviceId: string, online: boolean): void {
    for (const listener of this.statusListeners) {
      listener(deviceId, online);
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────
// One bridge instance shared across the app.

let bridgeInstance: HardwareEventBridge | null = null;

export function getHardwareBridge(): HardwareEventBridge {
  if (!bridgeInstance) {
    bridgeInstance = new HardwareEventBridge();
  }
  return bridgeInstance;
}
