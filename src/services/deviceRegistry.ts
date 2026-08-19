// ─── Device Registry Service ────────────────────────────────────────────────
//
// Manages hardware device state: registration, online/offline tracking,
// heartbeat monitoring, and "DEVICE OFFLINE" alert generation.
// Works alongside the HardwareEventBridge — this handles the higher-level
// device lifecycle while the bridge handles raw data normalization.
//
// ──────────────────────────────────────────────────────────────────────────────

import type { Alert, TimelineEvent, Notification } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RegisteredDevice {
  id: string;
  name: string;
  location: string;
  type: 'wearable' | 'gateway' | 'pir' | 'door' | 'medicine_box' | 'custom';
  lastSeen: number;      // unix ms
  online: boolean;
  battery?: number;
  signalStrength?: string;
  registeredAt: number;  // unix ms
}

export interface DeviceOfflineAlert {
  alert: Alert;
  timeline: TimelineEvent;
  notification: Notification;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_OFFLINE_TIMEOUT_MS = 60_000; // 60s
const DEVICE_TYPE_LABELS: Record<RegisteredDevice['type'], string> = {
  wearable: 'Wearable Band',
  gateway: 'ESP32 Gateway',
  pir: 'PIR Motion Sensor',
  door: 'Door Sensor',
  medicine_box: 'Medicine Box Sensor',
  custom: 'Custom Sensor',
};

// ─── Device Registry ───────────────────────────────────────────────────────

export class DeviceRegistry {
  private devices: Map<string, RegisteredDevice> = new Map();
  private offlineTimeoutMs: number;
  private statusChangeCallbacks: Array<(deviceId: string, online: boolean) => void> = [];

  constructor(offlineTimeoutMs: number = DEFAULT_OFFLINE_TIMEOUT_MS) {
    this.offlineTimeoutMs = offlineTimeoutMs;
  }

  // ─── Registration ──────────────────────────────────────────────────────

  registerDevice(
    id: string,
    name: string,
    location: string,
    type: RegisteredDevice['type'],
    battery?: number,
  ): RegisteredDevice {
    const device: RegisteredDevice = {
      id,
      name,
      location,
      type,
      lastSeen: Date.now(),
      online: true,
      battery,
      registeredAt: Date.now(),
    };
    this.devices.set(id, device);
    return device;
  }

  unregisterDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  getDevice(id: string): RegisteredDevice | undefined {
    return this.devices.get(id);
  }

  getAllDevices(): RegisteredDevice[] {
    return Array.from(this.devices.values());
  }

  // ─── Heartbeat Updates ────────────────────────────────────────────────

  /**
   * Update a device's last-seen timestamp.
   * Called by the HardwareEventBridge when it receives any data from a device.
   */
  heartbeat(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    const wasOffline = !device.online;
    device.lastSeen = Date.now();
    device.online = true;

    if (wasOffline) {
      this.notifyStatusChange(deviceId, true);
    }
  }

  /**
   * Update battery level for a device.
   */
  updateBattery(deviceId: string, level: number): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.battery = Math.max(0, Math.min(100, level));
    }
  }

  // ─── Offline Detection ────────────────────────────────────────────────

  /**
   * Check all devices and mark any that haven't reported within the timeout.
   * Returns newly-offlined devices.
   */
  checkForOfflineDevices(): RegisteredDevice[] {
    const now = Date.now();
    const newlyOffline: RegisteredDevice[] = [];

    for (const device of this.devices.values()) {
      if (device.online && (now - device.lastSeen) > this.offlineTimeoutMs) {
        device.online = false;
        newlyOffline.push(device);
        this.notifyStatusChange(device.id, false);
      }
    }

    return newlyOffline;
  }

  /**
   * Generate an offline alert + timeline + notification for a device.
   */
  createOfflineAlert(device: RegisteredDevice): DeviceOfflineAlert {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const minutesAgo = Math.round((Date.now() - device.lastSeen) / 60_000);
    const lastSeenText = minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`;

    const deviceLabel = DEVICE_TYPE_LABELS[device.type] || device.name;

    const alert: Alert = {
      id: `hw-offline-${device.id}-${Date.now()}`,
      type: 'Device Offline',
      severity: 'warning',
      time: timeStr,
      location: device.location,
      description:
        `${device.name} (${deviceLabel}) has stopped reporting. ` +
        `Last seen: ${lastSeenText}. ` +
        `If this device is expected to be active, check power and connectivity. ` +
        `Monitoring for ${device.location} may be degraded.`,
      status: 'active',
    };

    const timeline: TimelineEvent = {
      id: `te-offline-${device.id}-${Date.now()}`,
      time: timeStr,
      activity: `${device.name} went offline — ${device.location} monitoring degraded`,
      location: device.location,
      type: 'sensor',
      severity: 'warning',
    };

    const notification: Notification = {
      id: `n-offline-${device.id}-${Date.now()}`,
      type: 'gateway',
      message: `${device.name} offline — Last seen ${lastSeenText}`,
      time: timeStr,
      read: false,
      alertId: alert.id,
    };

    return { alert, timeline, notification };
  }

  /**
   * Generate a "device reconnected" notification.
   */
  createReconnectNotification(device: RegisteredDevice): Notification {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      id: `n-reconnect-${device.id}-${Date.now()}`,
      type: 'gateway',
      message: `${device.name} has reconnected and is reporting normally.`,
      time: timeStr,
      read: false,
    };
  }

  // ─── Status Change Callbacks ──────────────────────────────────────────

  onStatusChange(callback: (deviceId: string, online: boolean) => void): () => void {
    this.statusChangeCallbacks.push(callback);
    return () => {
      this.statusChangeCallbacks = this.statusChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  // ─── Persistence Helpers ──────────────────────────────────────────────

  /** Export device list for persistence (serializable). */
  exportDevices(): RegisteredDevice[] {
    return this.getAllDevices();
  }

  /** Import devices from persistence. */
  importDevices(devices: RegisteredDevice[]): void {
    this.devices.clear();
    for (const d of devices) {
      this.devices.set(d.id, d);
    }
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private notifyStatusChange(deviceId: string, online: boolean): void {
    for (const cb of this.statusChangeCallbacks) {
      cb(deviceId, online);
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

let registryInstance: DeviceRegistry | null = null;

export function getDeviceRegistry(): DeviceRegistry {
  if (!registryInstance) {
    registryInstance = new DeviceRegistry();
  }
  return registryInstance;
}
