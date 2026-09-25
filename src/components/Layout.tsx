import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { CallConsole } from './CallConsole';
import {
  LayoutDashboard,
  Activity,
  Bell,
  Clock,
  LineChart,
  Pill,
  User,
  Cpu,
  Settings as SettingsIcon,
  Play,
  LogOut,
  Menu,
  X,
  Shield,
  Heart,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpCircle,
} from 'lucide-react';

interface LayoutProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

type NavGroup = {
  label: string;
  items: {
    id: string;
    name: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    badge?: number;
    isDemo?: boolean;
  }[];
};

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  setCurrentPage,
  onLogout,
  children
}) => {
  const {
    safetyStatus,
    sensors,
    statusText,
    alerts,
    notifications,
    unreadCount,
    dismissNotification,
    markAllNotificationsRead,
    dataMode,
  } = useDemo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
  const devicesOnline = sensors.filter(s => s.status === 'Online' || s.status === 'Active').length;

  const navGroups: NavGroup[] = [
    {
      label: 'Monitoring',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'live', name: 'Live Monitoring', icon: Activity },
        { id: 'alerts', name: 'Alerts', icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined },
        { id: 'timeline', name: 'Activity Timeline', icon: Clock },
      ],
    },
    {
      label: 'Care',
      items: [
        { id: 'analytics', name: 'Analytics', icon: LineChart },
        { id: 'medication', name: 'Medication', icon: Pill },
        { id: 'profile', name: 'Elder Profile', icon: User },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'devices', name: 'Devices', icon: Cpu },
        { id: 'privacy', name: 'Privacy Center', icon: Shield },
        { id: 'settings', name: 'Settings', icon: SettingsIcon },
      ],
    },
    {
      label: 'Demo',
      items: [
        { id: 'demo', name: 'Demo Simulator', icon: Play, isDemo: true },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'CRITICAL':
        return 'bg-rose-600/15 text-rose-400 border-rose-500/40';
      default:
        return 'bg-navy-700/40 text-navy-300 border-navy-600/40';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SAFE': return 'NORMAL';
      case 'WARNING': return 'ATTENTION';
      case 'CRITICAL': return 'CRITICAL';
      default: return status;
    }
  };

  const getPulseClass = (status: string) => {
    switch (status) {
      case 'SAFE': return 'pulse-green';
      case 'WARNING': return 'pulse-amber';
      case 'CRITICAL': return 'pulse-red';
      default: return '';
    }
  };

  const renderNavButton = (item: NavGroup['items'][number], isMobile = false) => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          setCurrentPage(item.id);
          if (isMobile) setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-2.5 ${isMobile ? 'py-2.5 text-sm' : 'py-2 text-[13px]'} rounded-lg font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-primary-500/12 text-primary-400 border border-primary-500/25'
            : item.isDemo
            ? 'text-navy-400 hover:bg-navy-800/60 hover:text-navy-200 border border-transparent'
            : 'text-navy-300 hover:bg-navy-800/70 hover:text-white border border-transparent'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon size={15} className={isActive ? 'text-primary-400 shrink-0' : 'opacity-70 shrink-0'} />
          <span className="truncate">{item.name}</span>
        </div>
        {item.badge !== undefined && (
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
              isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-rose-600 text-white'
            }`}
            aria-label={`${item.badge} alerts`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const navContent = (
    <nav aria-label="Main navigation" className="space-y-5">
      {navGroups.map(group => (
        <div key={group.label}>
          <div className="px-2.5 mb-1.5 text-[10px] font-semibold text-navy-500 uppercase tracking-[0.14em]">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.items.map(item => renderNavButton(item))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col font-sans text-navy-100">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top header — ElderSafe | status | devices | notifications | caregiver */}
      <header
        className="sticky top-0 z-40 bg-navy-950/95 backdrop-blur border-b border-navy-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3"
        role="banner"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-navy-300 p-1.5 hover:bg-navy-800 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="bg-navy-800 border border-navy-700 p-1.5 rounded-lg text-primary-400" aria-hidden="true">
              <div className="flex items-center gap-0.5">
                <Shield size={15} className="stroke-[2]" />
                <Heart size={9} className="fill-primary-400 stroke-primary-400 -ml-1" />
              </div>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white hidden sm:block">
              Elder<span className="text-primary-400">Safe</span>
            </span>
          </div>

          {/* System status */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold tracking-wide ${getStatusColor(safetyStatus)}`}
            title={statusText}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${getPulseClass(safetyStatus)}`} aria-hidden="true" />
            <span>System {getStatusLabel(safetyStatus)}</span>
          </div>

          {/* Devices connected */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-navy-800 bg-navy-900 text-[11px] font-medium text-navy-300"
            title={`${devicesOnline} of ${sensors.length} devices reporting`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${devicesOnline === sensors.length ? 'bg-emerald-500' : 'bg-amber-500'}`}
              aria-hidden="true"
            />
            {devicesOnline}/{sensors.length} Devices
          </div>

          {dataMode === 'hardware' && (
            <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded border border-emerald-600/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Live Hardware
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg hover:bg-navy-800 transition-colors text-navy-300"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={notifOpen}
            >
              <Bell size={17} aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-navy-950"
                  aria-hidden="true"
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-navy-900 rounded-xl border border-navy-700 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-3.5 border-b border-navy-800">
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        className="text-[10px] font-semibold text-primary-400 hover:text-primary-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-navy-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => {
                        const getNotifIcon = () => {
                          switch (n.type) {
                            case 'fall': return <AlertTriangle size={14} className="text-rose-500" />;
                            case 'escalated': return <ArrowUpCircle size={14} className="text-primary-400" />;
                            case 'acknowledged': return <CheckCircle size={14} className="text-emerald-500" />;
                            case 'resolved': return <CheckCircle size={14} className="text-emerald-500" />;
                            default: return <Info size={14} className="text-amber-500" />;
                          }
                        };
                        return (
                          <div
                            key={n.id}
                            className={`px-3.5 py-3 border-b border-navy-800/80 flex items-start gap-3 transition-colors ${
                              !n.read ? 'bg-primary-500/5' : ''
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">{getNotifIcon()}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-navy-200 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-navy-500 mt-0.5 block">{n.time}</span>
                            </div>
                            {!n.read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                                className="text-[10px] font-semibold text-navy-500 hover:text-navy-300 shrink-0"
                                aria-label="Dismiss notification"
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Caregiver */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-navy-800">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-[11px] font-medium text-navy-200">Caregiver</div>
              <div className="text-[10px] text-navy-500">Sharma Family</div>
            </div>
            <div className="h-7 w-7 rounded-md bg-navy-800 border border-navy-700 flex items-center justify-center font-semibold text-primary-400 text-xs">
              C
            </div>
          </div>
        </div>
      </header>

      {/* Main shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex flex-col w-56 bg-navy-950 border-r border-navy-800 p-3 justify-between overflow-y-auto no-scrollbar"
          role="navigation"
          aria-label="Main navigation"
        >
          <div>{navContent}</div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 mt-4 rounded-lg text-[13px] font-medium text-navy-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors border border-transparent"
            aria-label="Sign out of ElderSafe"
          >
            <LogOut size={15} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="relative w-72 max-w-sm bg-navy-950 h-full p-4 flex flex-col justify-between border-r border-navy-800 shadow-2xl z-10 animate-slide-in overflow-y-auto">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-navy-800 border border-navy-700 p-1.5 rounded-lg text-primary-400">
                      <div className="flex items-center gap-0.5">
                        <Shield size={14} />
                        <Heart size={8} className="fill-primary-400 stroke-primary-400 -ml-0.5" />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      Elder<span className="text-primary-400">Safe</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-navy-400 hover:text-navy-200 rounded-full hover:bg-navy-800"
                    aria-label="Close navigation menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-semibold ${getStatusColor(safetyStatus)}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${getPulseClass(safetyStatus)}`} aria-hidden="true" />
                  System {getStatusLabel(safetyStatus)} · {devicesOnline}/{sensors.length} devices
                </div>

                {navContent}
              </div>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 mt-4 rounded-lg text-sm font-medium text-navy-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors border border-transparent"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 no-scrollbar bg-navy-950"
          role="main"
          aria-label="Main content"
        >
          <div className="max-w-7xl mx-auto space-y-5 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Global emergency call console (renders only when a call is active) */}
      <CallConsole />
    </div>
  );
};
