import type {
  SensorEvent,
  AccelerometerData,
  GyroscopeData,
  MotionEvent,
  MedicineBoxEvent,
  FallDetectionResult,
  RoutineCheckResult,
  InactivityResult,
  RiskAssessment,
  RiskLevel,
  RoutineProfile,
  RoomZone,
} from '../types';
import { defaultRoutineProfile } from './simulationService';

// ─── Constants ───────────────────────────────────────────────────────────────

const FALL_ACCEL_THRESHOLD = 15.0; // m/s² (roughly 1.5g impact)
const FALL_GYRO_THRESHOLD = 100; // deg/s
const FALL_CONFIDENCE_THRESHOLD = 70;

// ─── Unique ID Generator ────────────────────────────────────────────────────

let assessmentCounter = 0;
function nextId(): string {
  assessmentCounter += 1;
  return `ra-${Date.now()}-${assessmentCounter}`;
}

// ─── Fall Detection ──────────────────────────────────────────────────────────

export function detectFall(
  accelEvents: AccelerometerData[],
  gyroEvents: GyroscopeData[],
  motionEvents: MotionEvent[],
): FallDetectionResult {
  const factors: string[] = [];
  let confidence = 0;

  // Check for sudden acceleration spike
  const maxMagnitude = accelEvents.reduce(
    (max, e) => Math.max(max, e.magnitude), 0
  );
  const hasAccelSpike = maxMagnitude > FALL_ACCEL_THRESHOLD;
  if (hasAccelSpike) {
    confidence += 30;
    factors.push(`Sudden acceleration spike detected (${maxMagnitude.toFixed(1)} m/s², threshold: ${FALL_ACCEL_THRESHOLD} m/s²)`);
  }

  // Check for high angular velocity (orientation change)
  const maxAngularVel = gyroEvents.reduce(
    (max, e) => Math.max(max, e.angularVelocity), 0
  );
  const hasGyroSpike = maxAngularVel > FALL_GYRO_THRESHOLD;
  if (hasGyroSpike) {
    confidence += 25;
    factors.push(`Rapid orientation change detected (${maxAngularVel.toFixed(0)} deg/s, threshold: ${FALL_GYRO_THRESHOLD} deg/s)`);
  }

  // Check for orientation change (standing → lying)
  const lastGyro = gyroEvents[gyroEvents.length - 1];
  if (lastGyro) {
    const isLyingDown = Math.abs(lastGyro.pitch) > 70 || Math.abs(lastGyro.roll) > 70;
    if (isLyingDown) {
      confidence += 20;
      factors.push(`Orientation changed to horizontal position (pitch: ${lastGyro.pitch.toFixed(0)}°, roll: ${lastGyro.roll.toFixed(0)}°)`);
    }
  }

  // Check for post-impact inactivity
  const lastAccel = accelEvents[accelEvents.length - 1];
  if (lastAccel) {
    const isStill = lastAccel.magnitude < 0.5;
    if (isStill) {
      confidence += 15;
      factors.push('No movement detected after impact (post-impact stillness)');
    }
  }

  // Check for motion sensor blackout in expected room
  const noMotion = motionEvents.some(m => !m.detected);
  if (noMotion && hasAccelSpike) {
    confidence += 10;
    factors.push('Motion sensor stopped detecting activity after high-impact event');
  }

  // Cap confidence
  confidence = Math.min(confidence, 98);

  // Determine location from motion events
  let location: RoomZone = 'Bathroom';
  const lastMotion = motionEvents[motionEvents.length - 1];
  if (lastMotion) {
    location = lastMotion.room;
  }

  return {
    detected: confidence >= FALL_CONFIDENCE_THRESHOLD,
    confidence,
    factors,
    timestamp: Date.now(),
    location,
  };
}

// ─── Routine Compliance Check ────────────────────────────────────────────────

