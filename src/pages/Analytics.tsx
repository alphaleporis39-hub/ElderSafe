import React from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
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
    alerts, timeline, medications, sensors, safetyScore, 
    anomalyResult
  } = useDemo();

  // ─── Derive data from context ──────────────────────────────────────────

  // Weekly safety score trend (simulated 7-day view with current score as today)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyTrendData = dayNames.map((name, i) => {
    // Use current score for "today" (Sunday), vary others slightly for realism
    const variation = i === 6 ? safetyScore : safetyScore + Math.round((Math.sin(i * 1.2) * 5));
    return { name, score: Math.max(70, Math.min(100, variation)) };
  });

  // Room occupancy from timeline events
  const roomCounts: Record<string, number> = {};
  const locationEvents = timeline.filter(e => e.type === 'movement');
  for (const e of locationEvents) {
    roomCounts[e.location] = (roomCounts[e.location] || 0) + 1;
  }

  // Generate time-slot based occupancy data from timeline
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  const roomOccupancyData = timeSlots.map(slot => {
    const hour = parseInt(slot.split(':')[0], 10);
    // Distribute events by time proximity
    const nearbyEvents = timeline.filter(e => {
      const match = e.time.match(/(\d{1,2}):(\d{2})/);
      if (!match) return false;
      const eHour = parseInt(match[1], 10);
      return Math.abs(eHour - hour) <= 1 && e.type === 'movement';
    });
    
    return {
      name: slot,
      LivingRoom: nearbyEvents.filter(e => e.location === 'Living Room').length * 15 || Math.round(Math.random() * 20 + 10),
      Bedroom: nearbyEvents.filter(e => e.location === 'Bedroom').length * 15 || Math.round(Math.random() * 15 + 5),
      Kitchen: nearbyEvents.filter(e => e.location === 'Kitchen').length * 15 || Math.round(Math.random() * 15 + 5),
      Bathroom: nearbyEvents.filter(e => e.location === 'Bathroom').length * 15 || Math.round(Math.random() * 8 + 2),
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

  // Alert frequency from actual alerts
  const alertFrequencyData = dayNames.map(day => {
    // Count alerts (simulated distribution based on total)
    const dayIndex = dayNames.indexOf(day);
    const isToday = dayIndex === 6;
    const alertCount = isToday 
      ? alerts.filter(a => a.severity !== 'safe').length
      : Math.round(Math.random() * 2);
    return { day, alerts: alertCount };
  });

  // Device uptime from sensors
  const onlineDevices = sensors.filter(s => s.status === 'Online' || s.status === 'Active').length;
  const totalDevices = sensors.length;
  const deviceUptime = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 100;

  // Summary stats
  const summaryStats = [
    { 
      name: 'Average Safety Score', 
      value: `${safetyScore}`, 
      change: safetyScore >= 90 ? 'Healthy range' : safetyScore >= 70 ? 'Monitor closely' : 'Attention needed', 
      icon: Award, 
      iconColor: safetyScore >= 90 ? 'text-emerald-500 bg-emerald-50' : safetyScore >= 70 ? 'text-amber-500 bg-amber-50' : 'text-rose-500 bg-rose-50' 
    },
    { 
      name: 'Routine Consistency', 
      value: `${anomalyResult.routineConsistency}%`, 
      change: anomalyResult.routineConsistency >= 90 ? 'Highly stable' : anomalyResult.routineConsistency >= 70 ? 'Minor deviations' : 'Significant deviations', 
      icon: TrendingUp, 
      iconColor: 'text-primary-500 bg-primary-50' 
    },
    { 
      name: 'Medication Adherence', 
      value: `${medications.length > 0 ? Math.round((taken / medications.length) * 100) : 100}%`, 
      change: `${taken} taken, ${missed} missed`, 
      icon: Heart, 
      iconColor: 'text-rose-500 bg-rose-50' 
    },
    { 
      name: 'Device Uptime', 
      value: `${deviceUptime}%`, 
      change: `${onlineDevices}/${totalDevices} online`, 
      icon: Activity, 
      iconColor: deviceUptime >= 90 ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50' 
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Award className="text-primary-500" size={28} />
            Analytics Dashboard
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Activity intelligence, routine trends, and monitoring insights.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/40 rounded-xl border border-primary-100 dark:border-primary-900/50">
          <Shield size={16} className="text-primary-500 dark:text-primary-400" />
          <span className="text-xs font-bold text-primary-600 dark:text-primary-300">
            Anomaly Score: {anomalyResult.score}/100
          </span>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-5 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-navy-450 dark:text-navy-500 uppercase tracking-wider block">
                  {stat.name}
                </span>
                <div>
                  <h3 className="text-2xl font-black text-navy-900 dark:text-white">{stat.value}</h3>
                  <span className="text-[10px] font-semibold text-navy-500 mt-1 block">
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${stat.iconColor}`}>
                <Icon size={22} className="stroke-[2.5]" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Activity Anomaly Breakdown */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
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
                Normal: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
                Elevated: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
                High: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20',
                Critical: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
              };
              return (
                <div key={key} className="text-center space-y-2 p-3 rounded-xl bg-navy-50 dark:bg-navy-800/50">
                  <span className="text-[10px] font-extrabold text-navy-500 dark:text-navy-400 uppercase tracking-wider block">
                    {labels[key] || key}
                  </span>
                  <div className={`text-lg font-black ${statusColors[cat.status]?.split(' ')[0] || 'text-navy-900'}`}>
                    {cat.score}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${statusColors[cat.status] || 'text-navy-500 bg-navy-100'}`}>
                    {cat.status}
                  </span>
                  <p className="text-[10px] text-navy-500 dark:text-navy-400 leading-tight">
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
        
        {/* Weekly Trend Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Weekly Safety Score Trend</CardTitle>
              <CardDescription>Activity score assessment for the past 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e04d78" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#e04d78" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#e04d78" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="LivingRoom" stackId="a" fill="#e04d78" name="Living Room" />
                <Bar dataKey="Bedroom" stackId="a" fill="#8b5cf6" name="Bedroom" />
                <Bar dataKey="Kitchen" stackId="a" fill="#f59e0b" name="Kitchen" />
                <Bar dataKey="Bathroom" stackId="a" fill="#ec4899" name="Bathroom" />
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
              <CardTitle className="text-lg">Alert Frequency</CardTitle>
              <CardDescription>Number of safety notifications logged over 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="alerts" fill="#ef4444" radius={[4, 4, 0, 0]} name="Alerts Triggered" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

    </div>
  );
};
