// ─── ElderSafe device state sync (frontend ← GET /api/devices/state) ────────
//
// Pulls REAL device status, medication state and recent ESP32 events from the
// configured backend (VITE_API_BASE_URL, e.g. the Railway deployment) and maps
// them onto the existing dashboard state shapes. Pure functions — no UI.
//
// No endpoints are invented: this only consumes routes the backend already
// serves (see server/standalone.cjs).

import { apiJson } from '../config/api';
import type { Medication, Sensor, TimelineEvent } from '../context/DemoContext';

// ─── Backend payload shapes (subset the dashboard actually needs) ───────────

export interface BackendDevice {
  deviceId: string;
  deviceType?: string;
  name?: string;
  elderId?: string;
  online: boolean;
  lastSeen?: string;
  lastSeenMs?: number;
  firmwareVersion?: string;
  createdAt?: string;
}

export interface BackendMedication {
  id: string;
  name?: string;
  compartment?: number;
  scheduledTime?: string;
  scheduledHour?: number;
  scheduledMinute?: number;
  status?: string;
  takenAt?: string;
  accessedAt?: string;
  updatedAt?: string;
}

export interface BackendEvent {
  id: string;
  deviceId?: string;
  event: string;
  compartment?: number;
  timestamp?: string;
  receivedAt?: string;
  matchedMedicationId?: string;
}

export interface DeviceStateResponse {
  success?: boolean;
  devices?: BackendDevice[];
  medications?: BackendMedication[];
  recentEvents?: BackendEvent[];
  config?: Record<string, unknown>;
}

/** GET /api/devices/state from the configured backend. */
export function fetchDeviceState(): Promise<DeviceStateResponse> {
  return apiJson<DeviceStateResponse>('/api/devices/state');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function relativeLastUpdate(ms?: number): string {
  if (!ms || Number.isNaN(ms)) return 'Just now';
  const diff = Math.max(0, Date.now() - ms);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function timeString(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  const valid = isNaN(date.getTime()) ? new Date() : date;
  return valid.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function findDeviceForSensor(sensor: Sensor, devices: BackendDevice[]): BackendDevice | undefined {
  return (
    devices.find(d => d.deviceId === sensor.id) ||
    devices.find(
      d =>
        (sensor.name.includes('Medicine') || sensor.name.includes('Box')) &&
        (d.deviceType === 'medicine_box' || (d.name || '').includes('Medicine'))
    )
  );
}

function findBackendMedication(med: Medication, meds: BackendMedication[]): BackendMedication | undefined {
  return (
    meds.find(b => b.id === med.id) ||
    meds.find(b => b.compartment !== undefined && med.id === `m${b.compartment}`)
  );
}

// ─── Device status: backend devices → dashboard sensors ─────────────────────

export function syncSensorsWithDevices(prev: Sensor[], devices?: BackendDevice[]): Sensor[] {
  if (!Array.isArray(devices) || devices.length === 0) return prev;

  let changed = false;
  const next = prev.map(sensor => {
    const device = findDeviceForSensor(sensor, devices);
    if (!device) return sensor;

    const status: Sensor['status'] = device.online ? 'Online' : 'Offline';
    const lastSeenMs = device.lastSeenMs ?? (device.lastSeen ? Date.parse(device.lastSeen) : undefined);
    const lastUpdate = relativeLastUpdate(lastSeenMs);

    if (sensor.status === status && sensor.lastUpdate === lastUpdate) return sensor;
    changed = true;
    return { ...sensor, status, lastUpdate };
  });

  return changed ? next : prev;
}

// ─── Medicine events: backend medications → dashboard medication cards ──────
// Only upgrades local state (Pending/Accessed → Taken, Pending → Missed);
// never downgrades a dose the caregiver already confirmed manually.

export function syncMedicationsWithBackend(
  prev: Medication[],
  backendMeds?: BackendMedication[]
): Medication[] {
  if (!Array.isArray(backendMeds) || backendMeds.length === 0) return prev;

  let changed = false;
  const next = prev.map(med => {
    const backend = findBackendMedication(med, backendMeds);
    if (!backend) return med;

    const patch: Partial<Medication> = {};

    if (backend.status === 'taken' && med.status !== 'Taken') {
      patch.status = 'Taken';
      patch.takenTime = backend.takenAt || timeString(backend.updatedAt);
      patch.accessed = false;
    } else if (backend.status === 'missed' && med.status === 'Pending') {
      patch.status = 'Missed';
    }

    if (backend.accessedAt && med.status !== 'Taken' && !med.accessed) {
      patch.accessed = true;
      patch.accessedAt = backend.accessedAt;
    }

    if (Object.keys(patch).length === 0) return med;
    changed = true;
    return { ...med, ...patch } as Medication;
  });

  return changed ? next : prev;
}

// ─── Activity timeline: recent backend events → timeline entries ────────────
// Returns only NEW entries (deduped by backend event id) — [] when none.

export function buildTimelineEntries(
  prev: TimelineEvent[],
  events?: BackendEvent[],
  backendMeds?: BackendMedication[]
): TimelineEvent[] {
  if (!Array.isArray(events) || events.length === 0) return [];

  const known = new Set(prev.map(e => e.id));
  const meds = Array.isArray(backendMeds) ? backendMeds : [];
  const entries: TimelineEvent[] = [];

  for (const evt of events) {
    const id = `te-be-${evt.id}-${evt.event}`;
    if (known.has(id)) continue;

    const time = timeString(evt.timestamp || evt.receivedAt);
    const backendMed = meds.find(m => m.id === evt.matchedMedicationId) ||
      (evt.compartment !== undefined ? meds.find(m => m.compartment === evt.compartment) : undefined);
    const medName = backendMed?.name || 'Medication';

    switch (evt.event) {
      case 'MEDICINE_BOX_OPENED':
        entries.push({
          id,
          time,
          activity: `Medicine box opened: ${medName} access detected`,
          location: 'Kitchen',
          type: 'medication',
          severity: 'safe',
        });
        break;
      case 'MEDICINE_TAKEN':
      case 'MEDICINE_COMPARTMENT_OPENED':
        entries.push({
          id,
          time,
          activity: `Medicine box: ${medName} confirmed taken`,
          location: 'Kitchen',
          type: 'medication',
          severity: 'safe',
        });
        break;
      case 'DEVICE_OFFLINE':
        entries.push({
          id,
          time,
          activity: `Device ${evt.deviceId || 'medicine box'} reported offline`,
          location: 'Living Room',
          type: 'sensor',
          severity: 'warning',
        });
        break;
      case 'DEVICE_ONLINE':
        entries.push({
          id,
          time,
          activity: `Device ${evt.deviceId || 'medicine box'} is online`,
          location: 'Living Room',
          type: 'sensor',
          severity: 'safe',
        });
        break;
      default:
        // HEARTBEAT and unknown events — too noisy for the activity timeline
        break;
    }
  }

  return entries;
}
