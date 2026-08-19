import React, { useState } from 'react';
import { Shield, Heart, Lock, CheckCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('caregiver@eldersafe.org');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/8 rounded-full blur-3xl" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-5 relative z-10">
        <div className="inline-flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-2xl text-white shadow-lg shadow-primary-500/25 mx-auto">
          <div className="flex items-center gap-1">
            <Shield size={32} className="stroke-[2.5]" />
            <Heart size={18} className="fill-white stroke-white -ml-1" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Elder<span className="text-primary-400">Safe</span>
        </h2>
        <p className="text-sm text-navy-300 max-w-xs mx-auto leading-relaxed">
          Privacy-preserving safety monitoring for seniors living alone.
        </p>

        {/* Team Watermark */}
        <div className="pt-4 pb-2 space-y-1.5">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary-400/70">
            Hackfinity
          </p>
          <p className="text-[11px] text-navy-400/60 font-medium">
            Built with <span className="text-primary-400/70">❤</span> by the team
          </p>
          <p className="text-[10px] text-navy-500/50 font-medium tracking-wide">
            Saniya &nbsp;•&nbsp; Mohit &nbsp;•&nbsp; Aryan &nbsp;•&nbsp; Bhavya &nbsp;•&nbsp; Anantshree &nbsp;•&nbsp; Harsh
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl grid md:grid-cols-2 bg-white/[0.03] backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/[0.06] relative z-10">
        
        {/* Marketing/Info Panel */}
        <div className="bg-gradient-to-br from-primary-600/90 via-primary-700/90 to-accent-800/80 p-8 sm:p-10 text-white flex flex-col justify-between space-y-8">
          <div className="space-y-3">
            <h3 className="text-lg font-bold tracking-tight">System Highlights</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              ElderSafe protects seniors using passive PIR sensors and wearable telemetry, respecting privacy without indoor video cameras.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg text-white/90 mt-0.5 shrink-0">
                <CheckCircle size={14} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Fall Detection & Telemetry</h4>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">High-g impact wearable with immediate emergency alerts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg text-white/90 mt-0.5 shrink-0">
                <CheckCircle size={14} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Routine & Deviancy Checks</h4>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">Detects late wake-ups, nocturnal activities, and skipped meals.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-white/10 p-1.5 rounded-lg text-white/90 mt-0.5 shrink-0">
                <CheckCircle size={14} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Smart Medication Triggers</h4>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">Monitors medicine boxes and alerts if doses are missed.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/50 text-xs border-t border-white/10 pt-4">
            <Lock size={12} />
            <span>End-to-End Encryption Enabled</span>
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white/[0.02]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-200 mb-1.5">
                Caregiver Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium transition-all text-sm"
                placeholder="caregiver@eldersafe.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-200 mb-1.5">
                Access Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-navy-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 font-medium transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500/50 border-white/20 rounded bg-white/5"
                />
                <label htmlFor="remember-me" className="ml-2 block text-navy-300 font-medium text-xs">
                  Remember this device
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-navy-950 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
              aria-label={isLoading ? 'Signing in...' : 'Sign in to ElderSafe dashboard'}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Authenticating...
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <span className="text-xs text-navy-500">
              Demo: <code className="bg-white/5 px-1.5 py-0.5 rounded text-primary-400 font-bold font-mono">caregiver@eldersafe.org</code> / <code className="bg-white/5 px-1.5 py-0.5 rounded text-primary-400 font-bold font-mono">password123</code>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
