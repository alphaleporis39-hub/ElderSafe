import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
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
  DoorOpen
} from 'lucide-react';

interface DashboardProps {
  setCurrentPage: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const { 
    elderProfile, 
    safetyStatus, 
    statusText, 
    sensors, 
    timeline, 
    alerts, 
    medications,
    simulateFall,
    toggleMedicationStatus,
    alertCountdown,
    activeAlertId,
    acknowledgeAlert,
    resolveAlert,
    startCall
  } = useDemo();

  const [confirmEmergencyOpen, setConfirmEmergencyOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const primaryContact = elderProfile.emergencyContacts.find(c => c.isPrimary);
  const elderFirstName = elderProfile.name.split(' ')[0];

  const nextMedication = medications.find(m => m.status === 'Pending') || null;

  const medsTaken = medications.filter(m => m.status === 'Taken').length;
  const medsTotal = medications.length;
  const medsMissed = medications.filter(m => m.status === 'Missed').length;
  const medsPending = medications.filter(m => m.status === 'Pending').length;
  const devicesOnline = sensors.filter(s => s.status === 'Online' || s.status === 'Active').length;
  const lastActivity = timeline[0];

  const showActionFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const getDeviceHumanInfo = (sensor: { name: string; location: string }) => {
    const name = sensor.name;
    if (name.includes('Medicine') || name.includes('Box')) {
      return { humanName: 'Medicine Box', type: 'Medication Tracker', icon: Pill };
    }
    if (name.includes('Wearable')) {
      return { humanName: 'ElderSafe Wearable', type: 'Safety Wearable', icon: Heart };
    }
    if (name.includes('Door')) {
      return { humanName: 'Main Door Sensor', type: 'Door Activity Sensor', icon: DoorOpen };
    }
    if (name.includes('Gateway') || name.includes('ESP32')) {
      return { humanName: 'Home Gateway', type: 'Gateway Hub', icon: Cpu };
    }
    if (name.includes('Bedroom')) {
      return { humanName: 'Bedroom Sensor', type: 'Room Motion Sensor', icon: Activity };
    }
    if (name.includes('Living Room')) {
      return { humanName: 'Living Room Sensor', type: 'Room Motion Sensor', icon: Activity };
    }
    if (name.includes('Kitchen')) {
      return { humanName: 'Kitchen Sensor', type: 'Room Motion Sensor', icon: Activity };
    }
    return { humanName: name, type: 'Passive Sensor', icon: Activity };
  };

  const connectedSensors = sensors.filter(s => (s.status === 'Online' || s.status === 'Active') && (s.battery === undefined || s.battery > 20));
  const attentionSensors = sensors.filter(s => s.status === 'Inactive' || (s.battery !== undefined && s.battery <= 20));
  const offlineSensors = sensors.filter(s => s.status === 'Offline');

  const formatRoutineActivity = (activity: string) => {
    const a = activity.toLowerCase();
    if (a.includes('wake-up')) return 'Wake-up detected';
    if (a.includes('kitchen movement')) return 'Kitchen activity';
    if (a.includes('medicine box')) return 'Medicine box opened';
    if (a.includes('living room')) return 'Living room activity';
    if (a.includes('lunch prep')) return 'Lunch activity';
    if (a.includes('evening walk') || a.includes('re-entry')) return 'Evening walk (front door)';
    return activity;
  };

  const statusLabel =
    safetyStatus === 'SAFE' ? 'NORMAL' : safetyStatus === 'WARNING' ? 'ATTENTION' : 'CRITICAL';
  const statusExplanation =
    safetyStatus === 'SAFE'
      ? statusText || 'Normal activity detected recently. No active safety alerts.'
      : statusText || 'Unusual pattern detected requiring caregiver attention.';
  const statusTone =
    safetyStatus === 'SAFE'
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      : safetyStatus === 'WARNING'
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  const statusDot =
    safetyStatus === 'SAFE'
      ? 'bg-emerald-500'
      : safetyStatus === 'WARNING'
      ? 'bg-amber-500 animate-pulse'
      : 'bg-rose-500 animate-pulse';

  return (
    <div className="space-y-5 max-w-full overflow-x-hidden">
      {actionFeedback && (
        <div 
          role="status"
          className="fixed top-16 right-4 z-50 bg-navy-800 text-white border border-navy-700 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2.5 text-sm animate-soft-zoom"
        >
          <CheckCircle2 size={15} className="text-primary-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4">

        {/* 1. CARE OVERVIEW */}
        <section aria-labelledby="care-overview-heading" className="order-1 lg:order-1 lg:col-span-12">
          <div className="bg-navy-900 rounded-xl p-4 sm:p-5 border border-navy-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500">
                  Care Overview
                </p>
                <h1 id="care-overview-heading" className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                  {elderProfile.name}
                  <span className="text-navy-500 font-normal text-sm ml-2">Age {elderProfile.age}</span>
                </h1>
                <p className="text-xs text-navy-400">
                  Emergency contact: {primaryContact?.name || 'Not set'}
                  {primaryContact?.phone ? ` · ${primaryContact.phone}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setCurrentPage('profile')}
                  className="px-3 py-2 min-h-[40px] border border-navy-700 rounded-lg text-xs font-medium text-navy-200 hover:bg-navy-800 transition-colors"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => setCurrentPage('live')}
                  className="px-3 py-2 min-h-[40px] bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Live Monitoring
                </button>
              </div>
            </div>

            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border ${statusTone}`}>
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`} aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Current Status</span>
                  <span className="text-base font-bold tracking-wide">{statusLabel}</span>
                </div>
                <p className="text-sm text-navy-200 leading-relaxed md:pl-5">
                  {statusExplanation}
                </p>
              </div>

              {alertCountdown !== null && alertCountdown > 0 && activeAlertId && (
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2 shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="animate-pulse" />
                    Escalating in {alertCountdown}s
                  </span>
                  <button
                    onClick={() => activeAlertId && acknowledgeAlert(activeAlertId)}
                    className="px-2.5 py-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 font-bold text-[11px]"
                  >
                    Acknowledge
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. CARE SNAPSHOT */}
        <section aria-labelledby="care-snapshot-heading" className="order-2 lg:order-2 lg:col-span-12">
          <div className="bg-navy-900 rounded-xl border border-navy-800 p-4 sm:p-5">
            <h2 id="care-snapshot-heading" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 mb-3">
              Care Snapshot
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-navy-950/60 border border-navy-800">
                <div className="flex items-center gap-1.5 text-navy-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                  <Pill size={12} /> Medication
                </div>
                <div className="text-sm font-semibold text-white">
                  {medsTaken}/{medsTotal} taken
                </div>
                <div className="text-[11px] text-navy-400 mt-0.5">
                  {medsPending > 0 && <span className="text-amber-400">{medsPending} pending</span>}
                  {medsPending > 0 && medsMissed > 0 && ' · '}
                  {medsMissed > 0 && <span className="text-rose-400">{medsMissed} missed</span>}
                  {medsPending === 0 && medsMissed === 0 && 'Schedule on track'}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-950/60 border border-navy-800">
                <div className="flex items-center gap-1.5 text-navy-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                  <Cpu size={12} /> Devices
                </div>
                <div className="text-sm font-semibold text-white">
                  {devicesOnline}/{sensors.length} online
                </div>
                <div className="text-[11px] text-navy-400 mt-0.5">
                  {offlineSensors.length > 0
                    ? <span className="text-amber-400">{offlineSensors.length} offline</span>
                    : 'All reporting'}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-950/60 border border-navy-800">
                <div className="flex items-center gap-1.5 text-navy-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                  <ShieldAlert size={12} /> Active Alerts
                </div>
                <div className={`text-sm font-semibold ${activeAlerts.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeAlerts.length === 0 ? 'None' : `${activeAlerts.length} active`}
                </div>
                <div className="text-[11px] text-navy-400 mt-0.5">
                  {activeAlerts.length === 0 ? 'Nothing needs action' : 'Review required'}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-950/60 border border-navy-800">
                <div className="flex items-center gap-1.5 text-navy-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                  <Clock size={12} /> Last Activity
                </div>
                <div className="text-sm font-semibold text-white font-mono">
                  {lastActivity ? lastActivity.time : '—'}
                </div>
                <div className="text-[11px] text-navy-400 mt-0.5 truncate">
                  {lastActivity ? formatRoutineActivity(lastActivity.activity) : 'No events logged'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. NEXT MEDICATION */}
        <section aria-labelledby="next-med-heading" className="order-3 lg:order-3 lg:col-span-7">
          <div className="bg-navy-900 rounded-xl p-4 border border-navy-800 h-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 rounded-md bg-primary-500/10 text-primary-400 shrink-0 border border-primary-500/20">
                <Pill size={16} aria-hidden="true" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span id="next-med-heading" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500 block">
                  Next Medication
                </span>
                {nextMedication ? (
                  <>
                    <h3 className="text-sm font-semibold text-white truncate">
                      {nextMedication.name}
                    </h3>
                    <p className="text-xs text-navy-400">
                      Due today at <span className="font-semibold text-navy-200">{nextMedication.time}</span> ({nextMedication.schedule}) · Pending
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      All medicines taken for today
                    </h3>
                    <p className="text-xs text-navy-400">
                      Next scheduled dose is tomorrow morning at 09:00 AM.
                    </p>
                  </>
                )}
              </div>
            </div>

            {nextMedication && (
              <button
                onClick={() => toggleMedicationStatus(nextMedication.id)}
                className="self-start sm:self-center px-3.5 py-2 min-h-[36px] rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white transition-colors"
              >
                Mark as Taken
              </button>
            )}
          </div>
        </section>

        {/* 4. RECENT ALERTS */}
        <section aria-labelledby="recent-alerts-heading" className="order-4 lg:order-4 lg:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div>
                <CardTitle id="recent-alerts-heading" className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert size={15} className={activeAlerts.length > 0 ? 'text-rose-400' : 'text-navy-500'} aria-hidden="true" />
                    Alerts
                  </span>
                </CardTitle>
                <CardDescription>
                  {activeAlerts.length === 0 ? 'No active alerts' : `${activeAlerts.length} need attention`}
                </CardDescription>
              </div>
              <button 
                onClick={() => setCurrentPage('alerts')}
                className="text-[11px] font-semibold text-primary-400 hover:text-primary-300"
              >
                View History
              </button>
            </CardHeader>
            
            <CardContent className="pt-1 flex-1">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 px-3 bg-navy-950/50 rounded-lg border border-navy-800 space-y-2">
                  <div className="inline-flex p-2 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-navy-100">No active alerts</h3>
                  <p className="text-xs text-navy-500 max-w-xs mx-auto">
                    Monitoring is running. Sensors report normal patterns.
                  </p>
                </div>
              ) : (
                activeAlerts.slice(0, 2).map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/5 space-y-2 text-xs mb-3 last:mb-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        {alert.type}
                      </span>
                      <span className="text-[10px] font-mono text-navy-500">
                        {alert.time}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <span className="font-semibold text-navy-300">What: </span>
                        <span className="text-navy-200">
                          {alert.whatHappened || alert.description}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-navy-300">When: </span>
                        <span className="text-navy-200">
                          {alert.whenDetected || alert.time}
                        </span>
                      </div>

                      <div className="bg-navy-950/70 p-2.5 rounded-md border border-navy-800">
                        <span className="font-semibold text-primary-400">Action: </span>
                        <span className="text-navy-200">
                          {alert.recommendedAction || `Call ${elderFirstName} or primary contact to check on well-being.`}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-navy-200"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* 5. RECENT ACTIVITY */}
        <section aria-labelledby="recent-activity-heading" className="order-5 lg:order-5 lg:col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div>
                <CardTitle id="recent-activity-heading" className="flex items-center gap-2">
                  <Clock size={15} className="text-navy-500" aria-hidden="true" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Chronological timeline from sensors</CardDescription>
              </div>
              <button 
                onClick={() => setCurrentPage('timeline')}
                className="text-[11px] font-semibold text-primary-400 hover:text-primary-300"
              >
                Full Log
              </button>
            </CardHeader>
            
            <CardContent className="pt-1">
              <div className="relative pl-5 border-l border-navy-800 space-y-4 py-1">
                {timeline.slice(0, 6).map((item) => (
                  <div key={item.id} className="relative">
                    <div 
                      className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-navy-950 ${
                        item.severity === 'critical' 
                          ? 'bg-rose-500' 
                          : item.severity === 'warning' 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`} 
                    />
                    
                    <div className="flex justify-between items-start text-sm gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium text-navy-100 leading-tight">
                          {formatRoutineActivity(item.activity)}
                        </p>
                        <span className="text-[11px] text-navy-500 block">
                          {item.location} · {item.type}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-navy-400 shrink-0">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 6. QUICK ACTIONS */}
        <section aria-labelledby="quick-actions-heading" className="order-6 lg:order-6 lg:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div>
                <CardTitle id="quick-actions-heading" className="flex items-center gap-2">
                  <Heart size={15} className="text-primary-400" aria-hidden="true" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Caregiver check-in shortcuts</CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pt-1 space-y-2.5">
              <button 
                onClick={() => {
                  if (!primaryContact) {
                    showActionFeedback('No emergency contact configured. Add one in Elder Profile.');
                    return;
                  }
                  // Real outbound call via backend → Exotel using the saved primary contact number
                  void startCall(primaryContact, { mode: 'real' });
                }}
                className="w-full p-3 rounded-lg border border-navy-800 hover:bg-navy-800/60 transition-colors flex items-center gap-3 text-left min-h-[44px]"
                title={primaryContact ? `Call ${primaryContact.name} at ${primaryContact.phone}` : 'No primary contact'}
              >
                <div className="p-1.5 rounded-md bg-navy-800 text-navy-300 shrink-0">
                  <Phone size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Call {elderFirstName}</h4>
                  <span className="text-[11px] text-navy-500">
                    {primaryContact
                      ? `Primary contact · ${primaryContact.phone}`
                      : 'No contact configured'}
                  </span>
                </div>
              </button>

              <button 
                onClick={() => {
                  showActionFeedback(`Gateway announcement: "Hello ${elderFirstName}, checking in."`);
                }}
                className="w-full p-3 rounded-lg border border-navy-800 hover:bg-navy-800/60 transition-colors flex items-center gap-3 text-left min-h-[44px]"
              >
                <div className="p-1.5 rounded-md bg-navy-800 text-navy-300 shrink-0">
                  <Volume2 size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Gateway Speaker</h4>
                  <span className="text-[11px] text-navy-500">Voice check-in</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  showActionFeedback(`Alerts sent to ${elderProfile.emergencyContacts.length} emergency contacts.`);
                }}
                className="w-full p-3 rounded-lg border border-navy-800 hover:bg-navy-800/60 transition-colors flex items-center gap-3 text-left min-h-[44px]"
              >
                <div className="p-1.5 rounded-md bg-navy-800 text-navy-300 shrink-0">
                  <Users size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Notify Contacts</h4>
                  <span className="text-[11px] text-navy-500">Family broadcast</span>
                </div>
              </button>

              <button 
                onClick={() => setConfirmEmergencyOpen(true)}
                className="w-full p-3 rounded-lg border border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 transition-colors flex items-center gap-3 text-left min-h-[44px]"
                title="Simulate fall detection event (requires confirmation)"
              >
                <div className="p-1.5 rounded-md bg-rose-500/15 text-rose-400 shrink-0">
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-rose-300">Emergency Action</h4>
                  <span className="text-[11px] text-rose-400/80">Simulate fall event</span>
                </div>
              </button>
            </CardContent>
          </Card>
        </section>

        {/* 7. HOME DEVICES */}
        <section aria-labelledby="sensor-devices-heading" className="order-7 lg:order-7 lg:col-span-12">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                <div>
                  <CardTitle id="sensor-devices-heading" className="flex items-center gap-2">
                    <Cpu size={15} className="text-primary-400" aria-hidden="true" />
                    Home Devices
                  </CardTitle>
                  <CardDescription>
                    {devicesOnline} of {sensors.length} connected · {elderProfile.name}
                  </CardDescription>
                </div>
                <button 
                  onClick={() => setCurrentPage('devices')}
                  className="self-start sm:self-center text-[11px] font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-0.5"
                >
                  Manage Devices <ChevronRight size={12} />
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-1 space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                    Connected ({connectedSensors.length})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {connectedSensors.map((sensor) => {
                    const info = getDeviceHumanInfo(sensor);
                    const DeviceIcon = info.icon;
                    return (
                      <div 
                        key={sensor.id}
                        className="p-3 rounded-lg border border-navy-800 bg-navy-950/50 flex flex-col justify-between gap-2.5 hover:border-navy-700 transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <DeviceIcon size={16} className="text-navy-400 shrink-0 mt-0.5" aria-hidden="true" />
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-white leading-tight truncate">
                              {info.humanName}
                            </h5>
                            <span className="text-[10px] text-navy-500 block mt-0.5">
                              {info.type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-navy-800/80 text-[10px]">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                          <span className="text-navy-500">
                            {sensor.lastUpdate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {attentionSensors.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                      Needs Attention ({attentionSensors.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {attentionSensors.map((sensor) => {
                      const info = getDeviceHumanInfo(sensor);
                      const DeviceIcon = info.icon;
                      return (
                        <div 
                          key={sensor.id}
                          className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex flex-col justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-2.5">
                            <DeviceIcon size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-white">{info.humanName}</h5>
                              <span className="text-[10px] text-amber-400 block">
                                {sensor.battery !== undefined && sensor.battery <= 20 
                                  ? `Low battery (${sensor.battery}%)` 
                                  : 'Inactive signal'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[10px]">
                            <span className="text-amber-400 font-medium">Needs attention</span>
                            <span className="text-navy-500">{sensor.lastUpdate}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {offlineSensors.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-navy-500" />
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                      Offline ({offlineSensors.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {offlineSensors.map((sensor) => {
                      const info = getDeviceHumanInfo(sensor);
                      const DeviceIcon = info.icon;
                      return (
                        <div 
                          key={sensor.id}
                          className="p-3 rounded-lg border border-navy-800 bg-navy-950/40 flex flex-col justify-between gap-2.5 opacity-70"
                        >
                          <div className="flex items-start gap-2.5">
                            <DeviceIcon size={16} className="text-navy-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-navy-300">{info.humanName}</h5>
                              <span className="text-[10px] text-navy-600 block">{info.type}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-navy-800 text-[10px]">
                            <span className="text-navy-500 font-medium">Offline</span>
                            <span className="text-navy-600">{sensor.lastUpdate}</span>
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

      <Dialog
        isOpen={confirmEmergencyOpen}
        onClose={() => setConfirmEmergencyOpen(false)}
        title="Confirm Emergency Simulation"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-rose-300">
                Simulate an emergency event
              </p>
              <p className="text-xs text-navy-300 leading-relaxed">
                Triggers a high-severity fall alert for {elderProfile.name}, starts a caregiver countdown, and may prompt emergency escalation.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setConfirmEmergencyOpen(false)}
              className="px-4 py-2 min-h-[40px] rounded-lg border border-navy-700 text-xs font-medium text-navy-200 hover:bg-navy-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmEmergencyOpen(false);
                simulateFall();
                showActionFeedback('Simulated fall detection event activated.');
              }}
              className="px-4 py-2 min-h-[40px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
            >
              Confirm & Simulate
            </button>
          </div>
        </div>
      </Dialog>

    </div>
  );
};
