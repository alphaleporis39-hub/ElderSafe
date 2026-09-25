import React, { useEffect, useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
import { Settings as SettingsIcon, Bell, Shield, EyeOff, Monitor, Sun, Moon, Volume2, PhoneCall } from 'lucide-react';
import { getCallConfig } from '../services/callService';

export const Settings: React.FC = () => {
  const { settings, updateSettings, theme, setTheme, alertSoundEnabled, setAlertSoundEnabled, exotelConfigured } = useDemo();
  const [saveMessage, setSaveMessage] = useState(false);
  const [callCfg, setCallCfg] = useState<{ configured: boolean; webhookReady?: boolean } | null>(null);

  useEffect(() => {
    getCallConfig()
      .then(setCallCfg)
      .catch(() => setCallCfg(null));
  }, [exotelConfigured]);

  const triggerSaveAlert = () => {
    setSaveMessage(true);
    setTimeout(() => setSaveMessage(false), 1500);
  };

  const configured = callCfg?.configured ?? exotelConfigured;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader
        icon={<SettingsIcon className="text-primary-500" size={28} />}
        title="System Settings"
        description="Manage thresholds, notifications, emergency escalation routes, and portal configurations."
        actions={
          saveMessage ? (
            <Badge variant="success" className="px-3 py-1.5 font-semibold animate-pulse">
              ✓ Auto-Saved Configuration
            </Badge>
          ) : undefined
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-500/10 p-2 rounded-md text-primary-400">
                <Bell size={16} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Alarms & Notifications</CardTitle>
                <CardDescription>Escalation channels for urgent triggers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2 border-b border-navy-800">
              <div>
                <h4 className="text-sm font-medium text-navy-100">SMS Telephony Alarms</h4>
                <p className="text-xs text-navy-500 mt-0.5">SMS text to primary contacts on critical fall alerts.</p>
              </div>
              <Switch checked={settings.sms} onChange={(v) => { updateSettings({ sms: v }); triggerSaveAlert(); }} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-navy-800">
              <div>
                <h4 className="text-sm font-medium text-navy-100">Push App Alerts</h4>
                <p className="text-xs text-navy-500 mt-0.5">Urgent screen notification overlays on caregiver devices.</p>
              </div>
              <Switch checked={settings.push} onChange={(v) => { updateSettings({ push: v }); triggerSaveAlert(); }} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-medium text-navy-100">Email Health Digests</h4>
                <p className="text-xs text-navy-500 mt-0.5">Weekly report compilation of safety trends.</p>
              </div>
              <Switch checked={settings.email} onChange={(v) => { updateSettings({ email: v }); triggerSaveAlert(); }} />
            </div>

          </CardContent>
        </Card>

        {/* Emergency Alert Sound */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-500/10 p-2 rounded-md text-primary-400">
                <Volume2 size={16} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Emergency Alert Sound</CardTitle>
                <CardDescription>Audible alert configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-medium text-navy-100">Critical Alert Beep</h4>
                <p className="text-xs text-navy-500 mt-0.5">Plays an audible alert when a critical emergency is detected.</p>
              </div>
              <Switch checked={alertSoundEnabled} onChange={(v) => { setAlertSoundEnabled(v); triggerSaveAlert(); }} />
            </div>

            <div className="p-3 bg-navy-950/60 rounded-lg border border-navy-800">
              <p className="text-[11px] font-medium text-navy-400 leading-relaxed">
                {alertSoundEnabled 
                  ? 'Sound is enabled. A short professional beep will play when a new critical alert appears, and stop when acknowledged or resolved.'
                  : 'Sound is disabled. Critical alerts will only appear visually on the dashboard.'
                }
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Escalation Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-500/10 p-2 rounded-md text-primary-400">
                <Shield size={16} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Emergency Escalation</CardTitle>
                <CardDescription>Escalation protocol parameters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div>
              <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                Critical Response Window
              </label>
              <select
                value={settings.escalationMinutes}
                onChange={(e) => { updateSettings({ escalationMinutes: Number(e.target.value) }); triggerSaveAlert(); }}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              >
                <option value={2}>2 Minutes (Immediate Risk)</option>
                <option value={5}>5 Minutes (Default Standard)</option>
                <option value={10}>10 Minutes (Standard Monitor)</option>
                <option value={15}>15 Minutes (Extended Check)</option>
              </select>
              <p className="text-[10px] text-navy-500 mt-1 leading-normal">
                Time elapsed before SMS/alarms are sent to primary contacts if a critical event is not resolved manually.
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-navy-800">
              <div className="pr-3">
                <h4 className="text-sm font-medium text-navy-100 flex items-center gap-1.5">
                  <PhoneCall size={14} className="text-primary-400" />
                  Auto-call on escalation
                </h4>
                <p className="text-xs text-navy-500 mt-0.5">
                  When an alert is marked escalated, place a real call to the primary contact (then secondary if unanswered). Off by default — no real calls during development unless you enable this.
                </p>
              </div>
              <Switch
                checked={settings.autoCallEscalation}
                onChange={(v) => { updateSettings({ autoCallEscalation: v }); triggerSaveAlert(); }}
              />
            </div>

            <div className="p-3 bg-navy-950/60 rounded-lg border border-navy-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-navy-300">Exotel Voice API</span>
                <Badge variant={configured ? 'success' : 'warning'} className="text-[10px] font-semibold">
                  {configured ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
              <p className="text-[10px] text-navy-500 mt-1.5 leading-relaxed">
                {configured
                  ? 'Credentials loaded on the server from .env. Outbound calls are available. Never expose API keys in the browser.'
                  : 'Add EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_VIRTUAL_NUMBER, and EXOTEL_FROM_NUMBER to .env, then restart the server.'}
              </p>
              {configured && callCfg && (
                <p className="text-[10px] text-navy-600 mt-1">
                  Status webhooks: {callCfg.webhookReady ? 'ready (EXOTEL_PUBLIC_URL set)' : 'polling fallback (set EXOTEL_PUBLIC_URL for webhooks)'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-200 mb-1.5">
                Motion Deviancy Sensitivity
              </label>
              <select
                value={settings.sensitivity}
                onChange={(e) => { updateSettings({ sensitivity: e.target.value as 'Low' | 'Medium' | 'High' }); triggerSaveAlert(); }}
                className="w-full px-4 py-2.5 rounded-lg border border-navy-700 bg-navy-950 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              >
                <option value="Low">Low Sensitivity (Fewer warning flags)</option>
                <option value="Medium">Medium Sensitivity (Balanced baseline)</option>
                <option value="High">High Sensitivity (High frequency alerts)</option>
              </select>
            </div>

          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-500/10 p-2 rounded-md text-primary-400">
                <EyeOff size={16} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Privacy & Local Storage</CardTitle>
                <CardDescription>Configure data compliance and caching</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-medium text-navy-100">Privacy-First Data Mode</h4>
                <p className="text-xs text-navy-500 mt-0.5">
                  Mask precise sensor times in long term cloud caches. Keep telemetry purely local to the ESP32 Gateway.
                </p>
              </div>
              <Switch checked={settings.privacyMode} onChange={(v) => { updateSettings({ privacyMode: v }); triggerSaveAlert(); }} />
            </div>

          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-500/10 p-2 rounded-md text-primary-400">
                <Monitor size={16} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Visual Appearance</CardTitle>
                <CardDescription>Adjust dashboard layout themes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-medium text-navy-100">Layout Theme</h4>
                <p className="text-xs text-navy-500 mt-0.5">Toggle between standard light and dark designs.</p>
              </div>
              
              <div className="flex items-center gap-1.5 bg-navy-950 p-1 rounded-lg border border-navy-700">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                    theme === 'light'
                      ? 'bg-navy-800 text-primary-400'
                      : 'text-navy-500 hover:text-navy-300'
                  }`}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                    theme === 'dark'
                      ? 'bg-navy-800 text-primary-400'
                      : 'text-navy-500 hover:text-navy-300'
                  }`}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
};
