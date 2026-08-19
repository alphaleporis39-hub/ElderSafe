import type {
  SensorEvent,
  AccelerometerData,
  GyroscopeData,
  RoutineProfile,
} from '../types';

// ─── Default Routine Profile (Mohan Sharma) ─────────────────────────────────

export const defaultRoutineProfile: RoutineProfile = {
  name: 'Mohan Sharma - Daily Routine',
  windows: [
    {
      name: 'Wake-up',
      startHour: 7,
      startMinute: 0,
      endHour: 9,
      endMinute: 0,
      sensorRequired: ['Bedroom'],
      description: 'Expected morning wake-up activity in bedroom',
    },
    {
      name: 'Morning Medicine',
      startHour: 8,
      startMinute: 0,
      endHour: 10,
      endMinute: 0,
      sensorRequired: ['Kitchen'],
      description: 'Blood pressure medication window - medicine box should be opened',
    },
    {
      name: 'Breakfast',
      startHour: 8,
      startMinute: 30,
      endHour: 10,
      endMinute: 0,
      sensorRequired: ['Kitchen'],
      description: 'Expected kitchen activity for breakfast preparation',
    },
    {
      name: 'Lunch',
      startHour: 12,
      startMinute: 0,
      endHour: 14,
      endMinute: 0,
      sensorRequired: ['Kitchen'],
      description: 'Expected kitchen activity for lunch',
    },
    {
      name: 'Evening Activity',
      startHour: 17,
      startMinute: 0,
      endHour: 20,
      endMinute: 0,
      sensorRequired: ['Living Room', 'Kitchen'],
      description: 'Expected evening movement in living room and kitchen',
    },
    {
      name: 'Bedtime',
      startHour: 21,
      startMinute: 30,
      endHour: 23,
      endMinute: 0,
      sensorRequired: ['Bedroom'],
      description: 'Expected transition to bedroom for sleep',
    },
  ],
  inactivityThresholdMinutes: 360, // 6 hours
  nightModeStart: 23,
  nightModeEnd: 6,
};

// ─── Timestamp Helpers ───────────────────────────────────────────────────────

function now(): number {
  return Date.now();
}

function minutesAgo(mins: number): number {
  return Date.now() - mins * 60 * 1000;
}

