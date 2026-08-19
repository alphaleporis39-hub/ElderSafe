import React, { useState } from 'react';
import { useDemo } from '../context/DemoContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Switch } from '../components/ui/Switch';
import { Badge } from '../components/ui/Badge';
import { Settings as SettingsIcon, Bell, Shield, EyeOff, Monitor, Sun, Moon, Volume2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, theme, setTheme, alertSoundEnabled, setAlertSoundEnabled } = useDemo();
  const [saveMessage, setSaveMessage] = useState(false);

  const triggerSaveAlert = () => {
    setSaveMessage(true);
    setTimeout(() => setSaveMessage(false), 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-navy-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="text-primary-500" size={28} />
            System Settings
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1 font-medium">
            Manage thresholds, notifications, emergency escalation routes, and portal configurations.
          </p>
        </div>
        {saveMessage && (
          <Badge variant="success" className="px-3.5 py-1.5 font-bold animate-pulse">
            ✓ Auto-Saved Configuration
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-50 dark:bg-primary-950 p-2 rounded-xl text-primary-500 dark:text-primary-400">
                <Bell size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Alarms & Notifications</CardTitle>
                <CardDescription>Escalation channels for urgent triggers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2 border-b border-navy-50 dark:border-navy-850">
              <div>
                <h4 className="text-sm font-extrabold text-navy-900 dark:text-navy-200">SMS Telephony Alarms</h4>
                <p className="text-xs text-navy-450 dark:text-navy-400 mt-0.5">SMS text to primary contacts on critical fall alerts.</p>
              </div>
              <Switch checked={settings.sms} onChange={(v) => { updateSettings({ sms: v }); triggerSaveAlert(); }} />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-navy-50 dark:border-navy-850">
              <div>
                <h4 className="text-sm font-extrabold text-navy-900 dark:text-navy-200">Push App Alerts</h4>
                <p className="text-xs text-navy-450 dark:text-navy-400 mt-0.5">Urgent screen notification overlays on caregiver devices.</p>
              </div>
              <Switch checked={settings.push} onChange={(v) => { updateSettings({ push: v }); triggerSaveAlert(); }} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-extrabold text-navy-900 dark:text-navy-200">Email Health Digests</h4>
                <p className="text-xs text-navy-450 dark:text-navy-400 mt-0.5">Weekly report compilation of safety trends.</p>
              </div>
              <Switch checked={settings.email} onChange={(v) => { updateSettings({ email: v }); triggerSaveAlert(); }} />
            </div>

          </CardContent>
        </Card>

        {/* Emergency Alert Sound */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-50 dark:bg-primary-950 p-2 rounded-xl text-primary-500 dark:text-primary-400">
                <Volume2 size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Emergency Alert Sound</CardTitle>
                <CardDescription>Audible alert configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-extrabold text-navy-900 dark:text-navy-200">Critical Alert Beep</h4>
                <p className="text-xs text-navy-450 dark:text-navy-400 mt-0.5">Plays an audible alert when a critical emergency is detected.</p>
              </div>
              <Switch checked={alertSoundEnabled} onChange={(v) => { setAlertSoundEnabled(v); triggerSaveAlert(); }} />
            </div>

            <div className="p-3 bg-navy-50 dark:bg-navy-800/50 rounded-xl border border-navy-100 dark:border-navy-750">
              <p className="text-[11px] font-semibold text-navy-500 dark:text-navy-400 leading-relaxed">
                {alertSoundEnabled 
                  ? '🟢 Sound is enabled. A short professional beep will play when a new critical alert appears, and stop when acknowledged or resolved.'
                  : '⚪ Sound is disabled. Critical alerts will only appear visually on the dashboard.'
                }
              </p>
            </div>

          </CardContent>
        </Card>

        {/* Escalation Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary-50 dark:bg-primary-950 p-2 rounded-xl text-primary-500 dark:text-primary-400">
                <Shield size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Emergency Escalation</CardTitle>
                <CardDescription>Escalation protocol parameters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div>
              <label className="block text-sm font-bold text-navy-700 dark:text-navy-200 mb-1.5">
                Critical Response Window
              </label>
              <select
                value={settings.escalationMinutes}
                onChange={(e) => { updateSettings({ escalationMinutes: Number(e.target.value) }); triggerSaveAlert(); }}
                className="w-full px-4 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
              >
                <option value={2}>2 Minutes (Immediate Risk)</option>
                <option value={5}>5 Minutes (Default Standard)</option>
                <option value={10}>10 Minutes (Standard Monitor)</option>
                <option value={15}>15 Minutes (Extended Check)</option>
              </select>
              <p className="text-[10px] text-navy-450 mt-1 leading-normal">
                Time elapsed before SMS/alarms are sent to primary contacts if a critical event is not resolved manually.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-navy-700 dark:text-navy-200 mb-1.5">
                Motion Deviancy Sensitivity
              </label>
              <select
                value={settings.sensitivity}
                onChange={(e) => { updateSettings({ sensitivity: e.target.value as 'Low' | 'Medium' | 'High' }); triggerSaveAlert(); }}
                className="w-full px-4 py-2.5 rounded-xl border border-navy-250 dark:border-navy-750 bg-navy-50 dark:bg-navy-850 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
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
              <div className="bg-primary-50 dark:bg-primary-950 p-2 rounded-xl text-primary-500 dark:text-primary-400">
                <EyeOff size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Privacy & Local Storage</CardTitle>
                <CardDescription>Configure data compliance and caching</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-extrabold text-navy-900 dark:text-navy-200">Privacy-First Data Mode</h4>
                <p className="text-xs text-navy-450 dark:text-navy-400 mt-0.5">
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
              <div className="bg-primary-50 dark:bg-primary-950 p-2 rounded-xl text-primary-500 dark:text-primary-400">
                <Monitor size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold">Visual Appearance</CardTitle>
                <CardDescription>Adjust dashboard layout themes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-extrabold text-navy-900 dark:text-navy-200">Layout Theme</h4>
                <p className="text-xs text-navy-450 dark:text-navy-400 mt-0.5">Toggle between standard light and dark designs.</p>
              </div>
              
              <div className="flex items-center gap-1.5 bg-navy-100 dark:bg-navy-800 p-1 rounded-xl border border-navy-200 dark:border-navy-700">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    theme === 'light'
                      ? 'bg-white text-primary-600 shadow-sm ring-2 ring-primary-200 dark:ring-primary-800'
                      : 'text-navy-500 hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200'
                  }`}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    theme === 'dark'
                      ? 'bg-navy-950 text-primary-400 shadow-sm ring-2 ring-primary-800 dark:ring-primary-500'
                      : 'text-navy-500 hover:text-navy-300 dark:text-navy-400 dark:hover:text-navy-200'
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
