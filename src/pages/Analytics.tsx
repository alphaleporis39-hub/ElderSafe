import React from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { PageHeader } from '../components/ui/Primitives';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { TrendingUp, Award, Heart, Activity, Shield, Zap } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { 
    alerts, timeline, medications, sensors, 
    anomalyResult
  } = useDemo();

  // ─── Derive data from context ──────────────────────────────────────────

  // Factual hourly activity volume from real timeline events (no synthetic score trend)
  const activityByHour = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8; // 08:00 → 21:00
    const hourLabel = `${String(hour).padStart(2, '0')}:00`;
    const count = timeline.filter(e => {
      const match = e.time.match(/(\d{1,2}):(\d{2})/);
      if (!match) return false;
      const eHour = parseInt(match[1], 10);
      return eHour === hour;
    }).length;
    return { name: hourLabel, events: count };
  });

  // Generate time-slot occupancy strictly from real timeline movement events
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  const roomOccupancyData = timeSlots.map(slot => {
    const hour = parseInt(slot.split(':')[0], 10);
    const nearbyEvents = timeline.filter(e => {
      const match = e.time.match(/(\d{1,2}):(\d{2})/);
      if (!match) return false;
      const eHour = parseInt(match[1], 10);
      return Math.abs(eHour - hour) <= 1 && e.type === 'movement';
    });

    return {
      name: slot,
      LivingRoom: nearbyEvents.filter(e => e.location === 'Living Room').length * 15,
      Bedroom: nearbyEvents.filter(e => e.location === 'Bedroom').length * 15,
      Kitchen: nearbyEvents.filter(e => e.location === 'Kitchen').length * 15,
      Bathroom: nearbyEvents.filter(e => e.location === 'Bathroom').length * 15,
    };
  });

  // Medication adherence from context
  const taken = medications.filter(m => m.status === 'Taken').length;
  const missed = medications.filter(m => m.status === 'Missed').length;
  const pending = medications.filter(m => m.status === 'Pending').length;
  const medicationAdherenceData = [
    { name: 'Taken On Time', value: taken, color: '#10b981' },
    { name: 'Pending', value: pending, color: '#f59e0b' },
    { name: 'Missed', value: missed, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Alert counts by severity from real alert history (no synthetic multi-day data)
  const alertFrequencyData = (['critical', 'warning', 'safe'] as const).map(sev => ({
    day: sev === 'critical' ? 'Critical' : sev === 'warning' ? 'Warning' : 'Resolved/Safe',
    alerts: alerts.filter(a => a.severity === sev).length,
  }));

  // Device uptime from sensors
  const onlineDevices = sensors.filter(s => s.status === 'Online' || s.status === 'Active').length;
  const totalDevices = sensors.length;
  const deviceUptime = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 100;

  // Summary stats — factual counts from real context data
  const openAlerts = alerts.filter(a => a.status === 'active').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const summaryStats = [
    { 
      name: 'Open Alerts', 
      value: `${openAlerts}`, 
      change: openAlerts === 0 ? 'Nothing needs action' : `${criticalAlerts} critical · review now`, 
      icon: Shield, 
      iconColor: openAlerts === 0 ? 'text-emerald-500 bg-emerald-500/10' : criticalAlerts > 0 ? 'text-rose-500 bg-rose-500/10' : 'text-amber-500 bg-amber-500/10' 
    },
    { 
      name: 'Routine Consistency', 
      value: `${anomalyResult.routineConsistency}%`, 
      change: anomalyResult.routineConsistency >= 90 ? 'Highly stable' : anomalyResult.routineConsistency >= 70 ? 'Minor deviations' : 'Significant deviations', 
      icon: TrendingUp, 
      iconColor: 'text-primary-500 bg-primary-500/10' 
    },
    { 
      name: 'Medication Adherence', 
      value: `${medications.length > 0 ? Math.round((taken / medications.length) * 100) : 100}%`, 
      change: `${taken} taken, ${missed} missed`, 
      icon: Heart, 
      iconColor: 'text-rose-500 bg-rose-500/10' 
    },
    { 
      name: 'Device Uptime', 
      value: `${deviceUptime}%`, 
      change: `${onlineDevices}/${totalDevices} online`, 
      icon: Activity, 
      iconColor: deviceUptime >= 90 ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10' 
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader
        icon={<Award className="text-primary-400" size={20} />}
        title="Analytics Dashboard"
        description="Activity intelligence, routine trends, and monitoring insights."
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 rounded-lg border border-primary-500/25">
            <Shield size={14} className="text-primary-400" />
            <span className="text-xs font-semibold text-primary-300">
              Activity anomaly: {anomalyResult.score}/100 vs personal baseline
            </span>
          </div>
        }
      />

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">
                  {stat.name}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-white">{stat.value}</h3>
                  <span className="text-[10px] text-navy-400 mt-0.5 block">
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-2.5 rounded-md ${stat.iconColor}`}>
                <Icon size={18} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Activity Anomaly Breakdown */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Activity Anomaly Breakdown
            </CardTitle>
            <CardDescription>Category-level analysis compared to personal baseline</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(anomalyResult.categories).map(([key, cat]) => {
              const labels: Record<string, string> = {
                movement: 'Movement',
                routine: 'Routine',
                medication: 'Medication',
                inactivity: 'Inactivity',
                fallRisk: 'Fall Risk',
                deviceStatus: 'Devices',
              };
              const statusColors: Record<string, string> = {
                Normal: 'text-emerald-400 bg-emerald-500/10',
                Elevated: 'text-amber-400 bg-amber-500/10',
                High: 'text-orange-400 bg-orange-500/10',
                Critical: 'text-rose-400 bg-rose-500/10',
              };
              return (
                <div key={key} className="text-center space-y-2 p-3 rounded-lg bg-navy-950/60 border border-navy-800">
                  <span className="text-[10px] font-semibold text-navy-500 uppercase tracking-wider block">
                    {labels[key] || key}
                  </span>
                  <div className={`text-base font-semibold ${statusColors[cat.status]?.split(' ')[0] || 'text-white'}`}>
                    {cat.score}
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded inline-block ${statusColors[cat.status] || 'text-navy-400 bg-navy-800'}`}>
                    {cat.status}
                  </span>
                  <p className="text-[10px] text-navy-500 leading-tight">
                    {cat.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Charts (Weekly trend + Occupancy) */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Hourly Activity Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Today's Activity by Hour</CardTitle>
              <CardDescription>Logged timeline events per hour from live monitoring</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityByHour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} interval={1} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="events" name="Events" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#activityColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Spatial Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Daily Room Occupancy</CardTitle>
              <CardDescription>Sensor activity durations in household zones today</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomOccupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="LivingRoom" stackId="a" fill="#0ea5e9" name="Living Room" />
                <Bar dataKey="Bedroom" stackId="a" fill="#64748b" name="Bedroom" />
                <Bar dataKey="Kitchen" stackId="a" fill="#f59e0b" name="Kitchen" />
                <Bar dataKey="Bathroom" stackId="a" fill="#06b6d4" name="Bathroom" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Row 3: Pie Chart Adherence + Alerts counts */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Medication Adherence */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Medication Adherence</CardTitle>
              <CardDescription>Status of scheduled doses today</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicationAdherenceData.length > 0 ? medicationAdherenceData : [{ name: 'No Data', value: 1, color: '#94a3b8' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(medicationAdherenceData.length > 0 ? medicationAdherenceData : [{ name: 'No Data', value: 1, color: '#94a3b8' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-1/2 space-y-3 pl-4">
              {(medicationAdherenceData.length > 0 ? medicationAdherenceData : [{ name: 'No Data', value: 1, color: '#94a3b8' }]).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-navy-700 dark:text-navy-300">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <div className="flex-1 flex justify-between">
                    <span>{entry.name}</span>
                    <span className="text-navy-400 font-mono">({entry.value} times)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Frequency */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Alerts by Severity</CardTitle>
              <CardDescription>Counts from the full alert history log</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="alerts" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

    </div>
  );
};