function timeStr(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function timeStrAMPM(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Sensor Event Generators ─────────────────────────────────────────────────

function createAccelerometer(
  x: number, y: number, z: number, ts?: number
): AccelerometerData {
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  return { x, y, z, magnitude, timestamp: ts ?? now() };
}

function createGyroscope(
  pitch: number, roll: number, yaw: number, av: number, ts?: number
): GyroscopeData {
  return { pitch, roll, yaw, angularVelocity: av, timestamp: ts ?? now() };
}

// ─── Normal Activity Simulation ──────────────────────────────────────────────

export function generateNormalActivity(): SensorEvent[] {
  const t = now();
  return [
    // Wearable sending normal telemetry
    { type: 'accelerometer', data: createAccelerometer(0.2, -9.6, 0.8, t) },
    { type: 'gyroscope', data: createGyroscope(5, 2, 0, 3, t) },
    // Living room motion detected
    { type: 'motion', data: { room: 'Living Room', detected: true, duration: 300, timestamp: t } },
    // Medicine was taken (already in state, but confirm via sensor)
    { type: 'medicine', data: { opened: false, duration: 0, timestamp: minutesAgo(120) } },
    // All devices reporting online
    { type: 'battery', data: { level: 82, timestamp: t } },
  ];
}

// ─── Fall Simulation ─────────────────────────────────────────────────────────

export function generateFallEvent(): SensorEvent[] {
  const t = now();
  const baseTs = t - 5000; // fall starts 5 seconds ago

  const events: SensorEvent[] = [];

  // Phase 1: Normal standing (500ms before fall)
  events.push({
    type: 'accelerometer',
    data: createAccelerometer(0.1, -9.8, 0.2, baseTs - 500),
  });
  events.push({
    type: 'gyroscope',
    data: createGyroscope(2, 1, 0, 2, baseTs - 500),
  });

  // Phase 2: Sudden acceleration spike (initial stumble)
  events.push({
    type: 'accelerometer',
    data: createAccelerometer(2.5, -12.3, 4.1, baseTs),
  });
  events.push({
    type: 'gyroscope',
    data: createGyroscope(15, 25, 8, 45, baseTs),
  });

  // Phase 3: High-g impact (the actual fall impact)
  events.push({
    type: 'accelerometer',
    data: createAccelerometer(8.2, -22.5, 12.7, baseTs + 200),
  });
  events.push({
    type: 'gyroscope',
    data: createGyroscope(85, 72, 30, 180, baseTs + 200),
  });

  // Phase 4: Orientation change (now lying down)
  events.push({
    type: 'accelerometer',
    data: createAccelerometer(0.3, -1.2, 9.6, baseTs + 500),
  });
  events.push({
    type: 'gyroscope',
    data: createGyroscope(88, 90, 30, 5, baseTs + 500),
  });

  // Phase 5: Post-impact inactivity (no movement for 5+ seconds)
  events.push({
    type: 'accelerometer',
    data: createAccelerometer(0.05, -0.1, 0.02, t),
  });
  events.push({
    type: 'gyroscope',
    data: createGyroscope(88, 90, 30, 0, t),
  });

  // Bathroom motion stopped
  events.push({
    type: 'motion',
    data: { room: 'Bathroom', detected: false, duration: 0, timestamp: t },
  });

  return events;
}

// ─── Missed Medication Simulation ────────────────────────────────────────────

export function generateMissedMedication(): SensorEvent[] {
  const t = now();
  return [
    // Medicine box was NOT opened during the window
    { type: 'medicine', data: { opened: false, duration: 0, timestamp: t } },
    // Normal wearable telemetry (person is awake)
    { type: 'accelerometer', data: createAccelerometer(0.3, -9.5, 0.5, t) },
    { type: 'gyroscope', data: createGyroscope(3, 1, 0, 5, t) },
    // Kitchen has some motion (they're up and about)
    { type: 'motion', data: { room: 'Kitchen', detected: true, duration: 120, timestamp: t } },
  ];
}

// ─── Prolonged Inactivity Simulation ─────────────────────────────────────────

export function generateProlongedInactivity(): SensorEvent[] {
  const t = now();
  return [
    // Bedroom shows no motion for 6+ hours
    { type: 'motion', data: { room: 'Bedroom', detected: false, duration: 0, timestamp: minutesAgo(370) } },
    // Wearable shows very low activity (lying still)
    { type: 'accelerometer', data: createAccelerometer(0.02, -0.05, 0.01, t) },
    { type: 'gyroscope', data: createGyroscope(0, 0, 0, 0, t) },
    // No other room activity
    { type: 'motion', data: { room: 'Living Room', detected: false, duration: 0, timestamp: t } },
    { type: 'motion', data: { room: 'Kitchen', detected: false, duration: 0, timestamp: t } },
  ];
}

// ─── Routine Deviation Simulation ────────────────────────────────────────────

export function generateRoutineDeviation(): SensorEvent[] {
  const t = now();
  return [
    // Unusual nighttime kitchen activity
    { type: 'motion', data: { room: 'Kitchen', detected: true, duration: 2700, timestamp: t } },
    // Wearable shows movement
    { type: 'accelerometer', data: createAccelerometer(1.5, -8.2, 2.1, t) },
    { type: 'gyroscope', data: createGyroscope(20, 15, 5, 25, t) },
    // Door opened briefly
    { type: 'door', data: { opened: true, duration: 30, timestamp: t } },
  ];
}

// ─── Multiple Anomalies Simulation ───────────────────────────────────────────

export function generateMultipleAnomalies(): SensorEvent[] {
  const t = now();
  const events: SensorEvent[] = [];

  // 1. Missed medication
  events.push({
    type: 'medicine',
    data: { opened: false, duration: 0, timestamp: t },
  });

  // 2. No kitchen activity during expected window
  events.push({
    type: 'motion',
    data: { room: 'Kitchen', detected: false, duration: 0, timestamp: t },
  });

  // 3. Prolonged inactivity
  events.push({
    type: 'motion',
    data: { room: 'Bedroom', detected: false, duration: 0, timestamp: minutesAgo(400) },
  });
  events.push({
    type: 'motion',
    data: { room: 'Living Room', detected: false, duration: 0, timestamp: t },
  });

  // 4. Wearable telemetry flatline
  events.push({
    type: 'accelerometer',
    data: createAccelerometer(0.01, -0.02, 0.005, t),
  });
  events.push({
    type: 'gyroscope',
    data: createGyroscope(0, 0, 0, 0, t),
  });

  // 5. Gateway disconnected (simulated offline)
  events.push({
    type: 'battery',
    data: { level: 0, timestamp: t },
  });

  return events;
}

// ─── Simulation Dispatcher ───────────────────────────────────────────────────

export type SimulationType =
  | 'normal'
  | 'fall'
  | 'missed_medication'
  | 'prolonged_inactivity'
  | 'routine_deviation'
  | 'multiple_anomalies';

export function generateSimulationEvents(type: SimulationType): SensorEvent[] {
  switch (type) {
    case 'normal':
      return generateNormalActivity();
    case 'fall':
      return generateFallEvent();
    case 'missed_medication':
      return generateMissedMedication();
    case 'prolonged_inactivity':
      return generateProlongedInactivity();
    case 'routine_deviation':
      return generateRoutineDeviation();
    case 'multiple_anomalies':
      return generateMultipleAnomalies();
    default:
      return generateNormalActivity();
  }
}

export function getCurrentTimeStr(): string {
  return timeStr(new Date());
}

export function getCurrentTimeStrAMPM(): string {
  return timeStrAMPM(new Date());
}
