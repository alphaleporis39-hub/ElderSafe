import type {
  RiskAssessment,
  RiskLevel,
  Alert,
  TimelineEvent,
  DetectionExplanation,
} from '../types';

// ─── Alert Engine ────────────────────────────────────────────────────────────
//
// The alert engine converts RiskAssessment objects into:
// 1. Alert objects (for the Alerts page)
// 2. TimelineEvent objects (for the Activity Timeline)
// 3. DetectionExplanation objects (for explainable UI)
//
// This separation keeps detection logic in riskEngine.ts
// and presentation/alerting logic here.

// ─── Severity Mapping ────────────────────────────────────────────────────────

function riskToAlertSeverity(level: RiskLevel): 'safe' | 'warning' | 'critical' {
  switch (level) {
    case 'critical':
    case 'high':
      return 'critical';
    case 'warning':
      return 'warning';
    case 'safe':
    default:
      return 'safe';
  }
}

// ─── Alert Creation ──────────────────────────────────────────────────────────

export function createAlertFromAssessment(assessment: RiskAssessment): Alert {
  const severity = riskToAlertSeverity(assessment.level);
  const timeStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Build a detailed description including the explanation factors
  const description = buildAlertDescription(assessment);

  // Phase 6: Explainable alert fields
  const explainable = buildExplainableFields(assessment);

  return {
    id: assessment.id,
    type: assessment.type,
    severity,
    time: timeStr,
    location: assessment.location,
    description,
    status: 'active',
    ...explainable,
  };
}

function buildAlertDescription(assessment: RiskAssessment): string {
  const { explanation } = assessment;
  const factorsText = explanation.factors.length > 0
    ? ` Because: ${explanation.factors.join('; ')}.`
    : '';
  return `${explanation.summary}${factorsText}`;
}

// ─── Explainable Alert Fields (Phase 6) ─────────────────────────────────────

function buildExplainableFields(assessment: RiskAssessment): {
  whatHappened?: string;
  whenDetected?: string;
  whereLocated?: string;
  whyTriggered?: string;
  recommendedAction?: string;
} {
  const { explanation, type, location } = assessment;
  const timeStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  let whatHappened = '';
  let whyTriggered = '';
  let recommendedAction = '';

  switch (type) {
    case 'Possible Fall Detected':
      whatHappened = `A possible fall event was detected with ${explanation.confidence || 0}% confidence based on accelerometer and gyroscope sensor data.`;
      whyTriggered = explanation.factors.length > 0
        ? explanation.factors.join('; ')
        : 'Multiple sensor indicators confirmed a high-impact event followed by immobility.';
      recommendedAction = 'Call the elder immediately to verify safety. If no response, escalate to emergency services and primary caregiver.';
      break;
    case 'Routine Deviation':
      whatHappened = `The elder\'s activity pattern deviated from the established daily routine baseline.`;
      whyTriggered = explanation.factors.length > 0
        ? explanation.factors.join('; ')
        : 'Activity timing or location differs from the personal baseline.';
      recommendedAction = 'Check if the elder is okay. Review recent timeline events for context. Contact if unusual pattern persists.';
      break;
    case 'Prolonged Inactivity':
      whatHappened = `No movement or activity has been detected for an extended period beyond the normal threshold.`;
      whyTriggered = explanation.factors.length > 0
        ? explanation.factors.join('; ')
        : 'All motion sensors report no activity and accelerometer shows minimal movement.';
      recommendedAction = 'Attempt to contact the elder. Check if the wearable is functioning. Escalate if no response within 5 minutes.';
      break;
    case 'Missed Medication':
      whatHappened = `A scheduled medication dose was not taken during the expected time window.`;
      whyTriggered = explanation.factors.length > 0
        ? explanation.factors.join('; ')
        : 'Medicine box sensor did not detect opening during the medication window.';
      recommendedAction = 'Remind the elder about the missed medication. If not taken within 30 minutes, follow up with a call.';
      break;
    case 'Gateway Disconnected':
      whatHappened = `The ESP32 gateway has gone offline, causing all connected sensors to stop reporting.`;
      whyTriggered = 'Gateway heartbeat lost. All sensors lost connectivity.';
      recommendedAction = 'Check the gateway power and Wi-Fi connection. Monitoring is suspended until the gateway reconnects.';
      break;
    default:
      whatHappened = explanation.summary;
      whyTriggered = explanation.factors.join('; ');
      recommendedAction = 'Review the alert details and check on the elder if the pattern seems unusual.';
  }

  return {
    whatHappened,
    whenDetected: `Detected at ${timeStr}`,
    whereLocated: location !== 'System' ? `Location: ${location}` : undefined,
    whyTriggered,
    recommendedAction,
  };
}

