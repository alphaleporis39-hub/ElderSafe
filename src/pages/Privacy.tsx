import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/Primitives';
import { 
  Shield, EyeOff, Lock, Server, Wifi, Camera, 
  CheckCircle, Info, Cpu, Cloud, LayoutDashboard, Antenna
} from 'lucide-react';

export const Privacy: React.FC = () => {
  const privacyPrinciples = [
    {
      icon: Camera,
      title: 'No Continuous Camera Monitoring',
      description: 'ElderSafe does not use cameras or video feeds. All monitoring is done through passive infrared (PIR) motion sensors, door contacts, and wearable accelerometers.',
      status: 'active',
      badge: 'No Cameras',
      badgeVariant: 'success' as const,
    },
    {
      icon: Wifi,
      title: 'Sensor-Based Monitoring Only',
      description: 'Activity is inferred from motion patterns, door events, and wearable telemetry — not visual surveillance. The system detects presence and movement, not images.',
      status: 'active',
      badge: 'Sensors Only',
      badgeVariant: 'success' as const,
    },
    {
      icon: Lock,
      title: 'Minimal Data Collection',
      description: 'Only essential telemetry is stored: motion events, medication box events, door events, and wearable accelerometer/gyroscope data. No audio, no video, no biometric data.',
      status: 'active',
      badge: 'Minimal',
      badgeVariant: 'success' as const,
    },
    {
      icon: Server,
      title: 'Secure Caregiver Access',
      description: 'Only authorized caregivers can access the dashboard. All data transmission is encrypted. Firebase security rules ensure only authenticated users can read/write data.',
      status: 'active',
      badge: 'Encrypted',
      badgeVariant: 'success' as const,
    },
    {
      icon: EyeOff,
      title: 'Local Processing Where Possible',
      description: 'Fall detection and routine analysis run on the ESP32 gateway locally. Cloud processing is used only for dashboard aggregation and alert delivery.',
      status: 'active',
      badge: 'Local-First',
      badgeVariant: 'success' as const,
    },
    {
      icon: Shield,
      title: 'Privacy-First Data Mode',
      description: 'Enable Privacy Mode in Settings to mask precise sensor times in cloud caches and keep telemetry local to the ESP32 gateway.',
      status: 'configurable',
      badge: 'Configurable',
      badgeVariant: 'info' as const,
    },
  ];

  const dataFlow = [
    { step: '1', label: 'Sensors', detail: 'PIR, Door, Wearable collect motion data', icon: Antenna },
    { step: '2', label: 'ESP32 Gateway', detail: 'Local processing, fall detection, anomaly scoring', icon: Cpu },
    { step: '3', label: 'Firebase (Optional)', detail: 'Encrypted cloud sync for remote dashboard access', icon: Cloud },
    { step: '4', label: 'Caregiver Dashboard', detail: 'Real-time monitoring, alerts, analytics', icon: LayoutDashboard },
  ];

  const faq = [
    {
      q: 'Does ElderSafe use cameras?',
      a: 'No. ElderSafe uses only PIR motion sensors, door contacts, and wearable accelerometers. No cameras, microphones, or biometric scanners are used.',
    },
    {
      q: 'Where is my data stored?',
      a: 'Data is stored on the ESP32 gateway locally. If Firebase is configured, encrypted copies are synced to the cloud for remote dashboard access. You can disable cloud sync entirely in Settings.',
    },
    {
      q: 'Who can access my data?',
      a: 'Only authorized caregivers with valid login credentials. Firebase security rules enforce authentication and authorization on all data access.',
    },
    {
      q: 'Can I delete my data?',
      a: 'Yes. All data is stored locally in your browser (localStorage) and on your Firebase project. You can clear browser data or delete Firebase records at any time.',
    },
    {
      q: 'Is the system HIPAA compliant?',
      a: 'ElderSafe is designed with privacy-first principles. While we do not claim HIPAA certification, the system minimizes data collection, uses encryption, and supports local-only processing.',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <PageHeader
        icon={<Shield className="text-primary-400" size={20} />}
        title="Privacy Center"
        description="How ElderSafe protects your data and respects your privacy."
        actions={
          <Badge variant="success" className="px-3 py-1.5 font-semibold">
            Privacy-First Design
          </Badge>
        }
      />

      {/* Privacy Principles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {privacyPrinciples.map((principle, idx) => {
          const Icon = principle.icon;
          return (
            <Card key={idx} className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary-500/10 text-primary-400 shrink-0 border border-primary-500/20">
                  <Icon size={17} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{principle.title}</h3>
                    <Badge variant={principle.badgeVariant} className="text-[9px] px-1.5 py-0.5">
                      {principle.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-navy-400 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Data Flow */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Data Flow Architecture</CardTitle>
            <CardDescription>How sensor data moves through the ElderSafe system</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {dataFlow.map((step, idx) => (
              <React.Fragment key={step.step}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-primary-500/10 border border-primary-500/25 flex items-center justify-center text-primary-400 shrink-0">
                    <step.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-navy-900 dark:text-white">{step.label}</h4>
                    <p className="text-[11px] font-semibold text-navy-500 dark:text-navy-400 leading-tight">{step.detail}</p>
                  </div>
                </div>
                {idx < dataFlow.length - 1 && (
                  <div className="hidden sm:block text-navy-600 text-lg shrink-0">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
            <CardDescription>Common privacy and data questions</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {faq.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-navy-950/60 border border-navy-800">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-primary-500/10 text-primary-400 shrink-0 mt-0.5">
                  <Info size={14} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{item.q}</h4>
                  <p className="text-xs text-navy-400 leading-relaxed">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Commitment */}
      <div className="p-5 rounded-xl bg-navy-900 border border-navy-800">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 shrink-0">
            <CheckCircle size={20} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white mb-1">Our Privacy Commitment</h3>
            <p className="text-sm text-navy-400 leading-relaxed max-w-2xl">
              ElderSafe is built on the principle that safety monitoring should never come at the cost of privacy. 
              We use the minimum data necessary, process locally where possible, and give you full control over 
              your data. No cameras. No microphones. No biometrics. Just the essential sensors needed to keep 
              your loved ones safe.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
