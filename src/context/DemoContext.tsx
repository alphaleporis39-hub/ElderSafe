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
} from '../services/persistence';
import { getHardwareBridge } from '../services/hardwareBridge';
import { getDeviceRegistry } from '../services/deviceRegistry';
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
}

export interface NotificationSettings {
  sms: boolean;
  push: boolean;
  email: boolean;
  escalationMinutes: number;
  sensitivity: 'Low' | 'Medium' | 'High';
  privacyMode: boolean;
  alertSoundEnabled: boolean;
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
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
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
  });

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
      const [profile, savedAlerts, savedTimeline, savedMeds, savedDevices, savedSettings] = await Promise.all([
        loadProfile(elderProfile),
        loadAlerts(defaultAlerts),
        loadTimeline(defaultTimeline),
        loadMedications(defaultMedications),
        loadDevices(defaultSensors),
        loadSettings(settings),
      ]);
      if (cancelled) return;
      setElderProfile(profile);
      setAlerts(savedAlerts);
      setTimeline(savedTimeline);
      setMedications(withNightMedication(savedMeds));
      setSensors(savedDevices);
      setSettings(savedSettings);
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
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [elderProfile, alerts, timeline, medications, sensors, settings, dataLoaded]);

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
        eventSource = new EventSource('/api/devices/events/stream');

        eventSource.onmessage = (event) => {
          try {
            if (!event.data || event.data.startsWith(':')) return;
            const payload = JSON.parse(event.data);

            if (payload.type === 'IOT_EVENT') {
              const { event: evt, matchedMedication } = payload;
              
              // 1. If medication matched, update medication state
              if (matchedMedication) {
                setMedications(prev => prev.map(m => {
                  if (m.id === matchedMedication.id || (evt?.compartment && m.id === `m${evt.compartment}`)) {
                    return {
                      ...m,
                      status: 'Taken',
                      takenTime: matchedMedication.takenAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
                  activity: `Medicine box opened: ${matchedMedication.name} confirmed`,
                  location: 'Kitchen',
                  type: 'medication',
                  severity: 'safe',
                }, ...prev]);

                addNotification('medication', `Hardware event: ${matchedMedication.name} taken via Medicine Box`);
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

  // ─── Alert State Mutations (defined before useEffect that uses escalateAlert) ──

  const escalateAlert = useCallback((id: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'escalated' as const, escalatedAt: now } : a)));
    setAlertCountdown(null);
    if (countdownRef.current) clearInterval(countdownRef.current);
    addNotification('escalated', `Alert escalated — Primary caregiver has been notified. Emergency escalation recommended.`, id);
  }, [addNotification]);

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
          return { ...m, status: nextStatus, takenTime: nextStatus === 'Taken' ? nowStr : undefined };
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
