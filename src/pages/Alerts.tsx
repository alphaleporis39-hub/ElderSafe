import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
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
    if (status === 'resolved') return 'text-emerald-500 bg-emerald-500/10';
    if (status === 'escalated') return 'text-orange-400 bg-orange-500/10';
    if (status === 'acknowledged') return 'text-primary-400 bg-primary-500/10';
    if (severity === 'critical') return 'text-rose-400 bg-rose-500/10';
    if (severity === 'warning') return 'text-amber-400 bg-amber-500/10';
    return 'text-navy-400 bg-navy-800';
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
      <PageHeader
        icon={<Bell className="text-primary-500" size={28} />}
        title="Alert Management"
        description="Review, acknowledge, escalate, or resolve safety anomalies."
        actions={
          <div className="flex flex-wrap gap-2">
            {activeAlerts.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-2 rounded-lg text-rose-400 text-sm font-semibold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{activeAlerts.length} Active</span>
              </div>
            )}
            {escalatedAlerts.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-lg text-orange-400 text-sm font-semibold flex items-center gap-2">
                <ArrowUpCircle size={16} />
                <span>{escalatedAlerts.length} Escalated</span>
              </div>
            )}
          </div>
        }
      />

      {/* Interactive Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-navy-800 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
          }`}
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            filter === 'critical'
              ? 'bg-rose-600 text-white'
              : 'text-rose-400 hover:bg-rose-500/10'
          }`}
        >
          Critical ({criticalCount})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            filter === 'warning'
              ? 'bg-amber-600 text-white'
              : 'text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          Warnings ({warningCount})
        </button>
        <button
          onClick={() => setFilter('acknowledged')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            filter === 'acknowledged'
              ? 'bg-primary-600 text-white'
              : 'text-primary-400 hover:bg-primary-500/10'
          }`}
        >
          Acknowledged ({acknowledgedAlerts.length})
        </button>
        <button
          onClick={() => setFilter('escalated')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            filter === 'escalated'
              ? 'bg-orange-600 text-white'
              : 'text-orange-400 hover:bg-orange-500/10'
          }`}
        >
          Escalated ({escalatedAlerts.length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            filter === 'resolved'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >
          Resolved ({resolvedAlerts.length})
        </button>
      </div>

      {/* Alerts Grid List */}
      <div className="grid gap-4">
        {filteredAlerts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-navy-800 p-4 rounded-full inline-flex text-navy-500 mx-auto">
              <CheckCircle size={36} />
            </div>
            <h3 className="text-lg font-semibold text-navy-200 mt-4">No Alerts Found</h3>
            <p className="text-navy-500 mt-1 max-w-sm mx-auto text-sm leading-relaxed">
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
                    ? 'opacity-80 border-navy-800 bg-navy-900/60' 
                    : isEscalated
                    ? 'border-orange-500/30 bg-orange-500/5'
                    : isAcknowledged
                    ? 'border-primary-500/25 bg-primary-500/5'
                    : isCritical
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-amber-500/25 bg-amber-500/5'
                }`}
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-md ${getAlertIconColor(alert.severity, alert.status)}`}>
                      <Icon size={18} />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                          {alert.type}
                        </h3>
                        <Badge variant={statusBadge.variant} className="font-semibold text-[10px] px-2 py-0.5">
                          {statusBadge.text}
                        </Badge>
                        <span className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider bg-navy-800 px-2 py-0.5 rounded">
                          {alert.location}
                        </span>
                      </div>
                      
                      <p className="text-sm text-navy-300 leading-relaxed max-w-2xl">
                        {alert.description}
                      </p>

                      {/* Explainable Alert Details (Phase 6) */}
                      {(alert.whatHappened || alert.whyTriggered || alert.recommendedAction) && (
                        <div className="mt-3 p-3 rounded-lg bg-navy-950/60 border border-navy-800 space-y-2">
                          {alert.whatHappened && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider shrink-0 mt-0.5">What</span>
                              <span className="text-xs text-navy-300">{alert.whatHappened}</span>
                            </div>
                          )}
                          {alert.whenDetected && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider shrink-0 mt-0.5">When</span>
                              <span className="text-xs text-navy-300">{alert.whenDetected}</span>
                            </div>
                          )}
                          {alert.whereLocated && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider shrink-0 mt-0.5">Where</span>
                              <span className="text-xs text-navy-300">{alert.whereLocated}</span>
                            </div>
                          )}
                          {alert.whyTriggered && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider shrink-0 mt-0.5">Why</span>
                              <span className="text-xs text-navy-300">{alert.whyTriggered}</span>
                            </div>
                          )}
                          {alert.recommendedAction && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider shrink-0 mt-0.5">Action</span>
                              <span className="text-xs text-navy-300">{alert.recommendedAction}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-[10px] font-medium text-navy-500">
                        <span>Triggered at {alert.time}</span>
                        {alert.acknowledgedAt && <span className="text-primary-400">• Acknowledged at {alert.acknowledgedAt}</span>}
                        {alert.escalatedAt && <span className="text-orange-400">• Escalated at {alert.escalatedAt}</span>}
                        {alert.resolvedAt && <span className="text-emerald-400">• Resolved at {alert.resolvedAt}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {!isResolved && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          isCritical
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        Mark Resolved
                      </button>
                    )}
                    {isResolved && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
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