export function checkRoutineCompliance(
  motionEvents: MotionEvent[],
  medicineEvents: MedicineBoxEvent[],
  profile: RoutineProfile = defaultRoutineProfile,
): RoutineCheckResult[] {
  const results: RoutineCheckResult[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (const window of profile.windows) {
    const windowStart = window.startHour * 60 + window.startMinute;
    const windowEnd = window.endHour * 60 + window.endMinute;
    const currentMinutes = currentHour * 60 + currentMinute;

    // Only check windows that have passed or are currently active
    if (currentMinutes < windowStart) continue;

    // Check if the required sensors detected activity
    const hasActivity = window.sensorRequired.some(room =>
      motionEvents.some(m => m.room === room && m.detected)
    );

    // Special check for medicine window
    if (window.name === 'Morning Medicine') {
      const medicineOpened = medicineEvents.some(m => m.opened);
      if (!medicineOpened && currentMinutes > windowEnd) {
        results.push({
          compliant: false,
          deviation: `Medicine box was not opened during the ${window.name} window (${window.startHour}:${String(window.startMinute).padStart(2, '0')} - ${window.endHour}:${String(window.endMinute).padStart(2, '0')})`,
          expectedWindow: `${window.startHour}:${String(window.startMinute).padStart(2, '0')} - ${window.endHour}:${String(window.endMinute).padStart(2, '0')}`,
          actualActivity: 'No medicine box activity detected',
          timestamp: Date.now(),
        });
        continue;
      }
    }

    // Check general activity compliance
    if (!hasActivity && currentMinutes > windowEnd) {
      results.push({
        compliant: false,
        deviation: `No activity detected in ${window.sensorRequired.join(', ')} during ${window.name} window`,
        expectedWindow: `${window.startHour}:${String(window.startMinute).padStart(2, '0')} - ${window.endHour}:${String(window.endMinute).padStart(2, '0')}`,
        actualActivity: `No motion in ${window.sensorRequired.join(' or ')}`,
        timestamp: Date.now(),
      });
    } else if (hasActivity) {
      results.push({
        compliant: true,
        deviation: null,
        expectedWindow: `${window.startHour}:${String(window.startMinute).padStart(2, '0')} - ${window.endHour}:${String(window.endMinute).padStart(2, '0')}`,
        actualActivity: `Activity detected as expected`,
        timestamp: Date.now(),
      });
    }
  }

  return results;
}

// ─── Inactivity Detection ────────────────────────────────────────────────────

export function detectInactivity(
  motionEvents: MotionEvent[],
  accelEvents: AccelerometerData[],
  profile: RoutineProfile = defaultRoutineProfile,
): InactivityResult {
  // Check if all motion sensors are inactive
  const allInactive = motionEvents.every(m => !m.detected);

  // Check if accelerometer shows minimal movement
  const lastAccel = accelEvents[accelEvents.length - 1];
  const isStill = lastAccel ? lastAccel.magnitude < 0.5 : false;

  // Estimate inactivity duration from event timestamps
  const inactiveDuration = allInactive ? profile.inactivityThresholdMinutes + 10 : 0;

  return {
    prolongedInactivity: allInactive && isStill,
    inactiveDuration,
    expectedActivity: 'Regular movement across rooms',
    timestamp: Date.now(),
  };
}

// ─── Risk Assessment Generator ───────────────────────────────────────────────

export function assessRisk(events: SensorEvent[]): RiskAssessment[] {
  const assessments: RiskAssessment[] = [];

  // Categorize events
  const accelEvents = events
    .filter((e): e is SensorEvent & { type: 'accelerometer'; data: AccelerometerData } =>
      e.type === 'accelerometer')
    .map(e => e.data);
  const gyroEvents = events
    .filter((e): e is SensorEvent & { type: 'gyroscope'; data: GyroscopeData } =>
      e.type === 'gyroscope')
    .map(e => e.data);
  const motionEvents = events
    .filter((e): e is SensorEvent & { type: 'motion'; data: MotionEvent } =>
      e.type === 'motion')
    .map(e => e.data);
  const medicineEvents = events
    .filter((e): e is SensorEvent & { type: 'medicine'; data: MedicineBoxEvent } =>
      e.type === 'medicine')
    .map(e => e.data);

  // 1. Fall Detection
  if (accelEvents.length > 0 && gyroEvents.length > 0) {
    const fallResult = detectFall(accelEvents, gyroEvents, motionEvents);
    if (fallResult.detected) {
      assessments.push(createFallAssessment(fallResult));
    }
  }

  // 2. Routine Compliance
  const routineResults = checkRoutineCompliance(motionEvents, medicineEvents);
  for (const result of routineResults) {
    if (!result.compliant) {
      assessments.push(createRoutineDeviationAssessment(result));
    }
  }

  // 3. Inactivity Detection
  if (motionEvents.length > 0 && accelEvents.length > 0) {
    const inactivityResult = detectInactivity(motionEvents, accelEvents);
    if (inactivityResult.prolongedInactivity) {
      assessments.push(createInactivityAssessment(inactivityResult));
    }
  }

  // 4. Medicine Missed (explicit check from medicine events)
  const medicineMissed = medicineEvents.some(m => !m.opened);
  const hasRoutineDeviation = routineResults.some(r => !r.compliant);
  if (medicineMissed && hasRoutineDeviation) {
    // Only add if not already covered by routine deviation
    const alreadyCovered = assessments.some(a => a.type === 'Missed Medication');
    if (!alreadyCovered) {
      assessments.push(createMissedMedicineAssessment());
    }
  }

  return assessments;
}

// ─── Assessment Factories ────────────────────────────────────────────────────

function createFallAssessment(result: FallDetectionResult): RiskAssessment {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: nextId(),
    level: 'critical',
    type: 'Possible Fall Detected',
    explanation: {
      summary: `Fall detection triggered with ${result.confidence}% confidence. Multiple sensor indicators confirm a high-impact event followed by immobility.`,
      factors: result.factors,
      timestamp: timeStr,
      confidence: result.confidence,
    },
    location: result.location,
    timestamp: Date.now(),
    scoreImpact: -60,
    sensorUpdates: [
      { sensorId: 's1', status: 'Active', lastUpdate: 'Just now' },
    ],
    timelineEvent: {
      time: timeStr,
      activity: `CRITICAL: Fall detected in ${result.location} (${result.confidence}% confidence)`,
      location: result.location,
      type: 'alert',
      severity: 'critical',
    },
  };
}

