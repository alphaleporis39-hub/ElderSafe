import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { 
  Heart, 
  Phone, 
  Volume2, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  AlertTriangle,
  Pill,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  DoorOpen,
  AlertCircle,
  Check
} from 'lucide-react';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const { 
    elderProfile, 
    safetyStatus, 
    statusText, 
    safetyScore, 
    sensors, 
    timeline, 
    alerts, 
    medications,
    simulateFall,
    toggleMedicationStatus,
    alertCountdown,
    activeAlertId,
    acknowledgeAlert,
    resolveAlert
  } = useDemo();

  const [confirmEmergencyOpen, setConfirmEmergencyOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const primaryContact = elderProfile.emergencyContacts.find(c => c.isPrimary);
  const elderFirstName = elderProfile.name.split(' ')[0];

  // Next scheduled or pending medication
  const nextMedication = medications.find(m => m.status === 'Pending') || null;

  const showActionFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Helper for human-friendly device names and types
  const getDeviceHumanInfo = (sensor: { name: string; location: string }) => {
    const name = sensor.name;
    if (name.includes('Medicine') || name.includes('Box')) {
      return { humanName: 'Medicine Box', type: 'Medication Tracker', icon: Pill, emoji: '💊' };
    }
    if (name.includes('Wearable')) {
      return { humanName: 'ElderSafe Wearable', type: 'Safety Wearable', icon: Heart, emoji: '⌚' };
    }
    if (name.includes('Door')) {
      return { humanName: 'Main Door Sensor', type: 'Door Activity Sensor', icon: DoorOpen, emoji: '🚪' };
    }
    if (name.includes('Gateway') || name.includes('ESP32')) {
      return { humanName: 'Home Gateway', type: 'Gateway Hub', icon: Cpu, emoji: '📡' };
    }
    if (name.includes('Bedroom')) {
      return { humanName: 'Bedroom Sensor', type: 'Room Motion Sensor', icon: Activity, emoji: '🛏️' };
    }
    if (name.includes('Living Room')) {
      return { humanName: 'Living Room Sensor', type: 'Room Motion Sensor', icon: Activity, emoji: '🛋️' };
    }
    if (name.includes('Kitchen')) {
      return { humanName: 'Kitchen Sensor', type: 'Room Motion Sensor', icon: Activity, emoji: '🍳' };
    }
    return { humanName: name, type: 'Passive Sensor', icon: Activity, emoji: '📡' };
  };

  // Group devices into Connected, Needs attention, Offline
  const connectedSensors = sensors.filter(s => (s.status === 'Online' || s.status === 'Active') && (s.battery === undefined || s.battery > 20));
  const attentionSensors = sensors.filter(s => s.status === 'Inactive' || (s.battery !== undefined && s.battery <= 20));
  const offlineSensors = sensors.filter(s => s.status === 'Offline');

  // Human routine activity label mapping
  const formatRoutineActivity = (activity: string) => {
    if (activity.toLowerCase().includes('wake-up')) return 'Wake-up detected';
    if (activity.toLowerCase().includes('kitchen movement')) return 'Kitchen activity';
    if (activity.toLowerCase().includes('medicine box')) return 'Medicine box opened';
    if (activity.toLowerCase().includes('living room')) return 'Living room activity';
    if (activity.toLowerCase().includes('lunch prep')) return 'Lunch activity';
    if (activity.toLowerCase().includes('evening walk') || activity.toLowerCase().includes('re-entry')) return 'Evening walk (front door)';
    return activity;
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      
      {/* Dynamic Action Notification Toast */}
      {actionFeedback && (
        <div 
          role="status"
          className="fixed top-20 right-4 z-50 bg-navy-900 text-white border border-navy-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-medium animate-soft-zoom"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Primary Container: Single-column on mobile in exact order (1-7), responsive grid on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">

        {/* ─────────────────────────────────────────────────────────────
            1. ELDER STATUS (Mobile Order 1, Desktop Top Row Full Width)
           ───────────────────────────────────────────────────────────── */}
        <section 
          aria-labelledby="elder-status-heading"
          className="order-1 lg:order-1 lg:col-span-12"
        >
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-7 border border-navy-100 dark:border-navy-800 shadow-sm space-y-6">
            
            {/* Top Greeting & Elder Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 id="elder-status-heading" className="text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white tracking-tight">
                    Good evening, Caregiver 👋
                  </h1>
                </div>
                <p className="text-base text-navy-600 dark:text-navy-300 font-medium">
                  Here's how {elderFirstName} is doing today.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-100 text-navy-800 dark:bg-navy-800 dark:text-navy-200">
                    <Heart size={12} className="text-primary-500 fill-primary-500" />
                    {elderProfile.name} · {elderProfile.age}
                  </span>
                  <span className="text-xs text-navy-400 dark:text-navy-500 hidden sm:inline">
                    Emergency Contact: {primaryContact?.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                <button 
                  onClick={() => setCurrentPage('profile')}
                  className="px-4 py-2.5 min-h-[44px] border border-navy-200 dark:border-navy-700 rounded-xl text-xs sm:text-sm font-semibold text-navy-700 hover:bg-navy-50 dark:text-navy-200 dark:hover:bg-navy-800 transition-colors focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => setCurrentPage('live')}
                  className="px-4 py-2.5 min-h-[44px] bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300 border border-primary-200/60 dark:border-primary-900/40 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-xl text-xs sm:text-sm font-semibold transition-colors focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  Live Home Blueprint
                </button>
              </div>
            </div>

            {/* Clear Human Status Card & Secondary Safety Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              
              {/* Primary Human Status Callout */}
              <div className="md:col-span-8 bg-navy-50/70 dark:bg-navy-950/50 border border-navy-100 dark:border-navy-800/80 rounded-2xl p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    {safetyStatus === 'SAFE' ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" aria-hidden="true" />
                    ) : safetyStatus === 'WARNING' ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
                    )}
                    <h2 className="text-xl sm:text-2xl font-bold text-navy-900 dark:text-white tracking-tight">
                      {safetyStatus === 'SAFE' 
                        ? `${elderFirstName} appears safe` 
                        : safetyStatus === 'WARNING'
                        ? `Attention recommended for ${elderFirstName}`
                        : `Safety alert for ${elderFirstName}`}
                    </h2>
                  </div>

                  <p className="text-sm sm:text-base text-navy-600 dark:text-navy-300 font-medium leading-relaxed pl-6">
                    {safetyStatus === 'SAFE' 
                      ? 'Normal activity detected recently. Routines and movement patterns are steady.' 
                      : statusText || 'Unusual pattern detected requiring caregiver attention.'}
                  </p>
                </div>

                {alertCountdown !== null && alertCountdown > 0 && activeAlertId && (
                  <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-semibold">
                    <span className="flex items-center gap-2">
                      <Clock size={15} className="animate-pulse" />
                      Auto-escalating to emergency contacts in {alertCountdown}s
                    </span>
                    <button
                      onClick={() => activeAlertId && acknowledgeAlert(activeAlertId)}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold text-xs"
                    >
                      Acknowledge Now
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Safety Score Widget (Calm, Contextualized) */}
              <div className="md:col-span-4 bg-navy-50/70 dark:bg-navy-950/50 border border-navy-100 dark:border-navy-800/80 rounded-2xl p-5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-navy-400 dark:text-navy-400">
                      Overall safety
                    </span>
                    <span className="text-xs font-mono font-bold text-navy-500 dark:text-navy-400 bg-white dark:bg-navy-900 px-2 py-0.5 rounded border border-navy-200 dark:border-navy-700">
                      {safetyScore}/100
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-2xl font-bold text-navy-900 dark:text-white">
                      {safetyScore >= 80 ? 'Normal' : safetyScore >= 60 ? 'Needs Review' : 'Critical'}
                    </span>
                    <Badge variant={safetyScore >= 80 ? 'success' : safetyScore >= 60 ? 'warning' : 'danger'} className="text-[11px]">
                      {safetyScore >= 80 ? 'Steady' : 'Check In'}
                    </Badge>
                  </div>
                </div>

                <p className="text-[11px] text-navy-400 dark:text-navy-500 leading-normal pt-3 border-t border-navy-200/60 dark:border-navy-800">
                  Based on daily activity, movement, and medicine adherence. Not a medical evaluation.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            2. NEXT MEDICATION (Mobile Order 2, Desktop Col 7 Row 2)
           ───────────────────────────────────────────────────────────── */}
        <section 
          aria-labelledby="next-med-heading"
          className="order-2 lg:order-2 lg:col-span-7"
        >
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 sm:p-5 border border-navy-100 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 shrink-0">
                <Pill size={20} aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <span id="next-med-heading" className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 block">
                  Next Medication
                </span>
                {nextMedication ? (
                  <>
                    <h3 className="text-base font-bold text-navy-900 dark:text-white">
                      {nextMedication.name}
                    </h3>
                    <p className="text-xs text-navy-500 dark:text-navy-400 font-medium">
                      Due today at <span className="font-bold text-navy-700 dark:text-navy-200">{nextMedication.time}</span> ({nextMedication.schedule})
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={16} />
                      All medicines taken for today
                    </h3>
                    <p className="text-xs text-navy-500 dark:text-navy-400 font-medium">
                      Next scheduled dose is tomorrow morning at 09:00 AM.
                    </p>
                  </>
                )}
              </div>
            </div>

            {nextMedication && (
              <button
                onClick={() => toggleMedicationStatus(nextMedication.id)}
                className="self-start sm:self-center px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white transition-colors cursor-pointer shadow-sm"
              >
                Mark as Taken
              </button>
            )}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            3. TODAY'S MEDICINES (Mobile Order 3, Desktop Col 7 Row 3)
           ───────────────────────────────────────────────────────────── */}
        <section 
          aria-labelledby="todays-medicines-heading"
          className="order-3 lg:order-4 lg:col-span-7"
        >
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div>
                <CardTitle id="todays-medicines-heading" className="text-lg">
                  <span className="inline-flex items-center gap-2">
                    <Pill size={18} className="text-primary-500" aria-hidden="true" />
                    Today's medicines
                  </span>
                </CardTitle>
                <CardDescription>Daily reminders & confirmation</CardDescription>
              </div>
              <button 
                onClick={() => setCurrentPage('medication')}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                Manage Schedule
              </button>
            </CardHeader>
            
            <CardContent className="space-y-3 pt-1">
              {medications.map((med) => {
                const isTaken = med.status === 'Taken';
                const isMissed = med.status === 'Missed';

                return (
                  <div 
                    key={med.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                      isTaken
                        ? 'bg-emerald-50/40 border-emerald-200/70 dark:bg-emerald-950/15 dark:border-emerald-900/30'
                        : isMissed
                        ? 'bg-rose-50/40 border-rose-200/70 dark:bg-rose-950/15 dark:border-rose-900/30'
                        : 'bg-navy-50/50 border-navy-100 dark:bg-navy-850/60 dark:border-navy-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="mt-0.5 shrink-0">
                        {isTaken ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white" title="Taken">
                            <Check size={14} className="stroke-[3]" />
                          </span>
                        ) : isMissed ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white" title="Missed">
                            <AlertCircle size={14} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/40" title="Scheduled / Due">
                            <Clock size={14} />
                          </span>
                        )}
                      </div>

                      {/* Medicine Info with Human Language */}
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-navy-900 dark:text-white leading-tight">
                          {med.name}
                        </h4>
                        <p className="text-xs font-medium text-navy-500 dark:text-navy-400">
                          {isTaken ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              ✓ Taken at {med.takenTime || med.time}
                            </span>
                          ) : isMissed ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              Missed at {med.time}
                            </span>
                          ) : (
                            <span>
                              {med.time.includes('01:30') || med.time.includes('13:30') 
                                ? `Due at ${med.time}` 
                                : `Scheduled for ${med.time}`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => toggleMedicationStatus(med.id)}
                      className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isTaken
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200'
                          : isMissed
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200'
                          : 'bg-navy-200 text-navy-800 dark:bg-navy-700 dark:text-navy-200 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600'
                      }`}
                      aria-label={`Toggle medication ${med.name}`}
                    >
                      {isTaken ? 'Taken ✓' : isMissed ? 'Mark Taken' : 'Mark Taken'}
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            4. RECENT ALERTS (Mobile Order 4, Desktop Col 5 Row 2)
           ───────────────────────────────────────────────────────────── */}
        <section 
          aria-labelledby="recent-alerts-heading"
          className="order-4 lg:order-3 lg:col-span-5"
        >
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div>
                <CardTitle id="recent-alerts-heading" className="text-lg">
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert size={18} className="text-amber-500" aria-hidden="true" />
                    Recent Alerts
                  </span>
                </CardTitle>
                <CardDescription>Caregiver safety notices</CardDescription>
              </div>
              <button 
                onClick={() => setCurrentPage('alerts')}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                View History
              </button>
            </CardHeader>
            
            <CardContent className="space-y-3 pt-1">
              {activeAlerts.length === 0 ? (
                /* Calm, non-alarming state when all is well */
                <div className="text-center py-6 px-4 bg-navy-50/50 dark:bg-navy-850/40 rounded-2xl border border-dashed border-navy-200 dark:border-navy-800 space-y-2">
                  <div className="inline-flex p-2.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 mx-auto">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white">
                    You're all caught up
                  </h3>
                  <p className="text-xs text-navy-500 dark:text-navy-400 max-w-xs mx-auto">
                    No new safety alerts. All passive sensors report normal patterns.
                  </p>
                </div>
              ) : (
                /* Clear, structured alert explanation */
                activeAlerts.slice(0, 2).map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-4 rounded-xl border bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <AlertTriangle size={14} />
                        {alert.type}
                      </span>
                      <span className="text-[10px] font-mono text-navy-500 dark:text-navy-400">
                        {alert.time}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      <div>
                        <span className="font-bold text-navy-700 dark:text-navy-300">WHAT happened: </span>
                        <span className="text-navy-800 dark:text-navy-200">
                          {alert.whatHappened || alert.description}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-bold text-navy-700 dark:text-navy-300">WHEN it happened: </span>
                        <span className="text-navy-800 dark:text-navy-200">
                          {alert.whenDetected || alert.time}
                        </span>
                      </div>

                      <div className="bg-white/80 dark:bg-navy-900/80 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                        <span className="font-bold text-primary-700 dark:text-primary-400">Recommended action: </span>
                        <span className="text-navy-800 dark:text-navy-200">
                          {alert.recommendedAction || `Call ${elderFirstName} or primary contact to check on well-being.`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-100 hover:bg-navy-200 text-navy-800 dark:bg-navy-800 dark:text-navy-200 cursor-pointer"
                      >
                        Dismiss / Resolved
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            5. TODAY'S ROUTINE (Mobile Order 5, Desktop Col 7 Row 4)
           ───────────────────────────────────────────────────────────── */}
        <section 
          aria-labelledby="todays-routine-heading"
          className="order-5 lg:order-6 lg:col-span-7"
        >
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div>
                <CardTitle id="todays-routine-heading" className="text-lg">
                  <span className="inline-flex items-center gap-2">
                    <Clock size={18} className="text-sky-500" aria-hidden="true" />
                    Today's routine
                  </span>
                </CardTitle>
                <CardDescription>Normal daily activity flow</CardDescription>
              </div>
              <button 
                onClick={() => setCurrentPage('timeline')}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                Full Activity Log
              </button>
            </CardHeader>
            
            <CardContent className="pt-1">
              <div className="relative pl-6 border-l-2 border-navy-100 dark:border-navy-800 space-y-4 py-1">
                {timeline.slice(0, 6).map((item) => (
                  <div key={item.id} className="relative">
                    {/* Activity dot */}
                    <div 
                      className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-navy-900 ${
                        item.severity === 'critical' 
                          ? 'bg-rose-500' 
                          : item.severity === 'warning' 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`} 
                    />
                    
                    <div className="flex justify-between items-start text-sm">
                      <div className="space-y-0.5">
                        <p className="font-bold text-navy-900 dark:text-navy-100 leading-tight">
                          {formatRoutineActivity(item.activity)}
                        </p>
                        <span className="text-[11px] text-navy-400 dark:text-navy-500 font-medium block">
                          {item.location}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-navy-500 dark:text-navy-400 shrink-0 ml-2">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            7. QUICK ACTIONS (Mobile Order 7, Desktop Col 5 Row 4)
           ───────────────────────────────────────────────────────────── */}
        <section 
          aria-labelledby="quick-actions-heading"
          className="order-7 lg:order-5 lg:col-span-5"
        >
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div>
                <CardTitle id="quick-actions-heading" className="text-lg">
                  <span className="inline-flex items-center gap-2">
                    <Heart size={18} className="text-primary-500" aria-hidden="true" />
                    Quick Actions
                  </span>
                </CardTitle>
                <CardDescription>Caregiver check-in shortcuts</CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Action 1: Call elder */}
                <button 
                  onClick={() => {
                    const phone = primaryContact?.phone || '+91 98765 43210';
                    showActionFeedback(`Connecting direct call to ${elderFirstName} (${phone})...`);
                  }}
                  className="p-3 rounded-xl border border-navy-200 dark:border-navy-700/80 hover:bg-navy-50 dark:hover:bg-navy-800/60 transition-colors flex items-center gap-3 text-left min-h-[48px] cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white">Call {elderFirstName}</h4>
                    <span className="text-[11px] text-navy-400">Direct voice call</span>
                  </div>
                </button>

                {/* Action 2: Gateway Speaker */}
                <button 
                  onClick={() => {
                    showActionFeedback(`Gateway announcement broadcast: "Hello ${elderFirstName}, checking in."`);
                  }}
                  className="p-3 rounded-xl border border-navy-200 dark:border-navy-700/80 hover:bg-navy-50 dark:hover:bg-navy-800/60 transition-colors flex items-center gap-3 text-left min-h-[48px] cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 shrink-0">
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white">Gateway Speaker</h4>
                    <span className="text-[11px] text-navy-400">Voice check-in</span>
                  </div>
                </button>

                {/* Action 3: Notify Contacts */}
                <button 
                  onClick={() => {
                    showActionFeedback(`SMS & app alerts sent to ${elderProfile.emergencyContacts.length} emergency contacts.`);
                  }}
                  className="p-3 rounded-xl border border-navy-200 dark:border-navy-700/80 hover:bg-navy-50 dark:hover:bg-navy-800/60 transition-colors flex items-center gap-3 text-left min-h-[48px] cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white">Notify Contacts</h4>
                    <span className="text-[11px] text-navy-400">Family broadcast</span>
                  </div>
                </button>

                {/* Action 4: Dangerous Action - Distinct styling and requires confirmation */}
                <button 
                  onClick={() => setConfirmEmergencyOpen(true)}
                  className="p-3 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors flex items-center gap-3 text-left min-h-[48px] cursor-pointer"
                  title="Simulate fall detection event (requires confirmation)"
                >
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">Emergency Action</h4>
                    <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">Simulate fall event</span>
                  </div>
                </button>

              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            6. SENSOR DEVICES (Mobile Order 6, Desktop Col 12 Lower Section)
           ───────────────────────────────────────────────────────────── */}
        <section 
          aria-labelledby="sensor-devices-heading"
          className="order-6 lg:order-7 lg:col-span-12"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                <div>
                  <CardTitle id="sensor-devices-heading" className="text-lg">
                    <span className="inline-flex items-center gap-2">
                      <Cpu size={18} className="text-primary-500" aria-hidden="true" />
                      Home Devices
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Passive sensors quietly watching over Mohan · {connectedSensors.length} Connected
                  </CardDescription>
                </div>
                <button 
                  onClick={() => setCurrentPage('devices')}
                  className="self-start sm:self-center text-xs font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                >
                  Manage All Devices <ChevronRight size={14} className="inline ml-0.5" />
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-1">
              
              {/* Group 1: Connected Devices */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400">
                    Connected ({connectedSensors.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {connectedSensors.map((sensor) => {
                    const info = getDeviceHumanInfo(sensor);
                    return (
                      <div 
                        key={sensor.id}
                        className="p-3.5 rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/40 dark:bg-navy-850/40 flex flex-col justify-between space-y-3 hover:border-navy-300 dark:hover:border-navy-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg" role="img" aria-label={info.humanName}>
                              {info.emoji}
                            </span>
                            <div>
                              <h5 className="text-sm font-bold text-navy-900 dark:text-white leading-tight">
                                {info.humanName}
                              </h5>
                              <span className="text-[11px] text-navy-500 dark:text-navy-400 font-medium block mt-0.5">
                                {info.type}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-navy-100/70 dark:border-navy-800/70 text-xs">
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                          <span className="text-[11px] text-navy-400 font-medium">
                            Last seen {sensor.lastUpdate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Needs Attention (if any) */}
              {attentionSensors.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Needs Attention ({attentionSensors.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {attentionSensors.map((sensor) => {
                      const info = getDeviceHumanInfo(sensor);
                      return (
                        <div 
                          key={sensor.id}
                          className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{info.emoji}</span>
                            <div>
                              <h5 className="text-sm font-bold text-navy-900 dark:text-white">
                                {info.humanName}
                              </h5>
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">
                                {sensor.battery !== undefined && sensor.battery <= 20 
                                  ? `Low battery (${sensor.battery}%)` 
                                  : 'Inactive signal'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-amber-900/40 text-xs">
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                              Needs attention
                            </span>
                            <span className="text-[11px] text-navy-400">
                              {sensor.lastUpdate}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 3: Offline (if any) */}
              {offlineSensors.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-navy-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400">
                      Offline ({offlineSensors.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {offlineSensors.map((sensor) => {
                      const info = getDeviceHumanInfo(sensor);
                      return (
                        <div 
                          key={sensor.id}
                          className="p-3.5 rounded-xl border border-navy-200 dark:border-navy-800 bg-navy-100/50 dark:bg-navy-900/40 flex flex-col justify-between space-y-3 opacity-75"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{info.emoji}</span>
                            <div>
                              <h5 className="text-sm font-bold text-navy-900 dark:text-white">
                                {info.humanName}
                              </h5>
                              <span className="text-[11px] text-navy-400 font-medium block">
                                {info.type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-navy-200 dark:border-navy-800 text-xs">
                            <span className="text-navy-400 font-semibold text-[11px]">
                              Offline
                            </span>
                            <span className="text-[11px] text-navy-400">
                              {sensor.lastUpdate}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </section>

      </div>

      {/* Confirmation Dialog for Emergency Action */}
      <Dialog
        isOpen={confirmEmergencyOpen}
        onClose={() => setConfirmEmergencyOpen(false)}
        title="Confirm Emergency Simulation"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-3">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300">
                You are about to simulate an emergency event
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                This triggers an immediate high-severity fall alert for Mohan Sharma, begins a 10-second caregiver countdown, and prompts emergency escalation.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setConfirmEmergencyOpen(false)}
              className="px-4 py-2.5 min-h-[40px] rounded-xl border border-navy-200 dark:border-navy-700 text-xs font-semibold text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmEmergencyOpen(false);
                simulateFall();
                showActionFeedback('Simulated emergency fall detection event activated.');
              }}
              className="px-4 py-2.5 min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              Confirm & Simulate Fall
            </button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};