// ─── Timeline Event Creation ─────────────────────────────────────────────────

export function createTimelineFromAssessment(assessment: RiskAssessment): TimelineEvent {
  const timeStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return {
    id: `te-${assessment.id}`,
    time: timeStr,
    activity: assessment.timelineEvent.activity,
    location: assessment.timelineEvent.location,
    type: assessment.timelineEvent.type,
    severity: assessment.timelineEvent.severity,
  };
}

// ─── Batch Processing ────────────────────────────────────────────────────────

export interface AlertEngineResult {
  alerts: Alert[];
  timelineEvents: TimelineEvent[];
  explanations: DetectionExplanation[];
  overallLevel: RiskLevel;
  statusText: string;
  safetyScoreReduction: number;
}

export function processAssessments(
  assessments: RiskAssessment[],
): AlertEngineResult {
  const alerts: Alert[] = [];
  const timelineEvents: TimelineEvent[] = [];
  const explanations: DetectionExplanation[] = [];
  let totalScoreReduction = 0;

  for (const assessment of assessments) {
    // Create alert
    alerts.push(createAlertFromAssessment(assessment));

    // Create timeline event
    timelineEvents.push(createTimelineFromAssessment(assessment));

    // Collect explanation
    explanations.push(assessment.explanation);

    // Accumulate score reduction
    totalScoreReduction += assessment.scoreImpact;
  }

  // Determine overall level
  let overallLevel: RiskLevel = 'safe';
  if (assessments.length > 0) {
    const levels = assessments.map(a => a.level);
    if (levels.includes('critical')) overallLevel = 'critical';
    else if (levels.includes('high')) overallLevel = 'high';
    else if (levels.includes('warning')) overallLevel = 'warning';
  }

  // Generate status text
  const statusText = generateStatusTextFromAssessments(assessments, overallLevel);

  return {
    alerts,
    timelineEvents,
    explanations,
    overallLevel,
    statusText,
    safetyScoreReduction: totalScoreReduction,
  };
}

function generateStatusTextFromAssessments(
  assessments: RiskAssessment[],
  level: RiskLevel,
): string {
  if (level === 'safe') return 'Normal activity detected';
  if (assessments.length === 0) return 'Normal activity detected';

  const primary = assessments[0];
  switch (level) {
    case 'critical':
      return `CRITICAL: ${primary.explanation.summary.split('.')[0]}`;
    case 'high':
      return `HIGH: ${primary.explanation.summary.split('.')[0]}`;
    case 'warning':
      return `WARNING: ${primary.explanation.summary.split('.')[0]}`;
    default:
      return 'Normal activity detected';
  }
}

// ─── Indicator Calculator ────────────────────────────────────────────────────

export interface IndicatorState {
  movement: string;
  routine: string;
  medication: string;
  fallRisk: string;
  devices: string;
}

export function calculateIndicators(
  assessments: RiskAssessment[],
  currentIndicators: IndicatorState,
): IndicatorState {
  const indicators = { ...currentIndicators };

  for (const a of assessments) {
    switch (a.type) {
      case 'Possible Fall Detected':
        indicators.movement = 'None';
        indicators.fallRisk = 'High';
        indicators.routine = 'Interrupted';
        break;
      case 'Prolonged Inactivity':
        indicators.movement = 'Inactive';
        indicators.routine = 'Deviation';
        break;
      case 'Routine Deviation':
        indicators.routine = 'Deviation';
        break;
      case 'Missed Medication':
        indicators.medication = 'Missed';
        indicators.routine = 'Deviation';
        break;
    }
  }

  // Check sensor updates for device status
  const hasSensorOffline = assessments.some(a =>
    a.sensorUpdates.some(s => s.status === 'Offline')
  );
  if (hasSensorOffline) {
    indicators.devices = 'Warning';
  }

  return indicators;
}
