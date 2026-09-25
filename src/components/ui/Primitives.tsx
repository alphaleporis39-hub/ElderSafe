import React from 'react';

export type StatusTone = 'safe' | 'warning' | 'critical' | 'neutral';

interface StatusDotProps {
  tone: StatusTone;
  pulse?: boolean;
  className?: string;
}

const dotTone: Record<StatusTone, string> = {
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
  neutral: 'bg-navy-400',
};

export const StatusDot: React.FC<StatusDotProps> = ({ tone, pulse = false, className = '' }) => (
  <span
    aria-hidden="true"
    className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${dotTone[tone]} ${pulse ? 'animate-pulse' : ''} ${className}`}
  />
);

interface SectionHeaderProps {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ id, icon, title, description, action }) => (
  <div className="flex items-start justify-between gap-3 w-full">
    <div className="space-y-0.5 min-w-0">
      <h3
        id={id}
        className="text-sm font-semibold text-white tracking-tight flex items-center gap-2"
      >
        {icon}
        {title}
      </h3>
      {description && (
        <p className="text-[11px] text-navy-500">{description}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description, actions }) => (
  <div className="bg-navy-900 p-4 sm:p-5 rounded-xl border border-navy-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center gap-2.5">
        {icon}
        {title}
      </h1>
      {description && (
        <p className="text-xs text-navy-400 mt-1 font-medium">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
  </div>
);

interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  tone?: StatusTone;
}

const statValueTone: Record<StatusTone, string> = {
  safe: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-rose-400',
  neutral: 'text-white',
};

const statIconTone: Record<StatusTone, string> = {
  safe: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  critical: 'bg-rose-500/10 text-rose-400',
  neutral: 'bg-navy-800 text-navy-300',
};

export const StatTile: React.FC<StatTileProps> = ({ label, value, detail, icon, tone = 'neutral' }) => (
  <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-navy-900 border border-navy-800">
    <div className="space-y-0.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 block">
        {label}
      </span>
      <span className={`text-base font-semibold leading-tight block ${statValueTone[tone]}`}>{value}</span>
      {detail && (
        <span className="text-[11px] text-navy-400 block truncate">{detail}</span>
      )}
    </div>
    {icon && (
      <div className={`p-2 rounded-md shrink-0 ${statIconTone[tone]}`} aria-hidden="true">
        {icon}
      </div>
    )}
  </div>
);

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="text-center py-8 px-4 bg-navy-900/50 rounded-xl border border-dashed border-navy-700 space-y-2">
    <div className="inline-flex p-2.5 rounded-full bg-navy-800 text-navy-400 mx-auto">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-navy-200">{title}</h3>
    {description && (
      <p className="text-xs text-navy-500 max-w-xs mx-auto">{description}</p>
    )}
  </div>
);

interface ActivityItemProps {
  dotTone: StatusTone;
  title: string;
  subtitle?: string;
  time: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ dotTone, title, subtitle, time }) => (
  <div className="relative">
    <span
      aria-hidden="true"
      className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-navy-950 ${
        dotTone === 'critical'
          ? 'bg-rose-500'
          : dotTone === 'warning'
          ? 'bg-amber-500'
          : dotTone === 'neutral'
          ? 'bg-navy-500'
          : 'bg-emerald-500'
      }`}
    />
    <div className="flex justify-between items-start text-sm gap-2">
      <div className="space-y-0.5 min-w-0">
        <p className="font-medium text-navy-100 leading-tight">{title}</p>
        {subtitle && (
          <span className="text-[11px] text-navy-500 block">{subtitle}</span>
        )}
      </div>
      <span className="text-xs font-mono text-navy-400 shrink-0">{time}</span>
    </div>
  </div>
);
