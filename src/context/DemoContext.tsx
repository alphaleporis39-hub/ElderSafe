import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { DetectionExplanation, RiskAssessment, AlertStatus, Notification, SensorEvent } from '../types';
import { generateSimulationEvents, getCurrentTimeStrAMPM } from '../services/simulationService';
import { assessRisk, calculateNewScore } from '../services/riskEngine';
import { processAssessments } from '../services/alertEngine';
import { playAlertBeep, stopAlertBeep, playOpenBeep, playConfirmBeep, playAlertPattern } from '../services/alertSound';
import {
  saveProfile,
  loadProfile,
  saveAlerts,
  loadAlerts,
  saveTimeline,
  loadTimeline,
  saveMedications,
  loadMedications,
  saveDevices,
  loadDevices,
  saveSettings,
  loadSettings,
  saveCallHistory,
  loadCallHistory,
} from '../services/persistence';
import {
  getCallConfig,
  initiateCall,
  endCall as endCallApi,
  subscribeToCallUpdates,
  normalizePhone as normalizeCallPhone,
  isTerminalStatus,
  type CallRecord,
} from '../services/callService';
import { getHardwareBridge } from '../services/hardwareBridge';
import { getDeviceRegistry } from '../services/deviceRegistry';
import { apiUrl } from '../config/api';
import {
  fetchDeviceState,
  syncSensorsWithDevices,
  syncMedicationsWithBackend,
  buildTimelineEntries,
} from '../services/deviceState';
import {
  type ActivityBaseline,
  type ActivityAnomalyResult,
  defaultBaseline,
  estimateBaseline,
  computeActivityAnomaly,
} from '../services/activityIntelligence';

// ─── Types (preserved from Phase 1) ─────────────────────────────────────────

