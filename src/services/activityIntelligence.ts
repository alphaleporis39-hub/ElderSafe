// ─── Activity Intelligence Service ───────────────────────────────────────────
//
// Tracks historical activity patterns, establishes a personal baseline,
// and generates an explainable Activity Anomaly Score (0-100).
//
// All logic is rule/statistics-based. No ML. No medical diagnosis claims.
// Higher score = more anomalous behavior compared to the personal baseline.
//
// ──────────────────────────────────────────────────────────────────────────────

import type { TimelineEvent, Alert } from '../types';

// Minimal Medication type for this service (defined in DemoContext)
interface Medication {
  id: string;
  name: string;
  time: string;
  schedule: string;
  status: 'Taken' | 'Missed' | 'Pending';
  takenTime?: string;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActivityBaseline {
  /** Average number of activity events per day (computed from timeline history). */
  avgDailyActivityCount: number;
  /** Typical active hours range (startHour, endHour in 24h). */
  activeHoursStart: number;
  activeHoursEnd: number;
  /** Most visited rooms with their relative frequency (0-1). */
  roomDistribution: Record<string, number>;
  /** Average medication adherence rate (0-1). */
  avgMedicationAdherence: number;
  /** Average alert frequency per day. */
  avgDailyAlerts: number;
  /** Whether the baseline has been established from real data. */
  established: boolean;
}

export interface ActivityAnomalyResult {
  /** Overall anomaly score 0-100. Higher = more anomalous. */
  score: number;
  /** Category breakdowns. */
  categories: {
    movement: AnomalyCategory;
    routine: AnomalyCategory;
    medication: AnomalyCategory;
    inactivity: AnomalyCategory;
    fallRisk: AnomalyCategory;
    deviceStatus: AnomalyCategory;
  };
  /** Plain-English explanation of what's anomalous and why. */
  explanation: string;
  /** Specific deviation factors for the UI. */
  factors: string[];
  /** Routine consistency percentage (0-100). */
  routineConsistency: number;
}

export interface AnomalyCategory {
  /** Category-specific anomaly score 0-100. */
  score: number;
  /** Status label. */
  status: 'Normal' | 'Elevated' | 'High' | 'Critical';
  /** One-line explanation. */
  explanation: string;
}

// ─── Default Baseline ───────────────────────────────────────────────────────

export const defaultBaseline: ActivityBaseline = {
  avgDailyActivityCount: 6,
  activeHoursStart: 7,
  activeHoursEnd: 22,
  roomDistribution: {
    'Living Room': 0.35,
    'Bedroom': 0.25,
    'Kitchen': 0.20,
    'Bathroom': 0.12,
    'Entrance': 0.08,
  },
  avgMedicationAdherence: 0.95,
  avgDailyAlerts: 0.1,
  established: false,
};

// ─── Baseline Estimation ────────────────────────────────────────────────────

/**
 * Estimate a baseline from timeline events and medications.
 * In a real system this would use weeks of stored data.
 * For demo purposes, we derive a reasonable baseline from the current state.
 */
export function estimateBaseline(
  timeline: TimelineEvent[],
  medications: Medication[],
  alerts: Alert[],
): ActivityBaseline {
  if (timeline.length === 0) return defaultBaseline;

  // Count activity events
  const activityEvents = timeline.filter(e =>
    e.type === 'movement' || e.type === 'routine'
  );
  const avgDailyActivityCount = Math.max(activityEvents.length, 3);

  // Estimate active hours from timeline timestamps
  const hours = timeline.map(e => {
    const match = e.time.match(/(\d{1,2}):(\d{2})/);
    if (match) return parseInt(match[1], 10);
    return 12;
  });
  const activeHoursStart = Math.max(6, Math.min(...hours) - 1);
  const activeHoursEnd = Math.min(23, Math.max(...hours) + 1);

  // Room distribution
  const roomCounts: Record<string, number> = {};
  const locationEvents = timeline.filter(e => e.type === 'movement');
  for (const e of locationEvents) {
    roomCounts[e.location] = (roomCounts[e.location] || 0) + 1;
  }
  const totalLocation = Object.values(roomCounts).reduce((a, b) => a + b, 0) || 1;
  const roomDistribution: Record<string, number> = {};
  for (const [room, count] of Object.entries(roomCounts)) {
    roomDistribution[room] = count / totalLocation;
  }

  // Medication adherence
  const taken = medications.filter(m => m.status === 'Taken').length;
  const avgMedicationAdherence = medications.length > 0 ? taken / medications.length : 0.95;

  // Alert frequency (estimate daily from total)
  const avgDailyAlerts = Math.min(alerts.length / 7, 2);

  return {
    avgDailyActivityCount,
    activeHoursStart,
    activeHoursEnd,
    roomDistribution,
    avgMedicationAdherence,
    avgDailyAlerts,
    established: timeline.length >= 3,
  };
}

// ─── Anomaly Scoring ────────────────────────────────────────────────────────

/**
 * Compute the full Activity Anomaly Result from current state.
 * Compares current indicators, timeline, medications, and alerts against the baseline.
 */
export function computeActivityAnomaly(
  indicators: {
    movement: string;
    routine: string;
    medication: string;
    fallRisk: string;
    devices: string;
  },
  _timeline: TimelineEvent[],
  _medications: Medication[],
  _alerts: Alert[],
  safetyScore: number,
  baseline: ActivityBaseline = defaultBaseline,
): ActivityAnomalyResult {
  const factors: string[] = [];

  // ─── Movement Category ────────────────────────────────────────────────
  let movementScore = 0;
  let movementStatus: AnomalyCategory['status'] = 'Normal';
  let movementExplanation = 'Normal movement patterns detected.';

  if (indicators.movement === 'None') {
    movementScore = 90;
    movementStatus = 'Critical';
    movementExplanation = 'No movement detected — possible fall or immobility.';
    factors.push('Movement: No movement detected by any sensor');
  } else if (indicators.movement === 'Inactive') {
    movementScore = 65;
    movementStatus = 'High';
    movementExplanation = 'Prolonged inactivity compared to the usual activity pattern.';
    factors.push('Movement: Prolonged inactivity exceeding typical daily patterns');
  } else if (indicators.movement === 'Low') {
    movementScore = 30;
    movementStatus = 'Elevated';
    movementExplanation = 'Lower than usual movement detected.';
    factors.push('Movement: Activity level below the established baseline');
  }

  // ─── Routine Category ─────────────────────────────────────────────────
  let routineScore = 0;
  let routineStatus: AnomalyCategory['status'] = 'Normal';
  let routineExplanation = 'Routine activity matches expected patterns.';

  if (indicators.routine === 'Interrupted') {
    routineScore = 85;
    routineStatus = 'Critical';
    routineExplanation = 'Routine completely interrupted — emergency situation possible.';
    factors.push('Routine: Expected activity windows show no compliance');
  } else if (indicators.routine === 'Deviation') {
    routineScore = 55;
    routineStatus = 'High';
    routineExplanation = 'Activity pattern deviates significantly from the established baseline.';
    factors.push('Routine: Activity timing or location differs from personal baseline');
  }

  // Check timeline for unusual timing
  const recentTimeline = _timeline.slice(0, 5);
  const unusualTimeEvents = recentTimeline.filter((e: TimelineEvent) => {
    const match = e.time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const hour = parseInt(match[1], 10);
    return hour < baseline.activeHoursStart || hour > baseline.activeHoursEnd;
  });
  if (unusualTimeEvents.length > 0 && routineScore < 50) {
    routineScore = Math.min(routineScore + 20, 70);
    routineStatus = 'Elevated';
    routineExplanation = 'Some activity occurred outside the typical active hours.';
    factors.push(`Routine: ${unusualTimeEvents.length} event(s) outside usual active hours (${baseline.activeHoursStart}:00–${baseline.activeHoursEnd}:00)`);
  }

  // ─── Medication Category ──────────────────────────────────────────────
  let medicationScore = 0;
  let medicationStatus: AnomalyCategory['status'] = 'Normal';
  let medicationExplanation = 'Medication schedule is being followed.';

  if (indicators.medication === 'Missed') {
    medicationScore = 70;
    medicationStatus = 'High';
    medicationExplanation = 'Scheduled medication was not taken — deviation from routine.';
    factors.push('Medication: Scheduled dose was not taken during the expected window');
  } else if (indicators.medication === 'Late') {
    medicationScore = 30;
    medicationStatus = 'Elevated';
    medicationExplanation = 'Medication taken later than scheduled.';
    factors.push('Medication: Dose taken outside the optimal time window');
  }

  // ─── Inactivity Category ──────────────────────────────────────────────
  let inactivityScore = 0;
  let inactivityStatus: AnomalyCategory['status'] = 'Normal';
  let inactivityExplanation = 'Activity levels are within normal range.';

  if (indicators.movement === 'Inactive' || indicators.movement === 'None') {
    inactivityScore = indicators.movement === 'None' ? 85 : 60;
    inactivityStatus = indicators.movement === 'None' ? 'Critical' : 'High';
    inactivityExplanation = 'Extended period without detected activity — exceeds the typical pattern.';
    factors.push(`Inactivity: No sensor activity for an extended period (baseline: ~${baseline.avgDailyActivityCount} events/day)`);
  }

  // ─── Fall Risk Category ───────────────────────────────────────────────
  let fallRiskScore = 0;
  let fallRiskStatus: AnomalyCategory['status'] = 'Normal';
  let fallRiskExplanation = 'No fall indicators detected.';

  if (indicators.fallRisk === 'High') {
    fallRiskScore = 95;
    fallRiskStatus = 'Critical';
    fallRiskExplanation = 'Multiple sensor indicators confirm a high-impact event followed by immobility.';
    factors.push('Fall Risk: Accelerometer spike + orientation change + post-impact stillness');
  } else if (indicators.fallRisk === 'Medium') {
    fallRiskScore = 50;
    fallRiskStatus = 'Elevated';
    fallRiskExplanation = 'Some fall-risk indicators detected — monitoring closely.';
    factors.push('Fall Risk: Minor orientation or acceleration anomalies detected');
  }

  // ─── Device Status Category ───────────────────────────────────────────
  let deviceScore = 0;
  let deviceStatus: AnomalyCategory['status'] = 'Normal';
  let deviceExplanation = 'All monitoring devices are online and reporting.';

  if (indicators.devices === 'Critical') {
    deviceScore = 80;
    deviceStatus = 'Critical';
    deviceExplanation = 'Gateway or multiple devices offline — monitoring is degraded.';
    factors.push('Devices: Gateway disconnected or multiple sensors offline');
  } else if (indicators.devices === 'Warning') {
    deviceScore = 40;
    deviceStatus = 'Elevated';
    deviceExplanation = 'One or more devices are not reporting — partial monitoring gap.';
    factors.push('Devices: One or more sensor nodes are offline');
  }

  // ─── Overall Score ────────────────────────────────────────────────────
  const categories = {
    movement: { score: movementScore, status: movementStatus, explanation: movementExplanation },
    routine: { score: routineScore, status: routineStatus, explanation: routineExplanation },
    medication: { score: medicationScore, status: medicationStatus, explanation: medicationExplanation },
    inactivity: { score: inactivityScore, status: inactivityStatus, explanation: inactivityExplanation },
    fallRisk: { score: fallRiskScore, status: fallRiskStatus, explanation: fallRiskExplanation },
    deviceStatus: { score: deviceScore, status: deviceStatus, explanation: deviceExplanation },
  };

  // Weighted average (fall risk and movement weighted highest)
  const weights = {
    movement: 0.25,
    routine: 0.20,
    medication: 0.15,
    inactivity: 0.15,
    fallRisk: 0.20,
    deviceStatus: 0.05,
  };

  const weightedScore =
    movementScore * weights.movement +
    routineScore * weights.routine +
    medicationScore * weights.medication +
    inactivityScore * weights.inactivity +
    fallRiskScore * weights.fallRisk +
    deviceScore * weights.deviceStatus;

  // Blend with the safety score inversion for additional context
  const safetyFactor = Math.max(0, (100 - safetyScore) * 0.3);
  const finalScore = Math.min(100, Math.round((weightedScore * 0.7) + (safetyFactor * 0.3)));

  // Routine consistency = inverse of routine anomaly, clamped to 0-100
  const routineConsistency = Math.max(0, Math.min(100, Math.round(100 - routineScore)));

  // Build explanation
  let explanation = 'All activity patterns are within normal baseline parameters.';
  if (factors.length > 0) {
    explanation = `${factors.length} anomal${factors.length === 1 ? 'y' : 'ies'} detected compared to the personal activity baseline.`;
  }

  return {
    score: finalScore,
    categories,
    explanation,
    factors,
    routineConsistency,
  };
}

/**
 * Generate a human-readable deviation explanation for a specific category.
 */
export function explainDeviation(
  category: AnomalyCategory,
  _baseline: ActivityBaseline,
): string {
  if (category.status === 'Normal') {
    return 'Activity is within the expected baseline range.';
  }

  const severity = category.status === 'Critical' ? 'significant' :
    category.status === 'High' ? 'notable' : 'minor';

  return `${category.explanation} This represents a ${severity} deviation from the established personal baseline.`;
}
