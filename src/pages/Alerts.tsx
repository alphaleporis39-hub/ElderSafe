import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Bell, ShieldAlert, CheckCircle, AlertTriangle, Info, ArrowUpCircle, Eye } from 'lucide-react';

export const Alerts: React.FC = () => {
  const { alerts, resolveAlert } = useDemo();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'active' | 'acknowledged' | 'escalated' | 'resolved'>('all');

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');
  const escalatedAlerts = alerts.filter(a => a.status === 'escalated');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'critical') return alert.status === 'active' && alert.severity === 'critical';
    if (filter === 'warning') return alert.status === 'active' && alert.severity === 'warning';
    if (filter === 'active') return alert.status === 'active';
    if (filter === 'acknowledged') return alert.status === 'acknowledged';
    if (filter === 'escalated') return alert.status === 'escalated';
    if (filter === 'resolved') return alert.status === 'resolved';
    return true; // 'all'
  });

  const getAlertIcon = (severity: string, status: string) => {
    if (status === 'resolved') return CheckCircle;
    if (status === 'escalated') return ArrowUpCircle;
    if (status === 'acknowledged') return Eye;
    if (severity === 'critical') return ShieldAlert;
    if (severity === 'warning') return AlertTriangle;
    return Info;
  };

  const getAlertIconColor = (severity: string, status: string) => {
    if (status === 'resolved') return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
    if (status === 'escalated') return 'text-orange-500 bg-orange-50 dark:bg-orange-950/20';
    if (status === 'acknowledged') return 'text-primary-500 bg-primary-50 dark:bg-primary-950/20';
    if (severity === 'critical') return 'text-rose-600 bg-rose-50 dark:bg-rose-955/20';
    if (severity === 'warning') return 'text-amber-600 bg-amber-50 dark:bg-amber-955/20';
    return 'text-navy-500 bg-navy-50';
  };

  const getStatusBadge = (status: string, severity: string) => {
    switch (status) {
      case 'resolved': return { variant: 'success' as const, text: 'Resolved' };
      case 'escalated': return { variant: 'danger' as const, text: 'Escalated' };
      case 'acknowledged': return { variant: 'info' as const, text: 'Acknowledged' };
      default:
        return severity === 'critical'
          ? { variant: 'danger' as const, text: 'CRITICAL' }
          : { variant: 'warning' as const, text: 'WARNING' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="text-primary-500" size={28} />
            Alert Management
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Review, acknowledge, escalate, or resolve safety anomalies.
          </p>
        </div>
        
        {/* Quick Summary Pills */}
        <div className="flex flex-wrap gap-2">
          {activeAlerts.length > 0 && (
            <div className="bg-rose-50 border border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/30 px-4 py-2 rounded-2xl text-rose-700 dark:text-rose-400 text-sm font-extrabold flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>{activeAlerts.length} Active</span>
            </div>
          )}
          {escalatedAlerts.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 px-4 py-2 rounded-2xl text-orange-700 dark:text-orange-400 text-sm font-extrabold flex items-center gap-2">
              <ArrowUpCircle size={16} />
              <span>{escalatedAlerts.length} Escalated</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-navy-200 dark:border-navy-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all ${
            filter === 'all'
              ? 'bg-primary-500 text-white shadow-md'
              : 'text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${
            filter === 'critical'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-rose-650 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20'
          }`}
        >
          Critical ({criticalCount})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${
            filter === 'warning'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-955/20'
          }`}
        >
          Warnings ({warningCount})
        </button>
        <button
          onClick={() => setFilter('acknowledged')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${
            filter === 'acknowledged'
              ? 'bg-primary-500 text-white shadow-md'
              : 'text-primary-500 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20'
          }`}
        >
          Acknowledged ({acknowledgedAlerts.length})
        </button>
        <button
          onClick={() => setFilter('escalated')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${
            filter === 'escalated'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20'
          }`}
        >
          Escalated ({escalatedAlerts.length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${
            filter === 'resolved'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-emerald-650 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
          }`}
        >
          Resolved ({resolvedAlerts.length})
        </button>
      </div>

      {/* Alerts Grid List */}
      <div className="grid gap-4">
        {filteredAlerts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-navy-50 dark:bg-navy-850 p-4 rounded-full inline-flex text-navy-400 mx-auto">
              <CheckCircle size={36} />
            </div>
            <h3 className="text-lg font-bold text-navy-800 dark:text-navy-200 mt-4">No Alerts Found</h3>
            <p className="text-navy-500 dark:text-navy-450 mt-1 max-w-sm mx-auto text-sm leading-relaxed">
              No anomalies fit this filter. Elder Safe is currently monitoring normally.
            </p>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.severity, alert.status);
            const isResolved = alert.status === 'resolved';
            const isEscalated = alert.status === 'escalated';
            const isAcknowledged = alert.status === 'acknowledged';
            const isCritical = alert.severity === 'critical';
            const statusBadge = getStatusBadge(alert.status, alert.severity);

            return (
              <Card 
                key={alert.id} 
                className={`transition-all ${
                  isResolved 
                    ? 'opacity-80 border-navy-100 bg-white/60 dark:bg-navy-900/40 dark:border-navy-850' 
                    : isEscalated
                    ? 'border-orange-200 bg-orange-50/20 dark:bg-orange-950/5 dark:border-orange-900/30'
                    : isAcknowledged
                    ? 'border-primary-200 bg-primary-50/20 dark:bg-primary-950/5 dark:border-primary-900/30'
                    : isCritical
                    ? 'border-rose-200 bg-rose-50/20 dark:bg-rose-955/5 dark:border-rose-900/30'
                    : 'border-amber-200 bg-amber-50/20 dark:bg-amber-955/5 dark:border-amber-900/30'
                }`}
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${getAlertIconColor(alert.severity, alert.status)}`}>
                      <Icon size={24} className="stroke-[2.5]" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-navy-900 dark:text-white uppercase tracking-wide">
                          {alert.type}
                        </h3>
                        <Badge variant={statusBadge.variant} className="font-bold text-[10px] px-2 py-0.5">
                          {statusBadge.text}
                        </Badge>
                        <span className="text-[10px] text-navy-400 font-bold uppercase tracking-wider bg-navy-100 dark:bg-navy-800 px-2 py-0.5 rounded-md">
                          {alert.location}
                        </span>
                      </div>
                      
                      <p className="text-sm font-semibold text-navy-700 dark:text-navy-350 leading-relaxed max-w-2xl">
                        {alert.description}
                      </p>

                      {/* Explainable Alert Details (Phase 6) */}
                      {(alert.whatHappened || alert.whyTriggered || alert.recommendedAction) && (
                        <div className="mt-3 p-3 rounded-xl bg-navy-50 dark:bg-navy-800/50 border border-navy-100 dark:border-navy-750 space-y-2">
                          {alert.whatHappened && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-extrabold text-primary-500 dark:text-primary-400 uppercase tracking-wider shrink-0 mt-0.5">What</span>
                              <span className="text-xs font-semibold text-navy-600 dark:text-navy-350">{alert.whatHappened}</span>
                            </div>
                          )}
                          {alert.whenDetected && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-extrabold text-primary-500 dark:text-primary-400 uppercase tracking-wider shrink-0 mt-0.5">When</span>
                              <span className="text-xs font-semibold text-navy-600 dark:text-navy-350">{alert.whenDetected}</span>
                            </div>
                          )}
                          {alert.whereLocated && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-extrabold text-primary-500 dark:text-primary-400 uppercase tracking-wider shrink-0 mt-0.5">Where</span>
                              <span className="text-xs font-semibold text-navy-600 dark:text-navy-350">{alert.whereLocated}</span>
                            </div>
                          )}
                          {alert.whyTriggered && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider shrink-0 mt-0.5">Why</span>
                              <span className="text-xs font-semibold text-navy-600 dark:text-navy-350">{alert.whyTriggered}</span>
                            </div>
                          )}
                          {alert.recommendedAction && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider shrink-0 mt-0.5">Action</span>
                              <span className="text-xs font-semibold text-navy-600 dark:text-navy-350">{alert.recommendedAction}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-[10px] font-bold text-navy-450 dark:text-navy-500">
                        <span>Triggered at {alert.time}</span>
                        {alert.acknowledgedAt && <span className="text-primary-500">• Acknowledged at {alert.acknowledgedAt}</span>}
                        {alert.escalatedAt && <span className="text-orange-500">• Escalated at {alert.escalatedAt}</span>}
                        {alert.resolvedAt && <span className="text-emerald-500">• Resolved at {alert.resolvedAt}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {!isResolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-extrabold shadow-sm transition-all ${
                          isCritical
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        Mark Resolved
                      </button>
                    )}
                    {isResolved && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
};