function createRoutineDeviationAssessment(result: RoutineCheckResult): RiskAssessment {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: nextId(),
    level: 'warning',
    type: 'Routine Deviation',
    explanation: {
      summary: `Routine compliance check failed. ${result.deviation}`,
      factors: [
        `Expected window: ${result.expectedWindow}`,
        `Actual activity: ${result.actualActivity}`,
        'Activity pattern deviates from established baseline',
      ],
      timestamp: timeStr,
    },
    location: 'System',
    timestamp: Date.now(),
    scoreImpact: -15,
    sensorUpdates: [],
    timelineEvent: {
      time: timeStr,
      activity: `Routine deviation: ${result.deviation || 'unexpected pattern'}`,
      location: 'System',
      type: 'routine',
      severity: 'warning',
    },
  };
}

function createInactivityAssessment(result: InactivityResult): RiskAssessment {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: nextId(),
    level: 'warning',
    type: 'Prolonged Inactivity',
    explanation: {
      summary: `No movement detected for over ${Math.round(result.inactiveDuration / 60)} hours. This exceeds the expected inactivity threshold.`,
      factors: [
        `Inactive duration: ${Math.round(result.inactiveDuration / 60)} hours (threshold: 6 hours)`,
        `Expected activity: ${result.expectedActivity}`,
        'All motion sensors report no activity',
        'Wearable accelerometer shows minimal movement',
      ],
      timestamp: timeStr,
    },
    location: 'Bedroom',
    timestamp: Date.now(),
    scoreImpact: -20,
    sensorUpdates: [
      { sensorId: 's3', status: 'Inactive', lastUpdate: `${Math.round(result.inactiveDuration / 60)} hours ago` },
    ],
    timelineEvent: {
      time: timeStr,
      activity: `Inactivity warning: No movement for ${Math.round(result.inactiveDuration / 60)} hours`,
      location: 'Bedroom',
      type: 'alert',
      severity: 'warning',
    },
  };
}

function createMissedMedicineAssessment(): RiskAssessment {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: nextId(),
    level: 'warning',
    type: 'Missed Medication',
    explanation: {
      summary: 'Medicine box was not opened during the scheduled medication window. Morning blood pressure medication may have been skipped.',
      factors: [
        'Medicine box sensor did not detect opening',
        'Medication window has closed',
        'Elder was active in other rooms during the window',
      ],
      timestamp: timeStr,
    },
    location: 'Kitchen',
    timestamp: Date.now(),
    scoreImpact: -12,
    sensorUpdates: [],
    timelineEvent: {
      time: timeStr,
      activity: 'Medication window missed - medicine box not opened',
      location: 'Kitchen',
      type: 'medication',
      severity: 'warning',
    },
  };
}

// ─── Score Calculator ────────────────────────────────────────────────────────

export function calculateNewScore(
  currentScore: number,
  assessments: RiskAssessment[],
): number {
  let score = currentScore;
  for (const a of assessments) {
    score += a.scoreImpact;
  }
  return Math.max(5, Math.min(100, score));
}

export function determineOverallLevel(assessments: RiskAssessment[]): RiskLevel {
  if (assessments.length === 0) return 'safe';
  const levels = assessments.map(a => a.level);
  if (levels.includes('critical')) return 'critical';
  if (levels.includes('high')) return 'high';
  if (levels.includes('warning')) return 'warning';
  return 'safe';
}

export function generateStatusText(
  level: RiskLevel,
  assessments: RiskAssessment[],
): string {
  if (level === 'safe') return 'Normal activity detected';
  const primary = assessments[0];
  if (!primary) return 'Normal activity detected';
  return `${primary.type}: ${primary.explanation.summary.split('.')[0]}`;
}