export interface ElderProfile {
  name: string;
  age: number;
  emergencyContacts: EmergencyContact[];
  wakeUpTime: string;
  bedTime: string;
  medsWindow: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface Sensor {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'Active' | 'Inactive';
  lastUpdate: string;
  battery?: number;
  location: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  activity: string;
  location: string;
  type: 'movement' | 'medication' | 'sensor' | 'routine' | 'alert';
  severity: 'safe' | 'warning' | 'critical';
}

export interface Alert {
  id: string;
  type: string;
  severity: 'safe' | 'warning' | 'critical';
  time: string;
  location: string;
  description: string;
  status: AlertStatus;
  acknowledgedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
  // Explainable alert fields (Phase 6)
  whatHappened?: string;
  whenDetected?: string;
  whereLocated?: string;
  whyTriggered?: string;
  recommendedAction?: string;
}

export interface Medication {
  id: string;
  name: string;
  time: string;
  schedule: string;
  status: 'Taken' | 'Missed' | 'Pending';
  takenTime?: string;
  /** Set by a real MEDICINE_BOX_OPENED hardware event: box opened (access
   *  detected) but dose not yet confirmed. Cleared once taken. */
  accessed?: boolean;
  accessedAt?: string;
}

export interface NotificationSettings {
  sms: boolean;
  push: boolean;
  email: boolean;
  escalationMinutes: number;
  sensitivity: 'Low' | 'Medium' | 'High';
  privacyMode: boolean;
  alertSoundEnabled: boolean;
  /** When true, escalating an alert also places a real (or DEMO) call to contacts. Default OFF. */
  autoCallEscalation: boolean;
}

export type SafetyStatus = 'SAFE' | 'WARNING' | 'CRITICAL';
export type DataMode = 'demo' | 'hardware';

export interface DemoContextType {
  elderProfile: ElderProfile;
  safetyStatus: SafetyStatus;
  statusText: string;
  safetyScore: number;
  indicators: {
    movement: string;
    routine: string;
    medication: string;
    fallRisk: string;
    devices: string;
  };
  sensors: Sensor[];
  timeline: TimelineEvent[];
  alerts: Alert[];
  medications: Medication[];
  settings: NotificationSettings;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  // Alert sound
  alertSoundEnabled: boolean;
  setAlertSoundEnabled: (enabled: boolean) => void;
  // Medicine sounds
  playMedicineOpenSound: () => void;
  playMedicineConfirmSound: () => void;
  playMedicineAlertSound: () => void;
  // Data mode
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  // Activity Intelligence (Phase 6)
  activityBaseline: ActivityBaseline;
  anomalyResult: ActivityAnomalyResult;
  // Simulation triggers
  simulateNormalActivity: () => void;
  simulateMissedMedication: () => void;
  simulateProlongedInactivity: () => void;
  simulateRoutineDeviation: () => void;
  simulateFall: () => void;
  simulateMultipleAnomalies: () => void;
  resetSimulation: () => void;
  // Hardware ingestion
  processHardwareEvents: (events: SensorEvent[]) => void;
  // Engine outputs (for explainable UI)
  lastExplanation: DetectionExplanation | null;
  lastAssessments: RiskAssessment[];
  // Emergency response
  activeAlertId: string | null;
  alertCountdown: number | null;
  acknowledgeAlert: (id: string) => void;
  escalateAlert: (id: string) => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  // State mutations
  resolveAlert: (id: string) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'status'>) => void;
  addMedication: (med: Omit<Medication, 'id' | 'status'>) => void;
  editMedication: (id: string, updatedMed: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  toggleMedicationStatus: (id: string) => void;
  updateProfile: (profile: Partial<ElderProfile>) => void;
  updateContacts: (contacts: EmergencyContact[]) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  addDevice: (device: Omit<Sensor, 'id'>) => void;
  toggleDeviceStatus: (id: string) => void;
  // Outbound calling (Exotel via backend)
  activeCall: CallRecord | null;
  callHistory: CallRecord[];
  exotelConfigured: boolean;
  startCall: (
    contact: EmergencyContact,
    opts?: { mode?: 'real' | 'demo'; alertId?: string; chain?: string[] }
  ) => Promise<CallRecord | null>;
  endActiveCall: () => Promise<void>;
  clearActiveCall: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// ─── Default Data (preserved from Phase 1) ───────────────────────────────────

const defaultContacts: EmergencyContact[] = [
  { id: 'c1', name: 'Rohan Sharma', relation: 'Son (Primary)', phone: '+91 98765 43210', isPrimary: true },
  { id: 'c2', name: 'Dr. Alok Mehta', relation: 'Family Physician', phone: '+91 98123 45678', isPrimary: false },
  { id: 'c3', name: 'City Hospital Ambulance', relation: 'Emergency Services', phone: '102 / 108', isPrimary: false },
];

const defaultSensors: Sensor[] = [
  { id: 's1', name: 'ElderSafe Wearable', status: 'Online', lastUpdate: '1 min ago', battery: 82, location: 'Wearable' },
  { id: 's2', name: 'ESP32 Gateway', status: 'Online', lastUpdate: 'Just now', location: 'Living Room' },
  { id: 's3', name: 'Bedroom PIR', status: 'Online', lastUpdate: '5 mins ago', battery: 94, location: 'Bedroom' },
  { id: 's4', name: 'Living Room PIR', status: 'Online', lastUpdate: '2 mins ago', battery: 88, location: 'Living Room' },
  { id: 's5', name: 'Kitchen PIR', status: 'Online', lastUpdate: '15 mins ago', battery: 91, location: 'Kitchen' },
  { id: 's6', name: 'Main Door Sensor', status: 'Online', lastUpdate: '3 hours ago', battery: 79, location: 'Entrance' },
  { id: 's7', name: 'Medicine Box Sensor', status: 'Online', lastUpdate: '2 hours ago', battery: 85, location: 'Kitchen' },
];

const defaultTimeline: TimelineEvent[] = [
  { id: 't1', time: '07:32', activity: 'Wake-up detected', location: 'Bedroom', type: 'movement', severity: 'safe' },
  { id: 't2', time: '08:04', activity: 'Morning kitchen movement', location: 'Kitchen', type: 'movement', severity: 'safe' },
  { id: 't3', time: '09:02', activity: 'Medicine Box opened', location: 'Kitchen', type: 'medication', severity: 'safe' },
  { id: 't4', time: '09:40', activity: 'Living room occupation', location: 'Living Room', type: 'movement', severity: 'safe' },
  { id: 't5', time: '13:10', activity: 'Lunch prep detected', location: 'Kitchen', type: 'movement', severity: 'safe' },
  { id: 't6', time: '18:20', activity: 'Evening walk exit/re-entry', location: 'Entrance', type: 'movement', severity: 'safe' },
];

const defaultAlerts: Alert[] = [
  { id: 'a1', type: 'Medication taken', severity: 'safe', time: '09:04 AM', location: 'Kitchen', description: 'Morning medicine taken on time.', status: 'resolved' },
];

const defaultMedications: Medication[] = [
  { id: 'm1', name: 'Morning Medicine (Blood Pressure)', time: '09:00 AM', schedule: 'Daily', status: 'Taken', takenTime: '09:04 AM' },
  { id: 'm2', name: 'Afternoon Medicine (Multivitamin)', time: '01:30 PM', schedule: 'Daily', status: 'Pending' },
  { id: 'm3', name: 'Evening Medicine (Cholesterol)', time: '08:30 PM', schedule: 'Daily', status: 'Pending' },
  { id: 'm4', name: 'Night Medicine', time: '09:00 PM', schedule: 'Daily', status: 'Pending' },
];

// One-time migration for medication lists saved before the Night (m4) compartment existed.
const NIGHT_MIGRATION_KEY = 'eldersafe_night_med_migrated';

function withNightMedication(meds: Medication[]): Medication[] {
  try {
    if (localStorage.getItem(NIGHT_MIGRATION_KEY)) return meds;
    let next = meds;
    for (const def of defaultMedications) {
      if (!next.some(m => m.id === def.id)) {
        next = [...next, def];
      }
    }
    localStorage.setItem(NIGHT_MIGRATION_KEY, '1');
    return next;
  } catch {
    return meds;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('eldersafe-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Alert sound
  const [alertSoundEnabled, setAlertSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('eldersafe-alert-sound');
    return saved !== 'false'; // default ON
  });

  // Data mode (demo vs hardware)
  const [dataMode, setDataModeState] = useState<DataMode>('demo');

  // Profile
  const [elderProfile, setElderProfile] = useState<ElderProfile>({
    name: 'Mohan Sharma',
    age: 72,
    emergencyContacts: defaultContacts,
    wakeUpTime: '07:30 AM',
    bedTime: '10:00 PM',
    medsWindow: '08:30 AM - 09:30 AM',
  });

  // Safety state
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus>('SAFE');
  const [statusText, setStatusText] = useState<string>('Normal activity detected');
  const [safetyScore, setSafetyScore] = useState<number>(92);
  const [indicators, setIndicators] = useState({
    movement: 'Normal',
    routine: 'Normal',
    medication: 'Taken',
    fallRisk: 'Low',
    devices: 'Online',
  });

  // Data
  const [sensors, setSensors] = useState<Sensor[]>(defaultSensors);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(defaultTimeline);
  const [alerts, setAlerts] = useState<Alert[]>(defaultAlerts);
  const [medications, setMedications] = useState<Medication[]>(defaultMedications);
  const [settings, setSettings] = useState<NotificationSettings>({
    sms: true,
    push: true,
    email: false,
    escalationMinutes: 5,
    sensitivity: 'Medium',
    privacyMode: false,
    alertSoundEnabled: true,
    autoCallEscalation: false,
  });

  // ─── Outbound calling state ──────────────────────────────────────────────
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [exotelConfigured, setExotelConfigured] = useState(false);

  // Engine outputs (explainable UI)
  const [lastExplanation, setLastExplanation] = useState<DetectionExplanation | null>(null);
  const [lastAssessments, setLastAssessments] = useState<RiskAssessment[]>([]);

  // Emergency response
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [alertCountdown, setAlertCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Activity Intelligence (Phase 6)
  const [activityBaseline, setActivityBaseline] = useState<ActivityBaseline>(defaultBaseline);
  const [anomalyResult, setAnomalyResult] = useState<ActivityAnomalyResult>({
    score: 0,
    categories: {
      movement: { score: 0, status: 'Normal', explanation: 'Normal movement patterns detected.' },
      routine: { score: 0, status: 'Normal', explanation: 'Routine activity matches expected patterns.' },
      medication: { score: 0, status: 'Normal', explanation: 'Medication schedule is being followed.' },
      inactivity: { score: 0, status: 'Normal', explanation: 'Activity levels are within normal range.' },
      fallRisk: { score: 0, status: 'Normal', explanation: 'No fall indicators detected.' },
      deviceStatus: { score: 0, status: 'Normal', explanation: 'All monitoring devices are online and reporting.' },
    },
    explanation: 'All activity patterns are within normal baseline parameters.',
    factors: [],
    routineConsistency: 94,
  });

  // ─── Persistence: Load on mount ──────────────────────────────────────────

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [
        profile,
        savedAlerts,
        savedTimeline,
        savedMeds,
        savedDevices,
        savedSettings,
        savedCalls,
      ] = await Promise.all([
        loadProfile(elderProfile),
        loadAlerts(defaultAlerts),
        loadTimeline(defaultTimeline),
        loadMedications(defaultMedications),
        loadDevices(defaultSensors),
        loadSettings(settings),
        loadCallHistory<CallRecord>([]),
      ]);
      if (cancelled) return;
      setElderProfile(profile);
      setAlerts(savedAlerts);
      setTimeline(savedTimeline);
      setMedications(withNightMedication(savedMeds));
      setSensors(savedDevices);
      setSettings(prev => ({ ...prev, ...savedSettings }));
      setCallHistory(Array.isArray(savedCalls) ? savedCalls : []);
      setDataLoaded(true);
    })();
    return () => { cancelled = true; };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Persistence: Debounced save on change ───────────────────────────────

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dataLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProfile(elderProfile);
      saveAlerts(alerts);
      saveTimeline(timeline);
      saveMedications(medications);
      saveDevices(sensors);
      saveSettings(settings);
      saveCallHistory(callHistory);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [elderProfile, alerts, timeline, medications, sensors, settings, callHistory, dataLoaded]);

  // ─── Activity Intelligence: Compute anomaly on state changes ───────────

  useEffect(() => {
    if (!dataLoaded) return;
    const baseline = estimateBaseline(timeline, medications, alerts);
    setActivityBaseline(baseline);
    const result = computeActivityAnomaly(indicators, timeline, medications, alerts, safetyScore, baseline);
    setAnomalyResult(result);
  }, [indicators, timeline, medications, alerts, safetyScore, dataLoaded]);

  // Theme handler
  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('eldersafe-theme', newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Apply initial theme on mount
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Alert sound handler
  const setAlertSoundEnabled = useCallback((enabled: boolean) => {
    setAlertSoundEnabledState(enabled);
    localStorage.setItem('eldersafe-alert-sound', String(enabled));
    if (!enabled) {
      stopAlertBeep();
    }
  }, []);

  // Medicine check sounds - only play if alertSoundEnabled is true
  const playMedicineOpenSound = useCallback(() => {
    if (alertSoundEnabled) playOpenBeep();
  }, [alertSoundEnabled]);

  const playMedicineConfirmSound = useCallback(() => {
    if (alertSoundEnabled) playConfirmBeep();
  }, [alertSoundEnabled]);

  const playMedicineAlertSound = useCallback(() => {
    if (alertSoundEnabled) playAlertPattern();
  }, [alertSoundEnabled]);

  // Data mode handler
  const setDataMode = useCallback((mode: DataMode) => {
    setDataModeState(mode);
  }, []);

  // ─── Notification Helper ──────────────────────────────────────────────────

  const addNotification = useCallback((
    type: Notification['type'],
    message: string,
    alertId?: string,
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotifications(prev => [{
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      message,
      time: timeStr,
      read: false,
      alertId,
    }, ...prev]);
  }, []);

  // ─── Hardware Bridge Integration ─────────────────────────────────────────

  const bridgeRef = useRef(getHardwareBridge());
  const registryRef = useRef(getDeviceRegistry());
  const hardwareBufferRef = useRef<SensorEvent[]>([]);

  // Process hardware events through the risk engine pipeline
  const processHardwareEvents = useCallback((events: SensorEvent[]) => {
    if (events.length === 0) return;

    // Buffer events for the risk engine (same pipeline as demo mode)
    hardwareBufferRef.current = [
      ...hardwareBufferRef.current.slice(-50), // keep last 50 events
      ...events,
    ];

    const assessments = assessRisk(hardwareBufferRef.current);
    const result = processAssessments(assessments);
    const newScore = calculateNewScore(safetyScore, assessments);

    // Map risk level to safety status
    let newStatus: SafetyStatus = 'SAFE';
    if (result.overallLevel === 'critical' || result.overallLevel === 'high') {
      newStatus = 'CRITICAL';
    } else if (result.overallLevel === 'warning') {
      newStatus = 'WARNING';
    }

    setDataModeState('hardware');
    setSafetyStatus(newStatus);
    setStatusText(result.statusText);
    setSafetyScore(newScore);
    setIndicators(prev => {
      const updated = { ...prev };
      for (const a of assessments) {
        switch (a.type) {
          case 'Possible Fall Detected':
            updated.movement = 'None';
            updated.fallRisk = 'High';
            updated.routine = 'Interrupted';
            break;
          case 'Prolonged Inactivity':
            updated.movement = 'Inactive';
            updated.routine = 'Deviation';
            break;
          case 'Routine Deviation':
            updated.routine = 'Deviation';
            break;
          case 'Missed Medication':
            updated.medication = 'Missed';
            updated.routine = 'Deviation';
            break;
        }
      }
      return updated;
    });
    setAlerts(prev => [...result.alerts, ...prev]);
    setTimeline(prev => [...result.timelineEvents, ...prev]);
    setLastExplanation(result.explanations[0] ?? null);
    setLastAssessments(assessments);

    // If fall detected, start countdown
    const fallAlert = result.alerts.find(a => a.type === 'Possible Fall Detected');
    if (fallAlert) {
      setActiveAlertId(fallAlert.id);
      setAlertCountdown(10);
      addNotification('fall', `Possible fall detected from hardware sensors — Emergency attention required`, fallAlert.id);
    }
  }, [safetyScore, addNotification]);

  // Wire up the hardware bridge event listener
  useEffect(() => {
    const bridge = bridgeRef.current;
    const unsubscribe = bridge.onEvents((events) => {
      // Only process if in hardware mode
      if (dataMode === 'hardware') {
        processHardwareEvents(events);
      }
    });
    return unsubscribe;
  }, [dataMode, processHardwareEvents]);

  // Wire up device status changes from the bridge
  useEffect(() => {
    const registry = registryRef.current;
    const unsubscribe = registry.onStatusChange((deviceId, online) => {
      const device = registry.getDevice(deviceId);
      if (!device) return;

      // Update the sensor in state
      setSensors(prev =>
        prev.map(s =>
          s.id === deviceId
            ? {
                ...s,
                status: (online ? 'Online' : 'Offline') as Sensor['status'],
                lastUpdate: online ? 'Just now' : `${Math.round((Date.now() - device.lastSeen) / 60_000)} min ago`,
              }
            : s
        )
      );

      // Generate alert for offline devices
      if (!online) {
        const { alert, timeline: tl, notification } = registry.createOfflineAlert(device);
        setAlerts(prev => [alert, ...prev]);
        setTimeline(prev => [tl, ...prev]);
        setNotifications(prev => [notification, ...prev]);
        addNotification('gateway', notification.message, alert.id);
      } else {
        // Reconnected
        const reconnectNotif = registry.createReconnectNotification(device);
        setNotifications(prev => [reconnectNotif, ...prev]);
      }
    });
    return unsubscribe;
  }, [addNotification]);

  // ─── Real-Time ESP32 IoT SSE Stream Listener ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !window.EventSource) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource(apiUrl('/api/devices/events/stream'));

        eventSource.onmessage = (event) => {
          try {
            if (!event.data || event.data.startsWith(':')) return;
            const payload = JSON.parse(event.data);

            if (payload.type === 'IOT_EVENT') {
              const { event: evt, matchedMedication } = payload;
              // Box opened = access detected; only compartment/taken events
              // (or the manual "Confirm Medication Taken" button) confirm a dose.
              const isConfirmation =
                evt?.event === 'MEDICINE_COMPARTMENT_OPENED' || evt?.event === 'MEDICINE_TAKEN';

              // 1. If medication matched, update medication state
              if (matchedMedication) {
                const clockStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                setMedications(prev => prev.map(m => {
                  if (m.id === matchedMedication.id || (evt?.compartment && m.id === `m${evt.compartment}`)) {
                    if (isConfirmation) {
                      return {
                        ...m,
                        status: 'Taken',
                        accessed: false,
                        takenTime: matchedMedication.takenAt || clockStr,
                      };
                    }
                    if (m.status === 'Taken') return m;
                    return {
                      ...m,
                      accessed: true,
                      accessedAt: matchedMedication.accessedAt || clockStr,
                    };
                  }
                  return m;
                }));

                // Add timeline entry
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                setTimeline(prev => [{
                  id: `te-iot-${Date.now()}`,
                  time: timeStr,
                  activity: isConfirmation
                    ? `Medicine box: ${matchedMedication.name} confirmed taken`
                    : `Medicine box opened: ${matchedMedication.name} access detected`,
                  location: 'Kitchen',
                  type: 'medication',
                  severity: 'safe',
                }, ...prev]);

                addNotification(
                  'medication',
                  isConfirmation
                    ? `Hardware event: ${matchedMedication.name} taken via Medicine Box`
                    : `Hardware event: Medicine box opened for ${matchedMedication.name} — confirm to mark taken`
                );
              }

              // 2. Update sensor state for the medicine box
              setSensors(prev => prev.map(s => {
                if (s.name.includes('Medicine') || s.name.includes('Box') || s.id === evt?.deviceId) {
                  return {
                    ...s,
                    status: (evt?.event === 'DEVICE_OFFLINE' ? 'Offline' : 'Online') as Sensor['status'],
                    lastUpdate: 'Just now',
                  };
                }
                return s;
              }));
            } else if (payload.type === 'HEARTBEAT' || payload.type === 'DEVICE_ONLINE') {
              setSensors(prev => prev.map(s => {
                if (s.name.includes('Medicine') || s.name.includes('Box') || s.id === payload.deviceId) {
                  return { ...s, status: 'Online', lastUpdate: 'Just now' };
                }
                return s;
              }));
            } else if (payload.type === 'DEVICE_OFFLINE') {
              setSensors(prev => prev.map(s => {
                if (s.name.includes('Medicine') || s.name.includes('Box') || s.id === payload.deviceId) {
                  return { ...s, status: 'Offline', lastUpdate: 'Just now' };
                }
                return s;
              }));
            }
          } catch {
            // ignore non-json messages
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch {
        // SSE not available
      }
    };

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [addNotification]);

  // ─── Backend state sync (GET /api/devices/state) ─────────────────────────
  // Periodically pulls REAL device status, medicine state and recent ESP32
  // events from the configured backend (VITE_API_BASE_URL, e.g. Railway) so the
  // dashboard shows remote hardware activity even between SSE pushes. Errors
  // surface once per outage via the existing notification bell — never a crash.
  const backendHealthyRef = useRef(true);

  useEffect(() => {
    if (!dataLoaded) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const pull = async () => {
      try {
        const state = await fetchDeviceState();
        if (cancelled) return;

        const devices = Array.isArray(state.devices) ? state.devices : [];
        const backendMeds = Array.isArray(state.medications) ? state.medications : [];
        const events = Array.isArray(state.recentEvents) ? state.recentEvents : [];

        setSensors(prev => syncSensorsWithDevices(prev, devices));
        setMedications(prev => syncMedicationsWithBackend(prev, backendMeds));
        setTimeline(prev => {
          const entries = buildTimelineEntries(prev, events, backendMeds);
          return entries.length > 0 ? [...entries, ...prev] : prev;
        });

        if (!backendHealthyRef.current) {
          backendHealthyRef.current = true;
          addNotification('gateway', 'Backend connection restored');
        }
      } catch (err) {
        if (cancelled) return;
        if (backendHealthyRef.current) {
          backendHealthyRef.current = false;
          addNotification(
            'gateway',
            err instanceof Error ? err.message : 'Backend unreachable — retrying'
          );
        }
      } finally {
        if (!cancelled) timer = setTimeout(pull, 20000);
      }
    };

    pull();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [dataLoaded, addNotification]);

  // ─── Alert State Mutations (defined before useEffect that uses escalateAlert) ──

  // ─── Outbound calling (Exotel via backend /api/calls) ────────────────────

  const adoptCallRecord = useCallback((record: CallRecord) => {
    setActiveCall(prev => {
      if (!prev) return prev;
      if (prev.id === record.id) return record;
      // Adopt server record over optimistic local-* placeholder (same destination)
      if (prev.id.startsWith('local-') && prev.to === record.to && !isTerminalStatus(prev.status)) {
        return record;
      }
      return prev;
    });
    setCallHistory(prev => {
      const idx = prev.findIndex(c => c.id === record.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = record;
        return next;
      }
      // Replace optimistic local entry if present for the same number
      const localIdx = prev.findIndex(
        c => c.id.startsWith('local-') && c.to === record.to && !isTerminalStatus(c.status)
      );
      if (localIdx >= 0) {
        const next = prev.slice();
        next[localIdx] = record;
        return next;
      }
      return [record, ...prev].slice(0, 50);
    });
  }, []);

  const recordCallUpdate = useCallback((record: CallRecord) => {
    adoptCallRecord(record);
  }, [adoptCallRecord]);

  const startCall = useCallback(async (
    contact: EmergencyContact,
    opts?: { mode?: 'real' | 'demo'; alertId?: string; chain?: string[] }
  ): Promise<CallRecord | null> => {
    const mode = opts?.mode || 'real';
    const normalized = normalizeCallPhone(contact.phone);

    if (!normalized) {
      const failed: CallRecord = {
        id: `local-invalid-${Date.now()}`,
        to: contact.phone,
        toLabel: contact.name,
        contactId: contact.id,
        status: 'failed',
        durationSec: 0,
        reason: 'Invalid phone number',
        error: `"${contact.phone}" is not a valid dialable mobile number.`,
        demo: mode === 'demo',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      setActiveCall(failed);
      recordCallUpdate(failed);
      return failed;
    }

    // Optimistic local record so the console opens immediately (status will sync via SSE)
    const optimistic: CallRecord = {
      id: `local-${Date.now()}`,
      to: normalized,
      toLabel: contact.name,
      contactId: contact.id,
      alertId: opts?.alertId,
      status: 'calling',
      durationSec: 0,
      reason: 'Connecting…',
      demo: mode === 'demo',
      escalationChain: opts?.chain || [],
      createdAt: new Date().toISOString(),
    };
    setActiveCall(optimistic);

    try {
      const record = await initiateCall({
        to: normalized,
        toLabel: contact.name,
        contactId: contact.id,
        alertId: opts?.alertId,
        mode,
        chain: opts?.chain,
      });
      setActiveCall(record);
      recordCallUpdate(record);
      return record;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start call';
      const code = (err as { code?: string })?.code;
      const failed: CallRecord = {
        ...optimistic,
        status: 'failed',
        reason: code === 'EXOTEL_NOT_CONFIGURED' ? 'Exotel not configured' : 'Failed to start',
        error: message,
        completedAt: new Date().toISOString(),
      };
      setActiveCall(failed);
      recordCallUpdate(failed);
      return failed;
    }
  }, [recordCallUpdate]);

  const endActiveCall = useCallback(async () => {
    if (!activeCall) return;
    if (activeCall.id.startsWith('local-')) {
      const ended: CallRecord = {
        ...activeCall,
        status: 'completed',
        reason: 'Ended',
        completedAt: new Date().toISOString(),
      };
      setActiveCall(ended);
      recordCallUpdate(ended);
      return;
    }
    try {
      const record = await endCallApi(activeCall.id);
      setActiveCall(record);
      recordCallUpdate(record);
    } catch {
      // network error — leave current state; user can still close console
    }
  }, [activeCall, recordCallUpdate]);

  const clearActiveCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  // Exotel configuration status (booleans only — no secrets)
  useEffect(() => {
    let cancelled = false;
    getCallConfig()
      .then(cfg => {
        if (!cancelled) setExotelConfigured(Boolean(cfg.configured));
      })
      .catch(() => {
        if (!cancelled) setExotelConfigured(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Real-time call status from backend SSE
  useEffect(() => {
    return subscribeToCallUpdates(record => {
      adoptCallRecord(record);
    });
  }, [adoptCallRecord]);

  const escalateAlert = useCallback((id: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'escalated' as const, escalatedAt: now } : a)));
    setAlertCountdown(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
    addNotification('escalated', `Alert escalated — Primary caregiver has been notified. Emergency escalation recommended.`, id);

    // Optional auto-call on escalation (default OFF — never dials during development unless enabled)
    if (settings.autoCallEscalation) {
      const contacts = elderProfile.emergencyContacts;
      const primary = contacts.find(c => c.isPrimary) || contacts[0];
      if (primary) {
        const secondary = contacts.find(c => !c.isPrimary && normalizeCallPhone(c.phone));
        const chain = secondary ? [normalizeCallPhone(secondary.phone)!] : [];
        const mode: 'real' | 'demo' = dataMode === 'demo' ? 'demo' : 'real';
        void startCall(primary, { mode, alertId: id, chain });
      }
    }
  }, [addNotification, startCall, settings.autoCallEscalation, elderProfile.emergencyContacts, dataMode]);

  // ─── Countdown Timer Effect ──────────────────────────────────────────────

  const isCountdownActive = alertCountdown !== null && alertCountdown > 0;

  useEffect(() => {
    if (isCountdownActive) {
      countdownRef.current = setInterval(() => {
        setAlertCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [isCountdownActive]);

  // Auto-escalate when countdown reaches 0
  useEffect(() => {
    if (alertCountdown === 0 && activeAlertId) {
      const alert = alerts.find(a => a.id === activeAlertId);
      if (alert && alert.status === 'active') {
        escalateAlert(activeAlertId);
      }
    }
  }, [alertCountdown, activeAlertId, alerts, escalateAlert]);

  // Alert sound: play on critical alert, stop when resolved/acknowledged
  useEffect(() => {
    if (safetyStatus === 'CRITICAL' && alertSoundEnabled && activeAlertId) {
      playAlertBeep();
    } else {
      stopAlertBeep();
    }
    return () => stopAlertBeep();
  }, [safetyStatus, alertSoundEnabled, activeAlertId]);

  // ─── Simulation Functions (wired through engine) ─────────────────────────

  const simulateNormalActivity = useCallback(() => {
    setSafetyStatus('SAFE');
    setStatusText('Normal activity detected');
    setSafetyScore(96);
    setIndicators({
      movement: 'Normal',
      routine: 'Normal',
      medication: 'Taken',
      fallRisk: 'Low',
      devices: 'Online',
    });
    setSensors(defaultSensors);
    setMedications(prev =>
      prev.map(m => (m.id === 'm1' ? { ...m, status: 'Taken' as const, takenTime: getCurrentTimeStrAMPM() } : m))
    );
    // Resolve all active alerts and stop any active emergency state
    setAlerts(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'resolved' as const } : a));
    setActiveAlertId(null);
    setAlertCountdown(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopAlertBeep();

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setTimeline(prev => [{
      id: `t-sim-${Date.now()}`,
      time: timeStr,
      activity: 'Routine check-in: Normal activity detected',
      location: 'Living Room',
      type: 'routine',
      severity: 'safe',
    }, ...prev]);

    setLastExplanation(null);
    setLastAssessments([]);
  }, []);

  const simulateMissedMedication = useCallback(() => {
    // Resolve any existing active alert first to prevent duplicates
    setAlerts(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'resolved' as const } : a));

    const events = generateSimulationEvents('missed_medication');
    const assessments = assessRisk(events);
    const result = processAssessments(assessments);
    const newScore = calculateNewScore(safetyScore, assessments);

    setSafetyStatus('WARNING');
    setStatusText(result.statusText);
    setSafetyScore(newScore);
    setIndicators(prev => ({ ...prev, routine: 'Deviation', medication: 'Missed' }));
    setMedications(prev =>
      prev.map(m => (m.id === 'm1' ? { ...m, status: 'Missed' as const, takenTime: undefined } : m))
    );
    setAlerts(prev => [...result.alerts, ...prev]);
    setTimeline(prev => [...result.timelineEvents, ...prev]);
    setLastExplanation(result.explanations[0] ?? null);
    setLastAssessments(assessments);

    addNotification('medication', `Morning medication activity not detected — Routine deviation`, result.alerts[0]?.id);
  }, [safetyScore, addNotification]);

  const simulateProlongedInactivity = useCallback(() => {
    // Resolve any existing active alert first to prevent duplicates
    setAlerts(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'resolved' as const } : a));

    const events = generateSimulationEvents('prolonged_inactivity');
    const assessments = assessRisk(events);
    const result = processAssessments(assessments);
    const newScore = calculateNewScore(safetyScore, assessments);

    setSafetyStatus('WARNING');
    setStatusText(result.statusText);
    setSafetyScore(newScore);
    setIndicators(prev => ({ ...prev, movement: 'Inactive', routine: 'Deviation' }));
    setSensors(prev =>
      prev.map(s => (s.id === 's3' ? { ...s, status: 'Inactive', lastUpdate: '6 hours ago' } : s))
    );
    setAlerts(prev => [...result.alerts, ...prev]);
    setTimeline(prev => [...result.timelineEvents, ...prev]);
    setLastExplanation(result.explanations[0] ?? null);
    setLastAssessments(assessments);

    addNotification('inactivity', `Prolonged inactivity detected — No movement for 6+ hours`, result.alerts[0]?.id);
  }, [safetyScore, addNotification]);

  const simulateRoutineDeviation = useCallback(() => {
    // Resolve any existing active alert first to prevent duplicates
    setAlerts(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'resolved' as const } : a));

    const events = generateSimulationEvents('routine_deviation');
    const assessments = assessRisk(events);
    const result = processAssessments(assessments);
    const newScore = calculateNewScore(safetyScore, assessments);

    setSafetyStatus('WARNING');
    setStatusText(result.statusText);
    setSafetyScore(newScore);
    setIndicators(prev => ({ ...prev, routine: 'Deviation' }));
    setAlerts(prev => [...result.alerts, ...prev]);
    setTimeline(prev => [...result.timelineEvents, ...prev]);
    setLastExplanation(result.explanations[0] ?? null);
    setLastAssessments(assessments);

    addNotification('routine_deviation', `Routine deviation detected — Unusual activity pattern`, result.alerts[0]?.id);
  }, [safetyScore, addNotification]);

  const simulateFall = useCallback(() => {
    // Resolve any existing active alert first to prevent duplicates
    setAlerts(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'resolved' as const } : a));

    const events = generateSimulationEvents('fall');
    const assessments = assessRisk(events);
    const result = processAssessments(assessments);
    const newScore = calculateNewScore(safetyScore, assessments);

    setSafetyStatus('CRITICAL');
    setStatusText(result.statusText);
    setSafetyScore(newScore);
    setIndicators(prev => ({ ...prev, movement: 'None', routine: 'Interrupted', fallRisk: 'High' }));
    setSensors(prev =>
      prev.map(s => {
        if (s.id === 's1') return { ...s, status: 'Active' as const, lastUpdate: 'Just now' };
        if (s.location === 'Bathroom') return { ...s, status: 'Active' as const, lastUpdate: 'Just now' };
        return s;
      })
    );
    setAlerts(prev => [...result.alerts, ...prev]);
    setTimeline(prev => [...result.timelineEvents, ...prev]);
    setLastExplanation(result.explanations[0] ?? null);
    setLastAssessments(assessments);

    // Set active alert and start countdown
    const fallAlert = result.alerts[0];
    if (fallAlert) {
      setActiveAlertId(fallAlert.id);
      setAlertCountdown(10);
      addNotification('fall', `Possible fall detected — Emergency attention required`, fallAlert.id);
    }
  }, [safetyScore, addNotification]);

  const simulateMultipleAnomalies = useCallback(() => {
    // Resolve any existing active alert first to prevent duplicates
    setAlerts(prev => prev.map(a => a.status === 'active' ? { ...a, status: 'resolved' as const } : a));

    const events = generateSimulationEvents('multiple_anomalies');
    const assessments = assessRisk(events);
    const result = processAssessments(assessments);
    const newScore = calculateNewScore(safetyScore, assessments);

    // Add gateway disconnected alert manually
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const gatewayAlert: Alert = {
      id: `a-sim-gw-${Date.now()}`,
      type: 'Gateway Disconnected',
      severity: 'critical',
      time: timeStr,
      location: 'Living Room',
      description: 'ESP32 Gateway has been offline for 10 minutes. Monitoring is suspended. Because: All sensors lost connectivity; Wearable heartbeat stopped.',
      status: 'active',
    };

    const gatewayTimeline: TimelineEvent = {
      id: `t-sim-gw-${Date.now()}`,
      time: timeStr,
      activity: 'Gateway connection lost - monitoring suspended',
      location: 'System',
      type: 'sensor',
      severity: 'critical',
    };

    setSafetyStatus('CRITICAL');
    setStatusText(result.statusText);
    setSafetyScore(newScore);
    setIndicators({ movement: 'Inactive', routine: 'Deviation', medication: 'Missed', fallRisk: 'Medium', devices: 'Critical' });
    setSensors(prev =>
      prev.map(s => {
        if (s.id === 's1' || s.id === 's2') return { ...s, status: 'Offline' as const, lastUpdate: '10 mins ago' };
        return s;
      })
    );
    setMedications(prev =>
      prev.map(m => (m.id === 'm1' ? { ...m, status: 'Missed' as const, takenTime: undefined } : m))
    );
    setAlerts(prev => [gatewayAlert, ...result.alerts, ...prev]);
    setTimeline(prev => [gatewayTimeline, ...result.timelineEvents, ...prev]);
    setLastExplanation(result.explanations[0] ?? null);
    setLastAssessments(assessments);

    // Set active alert and start countdown
    setActiveAlertId(gatewayAlert.id);
    setAlertCountdown(10);
    addNotification('gateway', `Gateway disconnected — Multiple anomalies detected`, gatewayAlert.id);
  }, [safetyScore, addNotification]);

  const resetSimulation = useCallback(() => {
    // Stop all active states
    setSafetyStatus('SAFE');
    setStatusText('Normal activity detected');
    setSafetyScore(92);
    setIndicators({
      movement: 'Normal',
      routine: 'Normal',
      medication: 'Taken',
      fallRisk: 'Low',
      devices: 'Online',
    });
    setSensors(defaultSensors);
    setTimeline(defaultTimeline);
    setAlerts(defaultAlerts);
    setMedications(defaultMedications);
    setLastExplanation(null);
    setLastAssessments([]);
    setActiveAlertId(null);
    setAlertCountdown(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopAlertBeep();
  }, []);

  // ─── Mutators (preserved from Phase 1) ───────────────────────────────────

  const resolveAlert = useCallback((id: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'resolved' as const, resolvedAt: now } : a)));
    if (activeAlertId === id) {
      setActiveAlertId(null);
      setAlertCountdown(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      stopAlertBeep();
    }
    addNotification('resolved', `Alert resolved`, id);
  }, [activeAlertId, addNotification]);

  const acknowledgeAlert = useCallback((id: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'acknowledged' as const, acknowledgedAt: now } : a)));
    setAlertCountdown(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
    stopAlertBeep();
    addNotification('acknowledged', `Alert acknowledged by caregiver`, id);
  }, [addNotification]);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'status'>) => {
    const newAlert: Alert = { ...alert, id: `a-${Date.now()}`, status: 'active' };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const addMedication = useCallback((med: Omit<Medication, 'id' | 'status'>) => {
    const newMed: Medication = { ...med, id: `m-${Date.now()}`, status: 'Pending' };
    setMedications(prev => [...prev, newMed]);
  }, []);

  const editMedication = useCallback((id: string, updatedMed: Partial<Medication>) => {
    setMedications(prev => prev.map(m => (m.id === id ? { ...m, ...updatedMed } : m)));
  }, []);

  const deleteMedication = useCallback((id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  }, []);

  const toggleMedicationStatus = useCallback((id: string) => {
    setMedications(prev =>
      prev.map(m => {
        if (m.id === id) {
          const nextStatus = m.status === 'Taken' ? 'Pending' : m.status === 'Pending' ? 'Taken' : 'Pending';
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return {
            ...m,
            status: nextStatus,
            accessed: false,
            takenTime: nextStatus === 'Taken' ? nowStr : undefined,
          };
        }
        return m;
      })
    );
  }, []);

  const updateProfile = useCallback((profile: Partial<ElderProfile>) => {
    setElderProfile(prev => ({ ...prev, ...profile }));
  }, []);

  const updateContacts = useCallback((contacts: EmergencyContact[]) => {
    setElderProfile(prev => ({ ...prev, emergencyContacts: contacts }));
  }, []);

  const updateSettings = useCallback((updatedSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updatedSettings }));
  }, []);

  const addDevice = useCallback((device: Omit<Sensor, 'id'>) => {
    const newDevice: Sensor = { ...device, id: `s-${Date.now()}` };
    setSensors(prev => [...prev, newDevice]);
  }, []);

  const toggleDeviceStatus = useCallback((id: string) => {
    setSensors(prev =>
      prev.map(s => {
        if (s.id === id) {
          const nextStatus = s.status === 'Online' ? 'Offline' : 'Online';
          return { ...s, status: nextStatus, lastUpdate: 'Just now' };
        }
        return s;
      })
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <DemoContext.Provider
      value={{
        elderProfile,
        safetyStatus,
        statusText,
        safetyScore,
        indicators,
        sensors,
        timeline,
        alerts,
        medications,
        settings,
        theme,
        setTheme,
        alertSoundEnabled,
        setAlertSoundEnabled,
        playMedicineOpenSound,
        playMedicineConfirmSound,
        playMedicineAlertSound,
        dataMode,
        setDataMode,
        activityBaseline,
        anomalyResult,
        simulateNormalActivity,
        simulateMissedMedication,
        simulateProlongedInactivity,
        simulateRoutineDeviation,
        simulateFall,
        simulateMultipleAnomalies,
        resetSimulation,
        processHardwareEvents,
        lastExplanation,
        lastAssessments,
        activeAlertId,
        alertCountdown,
        acknowledgeAlert,
        escalateAlert,
        notifications,
        unreadCount,
        dismissNotification,
        markAllNotificationsRead,
        resolveAlert,
        addAlert,
        addMedication,
        editMedication,
        deleteMedication,
        toggleMedicationStatus,
        updateProfile,
        updateContacts,
        updateSettings,
        addDevice,
        toggleDeviceStatus,
        activeCall,
        callHistory,
        exotelConfigured,
        startCall,
        endActiveCall,
        clearActiveCall,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
