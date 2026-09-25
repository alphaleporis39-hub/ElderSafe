import React, { useEffect, useState, useCallback } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
import {
  Play,
  CheckCircle,
  ShieldAlert,
  HelpCircle,
  Activity,
  Clock,
  PowerOff,
  Brain,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Phone,
  MapPin,
  X,
  Bell,
  ArrowUpCircle,
} from 'lucide-react';

export const DemoMode: React.FC = () => {
  const {
    safetyStatus,
    statusText,
    lastExplanation,
    lastAssessments,
    elderProfile,
    activeAlertId,
    alertCountdown,
    alerts,
    simulateNormalActivity,
    simulateMissedMedication,
    simulateProlongedInactivity,
    simulateRoutineDeviation,
    simulateFall,
    simulateMultipleAnomalies,
    resetSimulation,
    acknowledgeAlert,
    escalateAlert,
    resolveAlert,
    startCall,
    activeCall,
    clearActiveCall,
  } = useDemo();

  const [showEmergency, setShowEmergency] = useState(false);

  const activeAlert = activeAlertId ? alerts.find(a => a.id === activeAlertId) : null;
  const isAcknowledged = activeAlert?.status === 'acknowledged';
  const isEscalated = activeAlert?.status === 'escalated';

  useEffect(() => {
    if (safetyStatus === 'CRITICAL' && activeAlertId) {
      setShowEmergency(true);
    }
  }, [safetyStatus, activeAlertId]);

  useEffect(() => {
    if (safetyStatus !== 'CRITICAL') {
      setShowEmergency(false);
      // Preserve prior behavior: clear any open demo call when emergency state clears.
      // Real (non-demo) calls are left for the user / provider to complete.
      if (activeCall && activeCall.demo) {
        clearActiveCall();
      }
    }
  }, [safetyStatus, activeCall, clearActiveCall]);

  /** Demo Simulator places calls through the same backend pipeline, always labeled DEMO. */
  const startDemoCall = useCallback((
    contact: { id: string; name: string; relation: string; phone: string; isPrimary: boolean },
    alertId?: string
  ) => {
    void startCall(contact, { mode: 'demo', alertId });
  }, [startCall]);

  const primaryContact =
    elderProfile.emergencyContacts.find(c => c.isPrimary) || elderProfile.emergencyContacts[0];

  // Deduce which simulator is active based on state
  const getActiveSimulator = () => {
    if (safetyStatus === 'CRITICAL') {
      if (statusText.toLowerCase().includes('fall')) return 'fall';
      return 'multiple';
    }
    if (safetyStatus === 'WARNING') {
      if (statusText.toLowerCase().includes('medication') || statusText.toLowerCase().includes('medicine')) return 'medication';
      if (statusText.toLowerCase().includes('inactivity')) return 'inactivity';
      if (statusText.toLowerCase().includes('nighttime') || statusText.toLowerCase().includes('unusual') || statusText.toLowerCase().includes('routine')) return 'deviation';
      return 'deviation';
    }
    return 'normal';
  };

  const activeSim = getActiveSimulator();

  const scenarios = [
    {
      id: 'normal',
      name: 'Simulate Normal Activity',
      description: 'Restores all sensors online, clears pending active alerts, returns status to Normal, and logs a standard check-in.',
      trigger: simulateNormalActivity,
      severity: 'success',
      icon: CheckCircle,
      badgeText: 'Safe State',
      btnStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      id: 'medication',
      name: 'Simulate Missed Medication',
      description: 'Triggers a Warning. Marks morning pill as Missed and raises an active alert for skipped medication.',
      trigger: simulateMissedMedication,
      severity: 'warning',
      icon: Clock,
      badgeText: 'Medication Outage',
      btnStyle: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    {
      id: 'inactivity',
      name: 'Simulate Prolonged Inactivity',
      description: 'Triggers a Warning. Sets Bedroom PIR to Inactive (6 hours) and raises an inactivity notification.',
      trigger: simulateProlongedInactivity,
      severity: 'warning',
      icon: Activity,
      badgeText: 'Inactivity Warning',
      btnStyle: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    {
      id: 'deviation',
      name: 'Simulate Routine Deviation',
      description: 'Injects unusual nighttime kitchen sensor activation and triggers a Warning for routine deviation.',
      trigger: simulateRoutineDeviation,
      severity: 'warning',
      icon: HelpCircle,
      badgeText: 'Baseline Deviancy',
      btnStyle: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    {
      id: 'fall',
      name: 'Simulate Possible Fall',
      description: 'Triggers CRITICAL state. Simulates high-g wearable impact and immobility. Flashes emergency UI.',
      trigger: simulateFall,
      severity: 'danger',
      icon: ShieldAlert,
      badgeText: 'Emergency Fall',
      btnStyle: 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
    },
    {
      id: 'multiple',
      name: 'Simulate Multiple Anomalies',
      description: 'Simulates Gateway/Wearable offline + missed medicine + inactivity. Triggers Critical state.',
      trigger: simulateMultipleAnomalies,
      severity: 'danger',
      icon: PowerOff,
      badgeText: 'Network Failure',
      btnStyle: 'bg-rose-600 hover:bg-rose-700 text-white'
    }
  ];

  // Call overlay is now handled globally by <CallConsole /> in Layout
  // (Demo Simulator always uses mode: 'demo' — clearly labeled DEMO).

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader
        icon={<Play className="text-primary-400" size={20} />}
        title="Demo Mode Simulator"
        description="Test the ElderSafe detection engine by injecting sensor events. Each trigger runs through the full simulation pipeline."
        actions={
          <>
            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 px-3.5 py-2 bg-navy-800 hover:bg-navy-700 text-navy-200 rounded-lg text-sm font-semibold transition-colors border border-navy-700"
              aria-label="Reset simulation to default state"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
            <div className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 border ${
              safetyStatus === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              safetyStatus === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${safetyStatus === 'SAFE' ? 'bg-emerald-500' : safetyStatus === 'WARNING' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} aria-hidden="true" />
              {safetyStatus === 'SAFE' ? 'Status: Normal' : safetyStatus === 'WARNING' ? 'Status: Attention' : 'Status: Critical'}
            </div>
          </>
        }
      />

      {/* Detection Explanation Panel */}
      {lastExplanation && (
        <Card className="border-primary-500/25 bg-primary-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary-500/10 p-2 rounded-md text-primary-400">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Detection Engine Explanation
                </h3>
                <p className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider">
                  Why this alert was triggered
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="bg-navy-950/60 p-4 rounded-lg border border-navy-800">
              <p className="text-sm text-navy-300 leading-relaxed">
                {lastExplanation.summary}
              </p>
              {lastExplanation.confidence !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-navy-500">Confidence:</span>
                  <div className="flex-1 h-2 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        lastExplanation.confidence > 80 ? 'bg-rose-500' :
                        lastExplanation.confidence > 50 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${lastExplanation.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {lastExplanation.confidence}%
                  </span>
                </div>
              )}
            </div>

            {/* Factors */}
            {lastExplanation.factors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-navy-400 uppercase tracking-wider">
                  Detection Factors:
                </h4>
                <div className="space-y-1.5">
                  {lastExplanation.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <ChevronRight size={12} className="text-primary-400 mt-0.5 shrink-0" />
                      <span className="text-navy-300 leading-relaxed">
                        {factor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Assessments Summary */}
            {lastAssessments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-navy-800">
                {lastAssessments.map((a, idx) => (
                  <Badge
                    key={idx}
                    variant={a.level === 'critical' ? 'danger' : a.level === 'warning' ? 'warning' : 'success'}
                    className="text-[10px] font-semibold"
                  >
                    {a.type}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Simulator Scenario Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isActive = activeSim === scenario.id;

          return (
            <Card 
              key={scenario.id} 
              className={`flex flex-col justify-between transition-colors ${
                isActive 
                  ? 'ring-2 ring-primary-500 border-primary-500/40' 
                  : 'border-navy-800 hover:border-navy-700'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className={`p-2 rounded-md border ${
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600'
                      : scenario.severity === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : scenario.severity === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  }`}>
                    <Icon size={17} />
                  </div>
                  
                  {isActive && (
                    <Badge variant={scenario.severity as 'success' | 'warning' | 'danger'} className="font-semibold text-[9px] px-2.5 py-0.5 tracking-wider">
                      ACTIVE STATE
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="mt-4 flex-1 flex flex-col justify-between gap-6">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-white leading-tight">
                    {scenario.name}
                  </h3>
                  <span className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider block">
                    Telemetry Type: {scenario.badgeText}
                  </span>
                  <p className="text-xs text-navy-400 leading-relaxed pt-2">
                    {scenario.description}
                  </p>
                </div>

                <button
                  onClick={scenario.trigger}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors uppercase tracking-wider ${scenario.btnStyle}`}
                  aria-label={`Trigger ${scenario.name} simulation`}
                >
                  Trigger Simulation
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Modal */}
      {showEmergency && activeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-navy-900 rounded-2xl border-2 border-rose-200 dark:border-rose-900/50 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            {/* Demo Banner */}
            <div className="bg-accent-50 dark:bg-accent-950/30 border-b border-accent-200 dark:border-accent-900/40 px-5 py-2 text-center">
              <span className="text-[10px] font-bold text-accent-700 dark:text-accent-400 uppercase tracking-widest">
                DEMO SIMULATION — NOT A REAL EMERGENCY
              </span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-navy-100 dark:border-navy-800">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 dark:bg-rose-950/40 p-2.5 rounded-xl animate-pulse">
                  <AlertTriangle size={22} className="text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-navy-900 dark:text-white">
                    POSSIBLE FALL DETECTED
                  </h2>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Immediate Attention Required
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergency(false)}
                className="p-1.5 rounded-lg hover:bg-navy-100 dark:hover:bg-navy-800 text-navy-400 transition-colors"
                aria-label="Close emergency modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Countdown Banner */}
            {alertCountdown !== null && alertCountdown > 0 && activeAlert.status === 'active' && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-rose-600 dark:text-rose-400 animate-pulse" />
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                    Auto-escalation in {alertCountdown}s
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-24 h-2 bg-rose-200 dark:bg-rose-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 dark:bg-rose-400 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(alertCountdown / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 font-mono">{alertCountdown}s</span>
                </div>
              </div>
            )}

            {/* Escalated Banner */}
            {isEscalated && (
              <div className="mx-5 mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-900/30">
                <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                  ESCALATED — Primary caregiver has been notified.
                </p>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-500 mt-1">
                  Emergency escalation recommended.
                </p>
              </div>
            )}

            {/* Acknowledged Banner */}
            {isAcknowledged && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Acknowledged — Caregiver has been alerted.
                </p>
              </div>
            )}

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Location & Confidence & Time */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-navy-50 dark:bg-navy-800/60 p-3 rounded-xl border border-navy-100 dark:border-navy-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={12} className="text-navy-400" />
                    <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Location</span>
                  </div>
                  <span className="text-sm font-extrabold text-navy-900 dark:text-white">
                    {activeAlert.location || 'Bedroom'}
                  </span>
                </div>
                <div className="bg-navy-50 dark:bg-navy-800/60 p-3 rounded-xl border border-navy-100 dark:border-navy-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldAlert size={12} className="text-navy-400" />
                    <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Confidence</span>
                  </div>
                  <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                    {lastExplanation?.confidence ?? 94}%
                  </span>
                </div>
                <div className="bg-navy-50 dark:bg-navy-800/60 p-3 rounded-xl border border-navy-100 dark:border-navy-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={12} className="text-navy-400" />
                    <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Time</span>
                  </div>
                  <span className="text-sm font-extrabold text-navy-900 dark:text-white">
                    {activeAlert.time}
                  </span>
                </div>
              </div>

              {/* Detected Signals */}
              <div className="bg-rose-50/50 dark:bg-rose-950/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <h4 className="text-xs font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2">
                  Detected Signals
                </h4>
                <div className="space-y-1.5">
                  {lastExplanation?.factors?.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <CheckCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                      <span className="text-navy-700 dark:text-navy-300 font-medium leading-relaxed">
                        {factor}
                      </span>
                    </div>
                  ))}
                  {(!lastExplanation?.factors || lastExplanation.factors.length === 0) && (
                    <>
                      <div className="flex items-start gap-2 text-xs">
                        <CheckCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <span className="text-navy-700 dark:text-navy-300 font-medium">Sudden acceleration spike</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <CheckCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <span className="text-navy-700 dark:text-navy-300 font-medium">Orientation change</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <CheckCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <span className="text-navy-700 dark:text-navy-300 font-medium">Impact detected</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <CheckCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <span className="text-navy-700 dark:text-navy-300 font-medium">Post-impact inactivity</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-navy-50 dark:bg-navy-800/60 p-4 rounded-xl border border-navy-100 dark:border-navy-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                    Emergency Contacts
                  </h4>
                  <span className="text-[9px] font-black text-accent-600 dark:text-accent-400 uppercase tracking-widest">
                    Demo calls
                  </span>
                </div>
                <div className="space-y-2">
                  {elderProfile.emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-navy-800 dark:text-navy-200">{contact.name}</span>
                        <span className="text-xs text-navy-400 dark:text-navy-400 ml-2">{contact.relation}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-navy-500 dark:text-navy-400 font-mono">{contact.phone}</span>
                        <button
                          onClick={() => startDemoCall(contact, activeAlertId || undefined)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold transition-colors"
                          aria-label={`Demo call to ${contact.name}`}
                          title="Places a DEMO call through the same pipeline (not a real phone call)"
                        >
                          <Phone size={11} aria-hidden="true" />
                          Call Contact
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action */}
              <div className="bg-amber-50 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                  Recommended: Check on {elderProfile.name} immediately. If no response, contact emergency services.
                </p>
              </div>
            </div>

            {/* Footer - 4 Action Buttons */}
            <div className="p-5 pt-0 grid grid-cols-2 gap-3" role="group" aria-label="Emergency response actions">
              <button
                onClick={() => {
                  if (primaryContact) startDemoCall(primaryContact, activeAlertId || undefined);
                }}
                className="emergency-btn py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                aria-label="Place a demo call to the primary emergency contact"
              >
                <Phone size={14} aria-hidden="true" />
                Call Contact
              </button>
              <button
                onClick={() => {
                  if (activeAlertId) resolveAlert(activeAlertId);
                  resetSimulation();
                }}
                className="emergency-btn py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                aria-label="Mark the elder as safe and resolve the alert"
              >
                <CheckCircle size={14} aria-hidden="true" />
                Mark Safe
              </button>
              {activeAlert.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      if (activeAlertId) acknowledgeAlert(activeAlertId);
                    }}
                    className="emergency-btn py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    aria-label="Acknowledge the alert"
                  >
                    <Bell size={14} aria-hidden="true" />
                    Acknowledge
                  </button>
                  <button
                    onClick={() => {
                      if (activeAlertId) escalateAlert(activeAlertId);
                    }}
                    className="emergency-btn py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    aria-label="Escalate the alert to primary caregiver"
                  >
                    <ArrowUpCircle size={14} aria-hidden="true" />
                    Escalate
                  </button>
                </>
              )}
              {activeAlert.status !== 'active' && (
                <button
                  onClick={() => {
                    setShowEmergency(false);
                    resetSimulation();
                  }}
                  className="emergency-btn py-2.5 col-span-2 bg-navy-200 dark:bg-navy-700 hover:bg-navy-300 dark:hover:bg-navy-600 text-navy-700 dark:text-navy-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  aria-label="Close and return to simulator"
                >
                  Return to Simulator
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
