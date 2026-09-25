// ─── Sensor Data Types ────────────────────────────────────────────────────────

export interface AccelerometerData {
  x: number; // m/s²
  y: number;
  z: number;
  magnitude: number; // total g-force
  timestamp: number;
}

export interface GyroscopeData {
  pitch: number; // degrees
  roll: number;
  yaw: number;
  angularVelocity: number; // deg/s
  timestamp: number;
}

export interface MotionEvent {
  room: RoomZone;
  detected: boolean;
  duration: number; // seconds
  timestamp: number;
}

export interface DoorEvent {
  opened: boolean;
  duration: number;
  timestamp: number;
}

export interface MedicineBoxEvent {
  opened: boolean;
  duration: number;
  timestamp: number;
  compartment?: number;
}

export interface BatteryEvent {
  level: number; // percentage
  timestamp: number;
}

export type RoomZone = 'Bedroom' | 'Bathroom' | 'Kitchen' | 'Living Room' | 'Entrance';

// ─── Sensor Event Union ──────────────────────────────────────────────────────

export type SensorEvent =
  | { type: 'accelerometer'; data: AccelerometerData }
  | { type: 'gyroscope'; data: GyroscopeData }
  | { type: 'motion'; data: MotionEvent }
  | { type: 'door'; data: DoorEvent }
  | { type: 'medicine'; data: MedicineBoxEvent }
  | { type: 'battery'; data: BatteryEvent };

// ─── Detection Types ─────────────────────────────────────────────────────────

export interface FallDetectionResult {
  detected: boolean;
  confidence: number; // 0-100
  factors: string[];
  timestamp: number;
  location: RoomZone;
}

export interface RoutineCheckResult {
  compliant: boolean;
  deviation: string | null;
  expectedWindow: string;
  actualActivity: string;
  timestamp: number;
}

export interface InactivityResult {
  prolongedInactivity: boolean;
  inactiveDuration: number; // minutes
  expectedActivity: string;
  timestamp: number;
}

// ─── Risk Assessment ─────────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'warning' | 'high' | 'critical';

export interface DetectionExplanation {
  summary: string;
  factors: string[];
  timestamp: string;
  confidence?: number;
}

export interface RiskAssessment {
  id: string;
  level: RiskLevel;
  type: string;
  explanation: DetectionExplanation;
  location: RoomZone | 'System';
  timestamp: number;
  scoreImpact: number; // negative number, how much to reduce score
  sensorUpdates: SensorUpdate[];
  timelineEvent: TimelineEntry;
}

export interface SensorUpdate {
  sensorId: string;
  status: 'Online' | 'Offline' | 'Active' | 'Inactive';
  lastUpdate: string;
}

export interface TimelineEntry {
  time: string;
  activity: string;
  location: string;
  type: 'movement' | 'medication' | 'sensor' | 'routine' | 'alert';
  severity: 'safe' | 'warning' | 'critical';
}

// ─── Alert & Timeline (shared with DemoContext) ──────────────────────────────

export type AlertStatus = 'active' | 'acknowledged' | 'escalated' | 'resolved';

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

export interface Notification {
  id: string;
  type: 'fall' | 'routine_deviation' | 'inactivity' | 'acknowledged' | 'resolved' | 'escalated' | 'medication' | 'gateway';
  message: string;
  time: string;
  read: boolean;
  alertId?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  activity: string;
  location: string;
  type: 'movement' | 'medication' | 'sensor' | 'routine' | 'alert';
  severity: 'safe' | 'warning' | 'critical';
}

// ─── Calling (Exotel outbound) ───────────────────────────────────────────────

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

// ─── Routine Profile ─────────────────────────────────────────────────────────

export interface RoutineWindow {
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  sensorRequired: RoomZone[];
  description: string;
}

export interface RoutineProfile {
  name: string;
  windows: RoutineWindow[];
  inactivityThresholdMinutes: number;
  nightModeStart: number; // hour (24h)
  nightModeEnd: number;
}

// ─── Simulation Config ───────────────────────────────────────────────────────

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  events: SensorEvent[];
  expectedRiskLevel: RiskLevel;
}
