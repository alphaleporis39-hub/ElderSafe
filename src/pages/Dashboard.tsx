import React from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  Heart, 
  Phone, 
  Volume2, 
  Activity, 
  Battery, 
  Cpu, 
  ShieldAlert, 
  AlertTriangle,
  Pill,
  ChevronRight,
  Clock,
  ArrowUpCircle,
  Shield,
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
    indicators, 
    sensors, 
    timeline, 
    alerts, 
    medications,
    simulateFall,
    toggleMedicationStatus,
    alertCountdown,
    activeAlertId,
  } = useDemo();

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const primaryContact = elderProfile.emergencyContacts.find(c => c.isPrimary);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE': return 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30';
      case 'WARNING': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30';
      case 'CRITICAL': return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30';
      default: return 'text-navy-500 bg-navy-50 border-navy-200 dark:bg-navy-800 dark:border-navy-700';
    }
  };

  const getIndicatorBadgeColor = (val: string) => {
    const valUpper = val.toUpperCase();
    if (valUpper === 'NORMAL' || valUpper === 'TAKEN' || valUpper === 'ONLINE' || valUpper === 'LOW') {
      return 'success';
    }
    if (valUpper === 'DEVIATION' || valUpper === 'MISSED' || valUpper === 'WARNING' || valUpper === 'MEDIUM' || valUpper === 'INACTIVE') {
      return 'warning';
    }
    if (valUpper === 'HIGH' || valUpper === 'CRITICAL' || valUpper === 'OFFLINE' || valUpper === 'NONE' || valUpper === 'INTERRUPTED') {
      return 'danger';
    }
    return 'default';
  };

  const radius = 50;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safetyScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-rose-600';
  };

  const getSensorIcon = (name: string) => {
    if (name.includes('Wearable')) return Heart;
    if (name.includes('Gateway')) return Cpu;
    if (name.includes('Door')) return ChevronRight;
    if (name.includes('Box') || name.includes('Medicine')) return Pill;
    return Activity;
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-100 dark:border-navy-800 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            Good evening, Caregiver
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Currently monitoring <span className="text-primary-500 dark:text-primary-400 font-semibold">{elderProfile.name}</span> ({elderProfile.age} years old)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage('profile')}
            className="px-4 py-2 border border-navy-200 dark:border-navy-700 rounded-xl text-sm font-semibold text-navy-700 hover:bg-navy-50 dark:text-navy-300 dark:hover:bg-navy-800 transition-colors"
          >
            View Profile
          </button>
          <button 
            onClick={() => setCurrentPage('demo')}
            className="px-4 py-2 bg-accent-50 hover:bg-accent-100 dark:bg-accent-950/20 text-accent-700 dark:text-accent-300 border border-accent-200/50 rounded-xl text-sm font-semibold transition-colors"
          >
            Open Simulator Panel
          </button>
        </div>
      </div>

      {/* Primary Dashboard Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Active Status Card */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle className="text-xl">
                <span className="inline-flex items-center gap-2">
                  <Shield size={18} className="text-primary-500" />
                  Safety Status
                </span>
              </CardTitle>
              <CardDescription>Live telemetry assessment</CardDescription>
            </div>
            <Badge variant={safetyStatus === 'SAFE' ? 'success' : safetyStatus === 'WARNING' ? 'warning' : 'danger'}>
              Active State
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center py-6 text-center">
            <div className={`px-8 py-5 rounded-2xl border-2 flex flex-col items-center gap-2 max-w-md w-full ${getStatusColor(safetyStatus)}`}>
              <span className="text-3xl font-black tracking-wider uppercase">
                {safetyStatus === 'SAFE' ? '\u{1F7E2} SAFE' : safetyStatus === 'WARNING' ? '\u{1F7E1} WARNING' : '\u{1F534} CRITICAL'}
              </span>
              <span className="text-base font-bold leading-normal mt-1">
                {statusText}
              </span>
            </div>
            {activeAlerts.length > 0 && (
              <p className="text-rose-600 dark:text-rose-400 font-bold text-sm mt-4 animate-pulse flex items-center gap-1.5">
                <ShieldAlert size={16} />
                {activeAlerts.length} active emergency alert{activeAlerts.length > 1 ? 's' : ''} require{activeAlerts.length === 1 ? 's' : ''} your attention!
              </p>
            )}
            {alertCountdown !== null && alertCountdown > 0 && activeAlertId && (
              <div className="mt-4 flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/30">
                <Clock size={16} className="text-rose-600 animate-pulse" />
                <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Auto-escalation in {alertCountdown}s
                </span>
                <div className="flex-1 h-2 bg-rose-200 dark:bg-rose-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(alertCountdown / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-6 pt-0 border-t border-navy-50 dark:border-navy-800 flex justify-between items-center bg-navy-50/50 dark:bg-navy-800/30 rounded-b-2xl">
            <span className="text-xs text-navy-400 font-medium">Last activity detected: Just now</span>
            <button 
              onClick={() => setCurrentPage('live')}
              className="text-primary-500 hover:text-primary-600 dark:text-primary-400 font-bold text-sm flex items-center gap-1"
            >
              Open Live Home Blueprint <ChevronRight size={16} />
            </button>
          </div>
        </Card>

        {/* Safety Score Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-xl">
                <span className="inline-flex items-center gap-2">
                  <Activity size={18} className="text-accent-500" />
                  Safety Score
                </span>
              </CardTitle>
              <CardDescription>Composite sensor health</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pb-4">
            <div className="relative flex items-center justify-center">
              <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                <circle
                  className="stroke-navy-100 dark:stroke-navy-800"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  className={`transition-all duration-500 ease-in-out ${getScoreColor(safetyScore)}`}
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-navy-900 dark:text-white">{safetyScore}</span>
                <span className="text-xs text-navy-400 font-bold uppercase tracking-widest">/ 100</span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-2.5">
              {Object.entries(indicators).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center py-1 border-b border-navy-50 dark:border-navy-800 text-sm">
                  <span className="capitalize font-semibold text-navy-600 dark:text-navy-400">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <Badge variant={getIndicatorBadgeColor(val)} className="text-xs font-bold px-2 py-0.5">
                    {val}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="bg-navy-100 dark:bg-navy-800 rounded-xl p-3 text-center mt-5 w-full">
              <span className="text-[10px] font-bold text-navy-500 dark:text-navy-400 leading-tight block">
                NOTICE: This is an activity/routine safety score, NOT a medical evaluation or diagnostic score.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensor Cards Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-navy-900 dark:text-white uppercase tracking-wider pl-1">
            <span className="inline-flex items-center gap-2">
              <Cpu size={16} className="text-primary-500" />
              Sensor Devices Status
            </span>
          </h2>
          <button 
            onClick={() => setCurrentPage('devices')}
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 font-bold text-sm flex items-center gap-1"
          >
            Manage Sensors <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {sensors.slice(0, 6).map((sensor) => {
            const Icon = getSensorIcon(sensor.name);
            const isOffline = sensor.status === 'Offline';
            const isActive = sensor.status === 'Active';
            const isInactive = sensor.status === 'Inactive';

            return (
              <Card key={sensor.id} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-lg ${
                      isActive 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/30' 
                        : isOffline 
                        ? 'bg-navy-100 text-navy-400 dark:bg-navy-800' 
                        : 'bg-accent-50 text-accent-500 dark:bg-accent-950/20'
                    }`}>
                      <Icon size={18} />
                    </div>
                    {sensor.battery !== undefined && (
                      <div className="flex items-center gap-0.5 text-navy-400">
                        <Battery size={12} className={sensor.battery < 20 ? 'text-rose-500' : ''} />
                        <span className="text-[10px] font-bold">{sensor.battery}%</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-900 dark:text-white leading-tight truncate">
                      {sensor.name.replace('Bedroom ', '').replace('Living Room ', '').replace('Kitchen ', '').replace('Main ', '')}
                    </h4>
                    <span className="text-[10px] text-navy-400 dark:text-navy-500 font-medium block mt-0.5">
                      {sensor.location}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isActive 
                      ? 'text-primary-600 animate-pulse' 
                      : isInactive 
                      ? 'text-amber-600'
                      : isOffline 
                      ? 'text-navy-400' 
                      : 'text-emerald-600'
                  }`}>
                    {sensor.status}
                  </span>
                  <span className="text-[10px] text-navy-400">{sensor.lastUpdate}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Timeline & Routine / Quick Actions / Medication Row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Today's Routine Timeline */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">
                <span className="inline-flex items-center gap-2">
                  <Clock size={16} className="text-accent-500" />
                  Today's Routine
                </span>
              </CardTitle>
              <CardDescription>PIR sensor log</CardDescription>
            </div>
            <button 
              onClick={() => setCurrentPage('timeline')}
              className="text-xs font-bold text-primary-500 dark:text-primary-400 hover:underline"
            >
              Full Log
            </button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[320px] pr-2 no-scrollbar">
            <div className="relative pl-6 border-l-2 border-navy-100 dark:border-navy-800 space-y-4 py-2">
              {timeline.slice(0, 6).map((item) => (
                <div key={item.id} className="relative">
                  <div className={`absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border-2 border-white dark:border-navy-900 ${
                    item.severity === 'critical' 
                      ? 'bg-rose-500' 
                      : item.severity === 'warning' 
                      ? 'bg-amber-500' 
                      : 'bg-emerald-500'
                  }`} />
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold text-navy-800 dark:text-navy-200 leading-tight">
                        {item.activity}
                      </p>
                      <span className="text-[10px] text-navy-400 dark:text-navy-500 font-medium">
                        {item.location}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-navy-500">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medication Status */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">
                <span className="inline-flex items-center gap-2">
                  <Pill size={16} className="text-accent-500" />
                  Medications
                </span>
              </CardTitle>
              <CardDescription>Daily adherence</CardDescription>
            </div>
            <button 
              onClick={() => setCurrentPage('medication')}
              className="text-xs font-bold text-primary-500 dark:text-primary-400 hover:underline"
            >
              Manage
            </button>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {medications.map((med) => (
              <div 
                key={med.id} 
                className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-800 rounded-xl border border-navy-100 dark:border-navy-700 text-sm"
              >
                <div>
                  <h4 className="font-bold text-navy-800 dark:text-navy-200 leading-tight">{med.name}</h4>
                  <div className="flex gap-2 text-[10px] font-bold text-navy-400 dark:text-navy-500 mt-1">
                    <span>Scheduled: {med.time}</span>
                    <span className="text-navy-300">•</span>
                    <span>{med.schedule}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleMedicationStatus(med.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                    med.status === 'Taken'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-200'
                      : med.status === 'Missed'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 hover:bg-rose-200'
                      : 'bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400 dark:border dark:border-primary-900/50'
                  }`}
                >
                  {med.status === 'Taken' ? (
                    <span className="flex items-center gap-1">
                      Taken {med.takenTime}
                    </span>
                  ) : med.status === 'Missed' ? (
                    'Missed'
                  ) : (
                    'Mark Taken'
                  )}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions & Recent Alerts Panel */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-lg">
                  <span className="inline-flex items-center gap-2">
                    <ShieldAlert size={16} className="text-primary-500" />
                    Quick Actions
                  </span>
                </CardTitle>
                <CardDescription>Caregiver operations</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pb-6">
              <a 
                href={`tel:${primaryContact?.phone || ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Calling Primary Contact (${primaryContact?.name}): ${primaryContact?.phone}`);
                }}
                className="flex flex-col items-center gap-2 p-3 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-primary-50/50 hover:border-primary-200 dark:hover:bg-navy-800/50 text-center transition-all group"
                aria-label={`Call primary contact ${primaryContact?.name}`}
              >
                <Phone className="text-navy-500 group-hover:text-primary-500 transition-colors" size={20} aria-hidden="true" />
                <span className="text-xs font-bold text-navy-800 dark:text-navy-200">Call {primaryContact?.name.split(' ')[0]}</span>
              </a>

              <button 
                onClick={() => {
                  alert(`Triggering system speaker announcement at Gateway: "Hello Mohan, checking in. Are you feeling alright?"`);
                }}
                className="flex flex-col items-center gap-2 p-3 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-primary-50/50 hover:border-primary-200 dark:hover:bg-navy-800/50 text-center transition-all group"
                aria-label="Send voice announcement through gateway speaker"
              >
                <Volume2 className="text-navy-500 group-hover:text-primary-500 transition-colors" size={20} aria-hidden="true" />
                <span className="text-xs font-bold text-navy-800 dark:text-navy-200">Gateway Speak</span>
              </button>

              <button 
                onClick={() => {
                  alert(`Broadcasting alert message to all emergency contacts: "Urgent: Checking Elder Mohan Sharma."`);
                }}
                className="flex flex-col items-center gap-2 p-3 border border-navy-200 dark:border-navy-700 rounded-xl hover:bg-primary-50/50 hover:border-primary-200 dark:hover:bg-navy-800/50 text-center transition-all group"
                aria-label="Notify all emergency contacts"
              >
                <ShieldAlert className="text-navy-500 group-hover:text-rose-600 transition-colors" size={20} aria-hidden="true" />
                <span className="text-xs font-bold text-navy-800 dark:text-navy-200">Notify Contacts</span>
              </button>

              <button 
                onClick={simulateFall}
                className="flex flex-col items-center gap-2 p-3 border border-rose-200/50 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/10 rounded-xl hover:bg-rose-50 hover:border-rose-400 text-center transition-all group"
                aria-label="Simulate fall detection event for testing"
              >
                <AlertTriangle className="text-rose-500 group-hover:text-rose-700 transition-colors" size={20} aria-hidden="true" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Simulate Fall</span>
              </button>
            </CardContent>
          </Card>

          {/* Active Alerts Preview */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-lg">
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Recent Alerts
                  </span>
                </CardTitle>
                <CardDescription>Pending review</CardDescription>
              </div>
              <button 
                onClick={() => setCurrentPage('alerts')}
                className="text-xs font-bold text-primary-500 dark:text-primary-400 hover:underline"
              >
                View All
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-4 text-navy-400 text-sm font-semibold">
                  All indicators normal. No active alerts.
                </div>
              ) : (
                activeAlerts.slice(0, 2).map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-xl border flex flex-col gap-1 text-sm ${
                      alert.severity === 'critical'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-navy-900 dark:text-white uppercase tracking-wider text-xs">
                          {alert.type}
                        </span>
                        {alert.status === 'active' && alertCountdown !== null && alertCountdown > 0 && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full animate-pulse">
                            {alertCountdown}s
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-navy-400 font-mono">{alert.time}</span>
                    </div>
                    <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
                      {alert.description}
                    </p>
                    {alert.status === 'escalated' && (
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpCircle size={12} className="text-primary-500" />
                        <span className="text-[10px] font-bold text-primary-600">ESCALATED</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};
