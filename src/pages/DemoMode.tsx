import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
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
  PhoneOff,
  MapPin,
  X,
  Bell,
  ArrowUpCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from 'lucide-react';

export const DemoMode: React.FC = () => {
  const {
    safetyStatus,
    safetyScore,
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
  } = useDemo();

  const [showEmergency, setShowEmergency] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [callTimer, setCallTimer] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [callSpeaker, setCallSpeaker] = useState(true);
  const callIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      // Also end any active call by clearing interval directly
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
        callIntervalRef.current = null;
      }
      setCallActive(false);
      setCallStatus('ended');
      setCallTimer(0);
    }
  }, [safetyStatus]);

  // Cleanup call interval on unmount
  useEffect(() => {
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, []);

  const startCall = useCallback(() => {
    setCallActive(true);
    setCallStatus('calling');
    setCallTimer(0);
    setCallMuted(false);
    setCallSpeaker(true);

    // Simulate connection after 2 seconds
    setTimeout(() => {
      setCallStatus('connected');
    }, 2000);
  }, []);

  const endCall = useCallback(() => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current);
      callIntervalRef.current = null;
    }
    setCallActive(false);
    setCallStatus('ended');
    setCallTimer(0);
  }, []);

  // Call timer effect
  useEffect(() => {
    if (callActive && callStatus === 'connected') {
      callIntervalRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
      return () => {
        if (callIntervalRef.current) clearInterval(callIntervalRef.current);
      };
    }
  }, [callActive, callStatus]);

  const formatCallTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
      description: 'Restores all sensors online, clears pending active alerts, sets score to 96, and logs a standard check-in.',
      trigger: simulateNormalActivity,
      severity: 'success',
      icon: CheckCircle,
      badgeText: 'Safe State',
      btnStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    },
    {
      id: 'medication',
      name: 'Simulate Missed Medication',
      description: 'Triggers a Warning. Marks morning pill as Missed, drops score, and raises an active alert for skipped medication.',
      trigger: simulateMissedMedication,
      severity: 'warning',
      icon: Clock,
      badgeText: 'Medication Outage',
      btnStyle: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    {
      id: 'inactivity',
      name: 'Simulate Prolonged Inactivity',
      description: 'Triggers a Warning. Sets Bedroom PIR to Inactive (6 hours), drops score, and raises an inactivity notification.',
      trigger: simulateProlongedInactivity,
      severity: 'warning',
      icon: Activity,
      badgeText: 'Inactivity Warning',
      btnStyle: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    {
      id: 'deviation',
      name: 'Simulate Routine Deviation',
      description: 'Injects unusual nighttime kitchen sensor activation. Triggers a Warning and reduces the safety score.',
      trigger: simulateRoutineDeviation,
      severity: 'warning',
      icon: HelpCircle,
      badgeText: 'Baseline Deviancy',
      btnStyle: 'bg-amber-500 hover:bg-amber-600 text-white'
    },
    {
      id: 'fall',
      name: 'Simulate Possible Fall',
      description: 'Triggers CRITICAL state. Simulates high-g wearable impact and immobility. Score drops. Flashes emergency UI.',
      trigger: simulateFall,
      severity: 'danger',
      icon: ShieldAlert,
      badgeText: 'Emergency Fall',
      btnStyle: 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
    },
    {
      id: 'multiple',
      name: 'Simulate Multiple Anomalies',
      description: 'Simulates Gateway/Wearable offline + missed medicine + inactivity. Drops score significantly. Triggers Critical state.',
      trigger: simulateMultipleAnomalies,
      severity: 'danger',
      icon: PowerOff,
      badgeText: 'Network Failure',
      btnStyle: 'bg-rose-600 hover:bg-rose-700 text-white'
    }
  ];

  // ─── Call Simulation Overlay ──────────────────────────────────────────────
  if (callActive) {
    return (
      <div className="fixed inset-0 z-[60] bg-navy-950 flex flex-col items-center justify-between p-6 sm:p-10 animate-fade-in">
        {/* Demo Label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-accent-950/60 border border-accent-800/40 text-accent-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          DEMO SIMULATION — NOT A REAL CALL
        </div>

        {/* Top Section - Status */}
        <div className="flex flex-col items-center gap-4 pt-8">
          {/* Pulsing avatar */}
          <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ${callStatus === 'calling' ? 'animate-pulse' : ''}`}>
            <span className="text-3xl font-black text-white">MS</span>
            {callStatus === 'connected' && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-navy-950 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {callStatus === 'calling' ? 'Calling Elder' : callStatus === 'connected' ? 'Connected' : 'Call Ended'}
            </h2>
            <p className="text-lg font-semibold text-primary-400">{elderProfile.name}</p>
            {callStatus === 'calling' && (
              <p className="text-sm text-navy-400 animate-pulse mt-2">Ringing...</p>
            )}
            {callStatus === 'connected' && (
              <p className="text-sm font-mono font-bold text-emerald-400 mt-2">{formatCallTime(callTimer)}</p>
            )}
          </div>
        </div>

        {/* Middle - Call Info */}
        <div className="flex flex-col items-center gap-3">
          {callStatus === 'calling' && (
            <div className="flex items-center gap-2 text-navy-400 text-xs font-bold">
              <div className="flex gap-1">
                <span className="w-1.5 h-4 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-6 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-4 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1.5 h-6 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                <span className="w-1.5 h-4 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          )}
          {callStatus === 'connected' && (
            <div className="text-center text-xs text-navy-500 font-semibold">
              Simulated audio channel — no real connection established
            </div>
          )}
        </div>

        {/* Bottom - Controls */}
        <div className="flex flex-col items-center gap-6 pb-8 w-full max-w-sm">
          {/* Control buttons */}
          {callStatus === 'connected' && (
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setCallMuted(!callMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  callMuted
                    ? 'bg-rose-600 text-white'
                    : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                }`}
                aria-label={callMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {callMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                onClick={() => setCallSpeaker(!callSpeaker)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  !callSpeaker
                    ? 'bg-rose-600 text-white'
                    : 'bg-navy-800 text-navy-300 hover:bg-navy-700'
                }`}
                aria-label={callSpeaker ? 'Turn off speaker' : 'Turn on speaker'}
              >
                {callSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
              </button>
            </div>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-base font-extrabold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-900/30"
            aria-label="End call"
          >
            <PhoneOff size={20} />
            End Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Play className="text-primary-500" size={28} />
            Demo Mode Simulator
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Test the ElderSafe detection engine by injecting sensor events. Each trigger runs through the full simulation pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-4 py-2 bg-navy-100 dark:bg-navy-800 hover:bg-navy-200 dark:hover:bg-navy-700 text-navy-700 dark:text-navy-200 rounded-xl text-sm font-bold transition-colors border border-navy-200 dark:border-navy-700"
            aria-label="Reset simulation to default state"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </button>
          <div className={`px-4 py-2 rounded-xl text-sm font-extrabold ${
            safetyStatus === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            safetyStatus === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            Score: {safetyScore}/100
          </div>
        </div>
      </div>

      {/* Detection Explanation Panel */}
      {lastExplanation && (
        <Card className="border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-950/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 dark:bg-primary-950 p-2.5 rounded-xl text-primary-500 dark:text-primary-400">
                <Brain size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-navy-900 dark:text-white">
                  Detection Engine Explanation
                </h3>
                <p className="text-[10px] text-navy-450 dark:text-navy-400 font-bold uppercase tracking-wider">
                  Why this alert was triggered
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-navy-105 dark:border-navy-800">
              <p className="text-sm font-semibold text-navy-700 dark:text-navy-300 leading-relaxed">
                {lastExplanation.summary}
              </p>
              {lastExplanation.confidence !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-navy-500">Confidence:</span>
                  <div className="flex-1 h-2 bg-navy-100 dark:bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        lastExplanation.confidence > 80 ? 'bg-rose-500' :
                        lastExplanation.confidence > 50 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${lastExplanation.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-extrabold text-navy-900 dark:text-white">
                    {lastExplanation.confidence}%
                  </span>
                </div>
              )}
            </div>

            {/* Factors */}
            {lastExplanation.factors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-navy-500 dark:text-navy-400 uppercase tracking-wider">
                  Detection Factors:
                </h4>
                <div className="space-y-1.5">
                  {lastExplanation.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <ChevronRight size={12} className="text-primary-500 mt-0.5 shrink-0" />
                      <span className="text-navy-600 dark:text-navy-400 font-medium leading-relaxed">
                        {factor}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Assessments Summary */}
            {lastAssessments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-navy-105 dark:border-navy-800">
                {lastAssessments.map((a, idx) => (
                  <Badge
                    key={idx}
                    variant={a.level === 'critical' ? 'danger' : a.level === 'warning' ? 'warning' : 'success'}
                    className="text-[10px] font-bold"
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
              className={`flex flex-col justify-between transition-all duration-300 ${
                isActive 
                  ? 'ring-4 ring-primary-500 border-transparent shadow-xl translate-y-[-4px]' 
                  : 'border-navy-200 hover:shadow-md'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start w-full">
                  <div className={`p-2.5 rounded-xl border ${
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600'
                      : scenario.severity === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-955/20'
                      : scenario.severity === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-955/20'
                      : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-955/20'
                  }`}>
                    <Icon size={20} className="stroke-[2.5]" />
                  </div>
                  
                  {isActive && (
                    <Badge variant={scenario.severity as 'success' | 'warning' | 'danger'} className="font-extrabold text-[9px] px-2.5 py-0.5 tracking-wider animate-pulse">
                      ACTIVE STATE
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="mt-4 flex-1 flex flex-col justify-between gap-6">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-navy-900 dark:text-white leading-tight">
                    {scenario.name}
                  </h3>
                  <span className="text-[10px] text-navy-400 font-bold uppercase tracking-wider block">
                    Telemetry Type: {scenario.badgeText}
                  </span>
                  <p className="text-xs font-semibold text-navy-655 dark:text-navy-400 leading-relaxed pt-2">
                    {scenario.description}
                  </p>
                </div>

                <button
                  onClick={scenario.trigger}
                  className={`w-full py-3 rounded-xl text-sm font-extrabold shadow-sm transition-all uppercase tracking-wider ${scenario.btnStyle}`}
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
                <h4 className="text-xs font-extrabold text-navy-500 dark:text-navy-400 uppercase tracking-wider mb-2">
                  Emergency Contacts
                </h4>
                <div className="space-y-2">
                  {elderProfile.emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-navy-800 dark:text-navy-200">{contact.name}</span>
                        <span className="text-xs text-navy-400 dark:text-navy-400 ml-2">{contact.relation}</span>
                      </div>
                      <span className="text-xs font-bold text-navy-500 dark:text-navy-400 font-mono">{contact.phone}</span>
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
                onClick={startCall}
                className="emergency-btn py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                aria-label="Call the elder to check on their status"
              >
                <Phone size={14} aria-hidden="true" />
                Call Elder
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
