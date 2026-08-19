import { db, firebaseAvailable } from './firebase';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Persistence Abstraction ───────────────────────────────────────────────
//
// If Firebase is configured and available, data is stored in Firestore.
// Otherwise, data falls back to localStorage so Demo Mode works offline.
//
// Firestore paths:  users/{DEMO_USER_ID}/{collection}/{docId}
// localStorage keys: eldersafe_{key}

const LS_PREFIX = 'eldersafe_';
const DEMO_USER_ID = 'demo-user';

// ─── Helpers ───────────────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — silently continue
  }
}

function collectionPath(collection: string): string {
  return `users/${DEMO_USER_ID}/${collection}`;
}

function docPath(collection: string, id: string): string {
  return `users/${DEMO_USER_ID}/${collection}/${id}`;
}

// ─── Generic Firestore helpers ─────────────────────────────────────────────

interface Persistable {
  id: string;
}

async function saveCollection<T extends Persistable>(
  col: string,
  items: T[],
): Promise<void> {
  if (!firebaseAvailable || !db) return;
  const batch = writeBatch(db);
  for (const item of items) {
    const ref = doc(db, collectionPath(col), item.id);
    batch.set(ref, { ...item, _updatedAt: serverTimestamp() });
  }
  await batch.commit();
}

async function loadCollection<T>(
  col: string,
): Promise<T[] | null> {
  if (!firebaseAvailable || !db) return null;
  try {
    const snap = await getDocs(collection(db, collectionPath(col)));
    if (snap.empty) return null;
    return snap.docs.map(d => d.data() as T);
  } catch {
    return null;
  }
}

// ─── Profile ───────────────────────────────────────────────────────────────

export interface SavedProfile {
  name: string;
  age: number;
  emergencyContacts: Array<{
    id: string;
    name: string;
    relation: string;
    phone: string;
    isPrimary: boolean;
  }>;
  wakeUpTime: string;
  bedTime: string;
  medsWindow: string;
}

export async function saveProfile(profile: SavedProfile): Promise<void> {
  if (firebaseAvailable && db) {
    try {
      await setDoc(doc(db, docPath('elderly_profiles', 'current')), {
        ...profile,
        _updatedAt: serverTimestamp(),
      });
    } catch { /* continue */ }
  }
  lsSet('profile', profile);
}

export async function loadProfile(fallback: SavedProfile): Promise<SavedProfile> {
  if (firebaseAvailable && db) {
    try {
      const snap = await getDoc(doc(db, docPath('elderly_profiles', 'current')));
      if (snap.exists()) return snap.data() as SavedProfile;
    } catch { /* continue */ }
  }
  return lsGet('profile', fallback);
}

// ─── Alerts ────────────────────────────────────────────────────────────────

export async function saveAlerts(alerts: Persistable[]): Promise<void> {
  if (firebaseAvailable && db) {
    try {
      await saveCollection('alerts', alerts);
    } catch { /* continue */ }
  }
  lsSet('alerts', alerts);
}

export async function loadAlerts<T extends Persistable>(fallback: T[]): Promise<T[]> {
  const result = await loadCollection<T>('alerts');
  if (result && result.length > 0) return result;
  return lsGet('alerts', fallback);
}

// ─── Timeline ──────────────────────────────────────────────────────────────

export async function saveTimeline(events: Persistable[]): Promise<void> {
  if (firebaseAvailable && db) {
    try {
      await saveCollection('activity_events', events);
    } catch { /* continue */ }
  }
  lsSet('timeline', events);
}

export async function loadTimeline<T extends Persistable>(fallback: T[]): Promise<T[]> {
  const result = await loadCollection<T>('activity_events');
  if (result && result.length > 0) return result;
  return lsGet('timeline', fallback);
}

// ─── Medications ───────────────────────────────────────────────────────────

export async function saveMedications(meds: Persistable[]): Promise<void> {
  if (firebaseAvailable && db) {
    try {
      await saveCollection('medications', meds);
    } catch { /* continue */ }
  }
  lsSet('medications', meds);
}

export async function loadMedications<T extends Persistable>(fallback: T[]): Promise<T[]> {
  const result = await loadCollection<T>('medications');
  if (result && result.length > 0) return result;
  return lsGet('medications', fallback);
}

// ─── Devices ───────────────────────────────────────────────────────────────

export async function saveDevices(devices: Persistable[]): Promise<void> {
  if (firebaseAvailable && db) {
    try {
      await saveCollection('devices', devices);
    } catch { /* continue */ }
  }
  lsSet('devices', devices);
}

export async function loadDevices<T extends Persistable>(fallback: T[]): Promise<T[]> {
  const result = await loadCollection<T>('devices');
  if (result && result.length > 0) return result;
  return lsGet('devices', fallback);
}

// ─── Settings ──────────────────────────────────────────────────────────────

export async function saveSettings(settings: unknown): Promise<void> {
  if (firebaseAvailable && db) {
    try {
      await setDoc(doc(db, docPath('settings', 'preferences')), {
        ...(settings as object),
        _updatedAt: serverTimestamp(),
      });
    } catch { /* continue */ }
  }
  lsSet('settings', settings);
}

export async function loadSettings<T>(fallback: T): Promise<T> {
  if (firebaseAvailable && db) {
    try {
      const snap = await getDoc(doc(db, docPath('settings', 'preferences')));
      if (snap.exists()) return snap.data() as T;
    } catch { /* continue */ }
  }
  return lsGet('settings', fallback);
}
