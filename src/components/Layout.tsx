import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
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

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  setCurrentPage,
  onLogout,
  children
}) => {
  const { safetyStatus, safetyScore, alerts, notifications, unreadCount, dismissNotification, markAllNotificationsRead } = useDemo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', name: 'Live Monitoring', icon: Activity },
    { id: 'alerts', name: 'Alerts', icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : undefined },
    { id: 'timeline', name: 'Activity Timeline', icon: Clock },
    { id: 'analytics', name: 'Analytics', icon: LineChart },
    { id: 'medication', name: 'Medication', icon: Pill },
    { id: 'profile', name: 'Elder Profile', icon: User },
    { id: 'devices', name: 'Devices', icon: Cpu },
    { id: 'privacy', name: 'Privacy Center', icon: Shield },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
    { id: 'demo', name: 'Demo Simulator', icon: Play, isDemo: true }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'bg-emerald-500 text-white';
      case 'WARNING':
        return 'bg-amber-500 text-white animate-pulse';
      case 'CRITICAL':
        return 'bg-rose-500 text-white animate-bounce';
      default:
        return 'bg-navy-400 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SAFE': return '\u{1F7E2} SAFE';
      case 'WARNING': return '\u{1F7E1} WARNING';
      case 'CRITICAL': return '\u{1F534} CRITICAL';
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

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-navy-950 flex flex-col font-sans">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-navy-100/60 dark:border-navy-800/60 px-4 sm:px-6 py-3.5 flex items-center justify-between" role="banner">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-navy-500 dark:text-navy-300 p-1.5 hover:bg-navy-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl text-white shadow-sm" aria-hidden="true">
              <div className="flex items-center gap-0.5">
                <Shield size={16} className="stroke-[2.5]" />
                <Heart size={10} className="fill-white stroke-white" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-navy-900 dark:text-white sm:block hidden">
              Elder<span className="text-primary-500">Safe</span>
            </span>
          </div>
        </div>

        {/* Status Indicator Bar */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-400 dark:text-navy-400 font-medium hidden sm:inline">Monitoring</span>
            <div className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm ${getStatusColor(safetyStatus)}`}>
              <span className={`absolute inline-flex h-2 w-2 rounded-full bg-white ${getPulseClass(safetyStatus)}`} />
              <span className="pl-3 tracking-wider">{getStatusText(safetyStatus)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-primary-50 dark:bg-primary-950/30 px-2.5 py-1 rounded-lg border border-primary-100 dark:border-primary-900/40">
            <span className="text-[10px] text-primary-500 font-bold uppercase tracking-wider">Score</span>
            <span className="text-sm font-extrabold text-primary-600 dark:text-primary-400">{safetyScore}</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={notifOpen}
            >
              <Bell size={18} className="text-navy-500 dark:text-navy-300" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[8px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-navy-900" aria-hidden="true">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-900 rounded-2xl border border-navy-100 dark:border-navy-700/50 shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-navy-100 dark:border-navy-800">
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        className="text-[10px] font-bold text-primary-500 hover:text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-navy-400 font-medium">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => {
                        const getNotifIcon = () => {
                          switch (n.type) {
                            case 'fall': return <AlertTriangle size={14} className="text-rose-500" />;
                            case 'escalated': return <ArrowUpCircle size={14} className="text-primary-500" />;
                            case 'acknowledged': return <CheckCircle size={14} className="text-emerald-500" />;
                            case 'resolved': return <CheckCircle size={14} className="text-emerald-500" />;
                            default: return <Info size={14} className="text-amber-500" />;
                          }
                        };
                        return (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-navy-50 dark:border-navy-800/50 flex items-start gap-3 transition-colors ${
                              !n.read ? 'bg-primary-50/40 dark:bg-primary-950/10' : ''
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">{getNotifIcon()}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-navy-700 dark:text-navy-200 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] font-bold text-navy-400 mt-0.5 block">{n.time}</span>
                            </div>
                            {!n.read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                                className="text-[10px] font-bold text-navy-400 hover:text-navy-600 shrink-0"
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

          <div className="flex items-center gap-3 pl-3 border-l border-navy-200 dark:border-navy-700">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-semibold text-navy-800 dark:text-white">Caregiver</div>
              <div className="text-[10px] text-navy-400 dark:text-navy-400">Sharma Family</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-950 dark:to-accent-950 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 text-xs border border-primary-200/50 dark:border-primary-800/50">
              C
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-navy-900/60 border-r border-navy-100/60 dark:border-navy-800/60 p-3 justify-between" role="navigation" aria-label="Main navigation">
          <div className="space-y-4">
            <div className="px-2.5">
              <div className="text-[10px] font-bold text-navy-600 dark:text-navy-400 uppercase tracking-widest">Navigation</div>
            </div>
            <nav className="space-y-0.5" aria-label="Main navigation">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200/30 dark:shadow-primary-900/20'
                        : item.isDemo
                        ? 'bg-accent-50 hover:bg-accent-100 text-accent-700 dark:bg-accent-950/20 dark:text-accent-300 border border-accent-200/40 dark:border-accent-800/30'
                        : 'text-navy-700 dark:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800/50 hover:text-navy-900 dark:hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'stroke-[2.5]' : 'opacity-80'} aria-hidden="true" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-primary-500 text-white'
                      }`} aria-label={`${item.badge} alerts`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-navy-600 hover:bg-rose-50 dark:text-navy-300 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-colors"
            aria-label="Sign out of ElderSafe"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Mobile Sliding Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <div className="relative w-72 max-w-sm bg-white dark:bg-navy-900 h-full p-5 flex flex-col justify-between shadow-2xl z-10 animate-slide-in">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-navy-100 dark:border-navy-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl text-white">
                      <div className="flex items-center gap-0.5">
                        <Shield size={16} />
                        <Heart size={9} className="fill-white stroke-white" />
                      </div>
                    </div>
                    <span className="text-lg font-bold text-navy-900 dark:text-white">
                      Elder<span className="text-primary-500 font-extrabold">Safe</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 text-navy-400 hover:text-navy-600 dark:hover:text-navy-200 rounded-full hover:bg-navy-100 dark:hover:bg-navy-800"
                    aria-label="Close navigation menu"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                <nav className="space-y-0.5">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                            : item.isDemo
                            ? 'bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-950/20 dark:text-accent-300 dark:border-accent-800/30'
                            : 'text-navy-700 dark:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800/50 hover:text-navy-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={18} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-primary-500 text-white'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-navy-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-[#f8f9fc] dark:bg-navy-950" role="main" aria-label="Main content">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
