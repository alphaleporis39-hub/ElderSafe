import React, { useState } from 'react';
import {
  Shield,
  Heart,
  Pill,
  Mail,
  KeyRound,
  ArrowRight,
  Lock,
  Home,
  UserCheck,
} from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

/* ─── Inline SVG hero illustration ────────────────────────────────────────────
   Pure SVG — zero dependencies. A gentle home/heart/shield/connection concept
   representing an elder at home, cared for by a distant caregiver.
   Slow ambient animation driven by CSS classes from index.css.
   ─────────────────────────────────────────────────────────────────────────── */
const HeroIllustration: React.FC = () => (
  <div
    className="login-anim-illustration select-none pointer-events-none"
    aria-hidden="true"
    role="img"
    aria-label="ElderSafe: a home with a gentle protective glow, connecting an elder and caregiver"
  >
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hero-float"
    >
      {/* Outer ambient ring — very slow pulse */}
      <circle cx="60" cy="60" r="56" fill="rgba(255,107,122,0.03)" className="hero-pulse-ring" />
      <circle cx="60" cy="60" r="46" fill="rgba(10,14,26,0.6)" />

      {/* Home shape — soft dark */}
      <path
        d="M28 78 L28 48 L18 48 L18 32 L60 8 L102 32 L102 48 L92 48 L92 78 Z"
        fill="rgba(10,14,26,0.9)"
        stroke="rgba(255,107,122,0.2)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Home inner — slightly lighter */}
      <path
        d="M34 74 L34 50 L24 50 L24 38 L60 12 L96 38 L96 50 L86 50 L86 74 Z"
        fill="rgba(20,25,40,0.6)"
        stroke="rgba(255,107,122,0.1)"
        strokeWidth="1"
      />

      {/* Gentle protective arc over home — coral glow */}
      <path
        d="M20 58 C20 42 38 30 60 30 C82 30 100 42 100 58"
        stroke="rgba(255,107,122,0.3)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="hero-protective-arc"
      />
      <path
        d="M28 62 C28 48 44 38 60 38 C76 38 92 48 92 62"
        stroke="rgba(255,107,122,0.15)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        className="hero-protective-arc"
        style={{ animationDelay: '0.5s' }}
      />

      {/* Tiny heart inside home — the elder */}
      <path
        d="M60 68
           C60 68 52 62 52 57
           C52 54 54.5 52 57 53
           C58 53.5 59 54.5 60 55.5
           C61 54.5 62 53.5 63 53
           C65.5 52 68 54 68 57
           C68 62 60 68 60 68 Z"
        fill="rgba(255,107,122,0.85)"
        stroke="none"
        className="hero-heart"
      />

      {/* Small dot outside the arc — the caregiver, connected */}
      <circle
        cx="100"
        cy="30"
        r="3.5"
        fill="rgba(255,255,255,0.6)"
        className="hero-caregiver-dot"
      />
      {/* Connection line between home and caregiver — subtle */}
      <line
        x1="72"
        y1="42"
        x2="92"
        y2="36"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        className="hero-connection-line"
      />

      {/* Subtle breathing particles around the heart */}
      <circle cx="50" cy="56" r="1.5" fill="rgba(255,107,122,0.35)" className="hero-particle" style={{ animationDelay: '0s' }} />
      <circle cx="68" cy="52" r="1.2" fill="rgba(255,107,122,0.3)" className="hero-particle" style={{ animationDelay: '0.8s' }} />
      <circle cx="56" cy="46" r="1" fill="rgba(255,107,122,0.25)" className="hero-particle" style={{ animationDelay: '1.6s' }} />
    </svg>
  </div>
);

/* ─── Feature card data ───────────────────────────────────────────────────────
   Four human promises — not feature cards.
   Each represents a quiet commitment to everyday care.
   ───────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Pill,
    label: 'Medication Support',
    description: 'Gentle reminders and confirmation when medicines are taken.',
  },
  {
    icon: Home,
    label: 'Daily Routine',
    description: 'Notice meaningful changes in everyday activity — no indoor cameras.',
  },
  {
    icon: Shield,
    label: 'Fall & Safety',
    description: "Detect unusual safety events and bring them to the right person\u2019s attention.",
  },
  {
    icon: UserCheck,
    label: 'Privacy First',
    description: 'Safety monitoring designed to respect personal space.',
  },
] as const;

/* ─── Component ─────────────────────────────────────────────────────────────── */
export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('caregiver@eldersafe.org');
  const [password, setPassword] = useState('password123');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your caregiver email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 800);
  };

  const handleFillDemo = () => {
    setEmail('caregiver@eldersafe.org');
    setPassword('password123');
    setError('');
  };

  return (
    <main
      className="min-h-screen bg-[#0a0e1a] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#FF6B7A]/20 selection:text-white login-anim-bg dark"
      aria-label="ElderSafe caregiver login"
    >
      {/* Skip-to-content for keyboard users */}
      <a href="#login-form" className="skip-link">Skip to login form</a>

      {/* ── Ambient background lighting ─────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Deep dark base */}
        <div className="absolute inset-0 bg-[#0a0e1a]" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 login-grid-bg" />
        {/* Very subtle radial glow — top center */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#FF6B7A]/[0.02] blur-[120px]" />
        {/* Faint warm glow — right side behind login */}
        <div className="absolute top-1/3 -right-32 w-[350px] h-[400px] rounded-full bg-[#FF6B7A]/[0.015] blur-[100px]" />
        {/* Subtle center fill */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.008] blur-[80px]" />
      </div>

{/* ── Page content ────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:items-center">

          {/* ════════════════════════════════════════════════════════════
              LEFT COLUMN  —  Brand · Headline · Illustration · Features
              ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-8">

            {/* 1 ── Logo ───────────────────────────────────────────────── */}
            <div className="login-anim-logo space-y-3">
              {/* Privacy badge */}
              <div className="login-anim-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 text-xs font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B7A] animate-pulse shrink-0" aria-hidden="true" />
                <span>CARING DIGITAL PROTECTION · PRIVACY FIRST</span>
              </div>

              {/* Wordmark */}
              <div className="flex items-center gap-3">
                <div
                  className="bg-white/[0.04] border border-white/[0.06] p-2.5 rounded-xl flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <div className="flex items-center gap-0.5">
                    <Shield size={24} className="text-white/80 stroke-[2]" />
                    <Heart size={14} className="text-[#FF6B7A] fill-[#FF6B7A] -ml-1.5" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Elder<span className="text-[#FF6B7A]">Safe</span>
                </h1>
              </div>
            </div>

            {/* 2 ── Hero headline + illustration (side-by-side on sm+) ─── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6 gap-4">
              <div className="space-y-3 max-w-xl login-anim-headline flex-1">
                <h2
                  className="font-bold text-white tracking-tight leading-[1.12]"
                  style={{ fontSize: 'clamp(1.625rem, 4vw, 3rem)' }}
                >
                  Peace of mind for the people you care about.
                </h2>
                <p className="login-anim-sub text-sm sm:text-base text-white/50 leading-relaxed max-w-lg">
                  Quietly watches over daily routines, medicines and safety
                  signals, so families know when something needs attention.
                </p>
              </div>

              {/* Illustration — hidden on very small screens, visible on sm+ */}
              <div className="hidden sm:flex items-center justify-center shrink-0 self-center w-auto">
                <HeroIllustration />
              </div>
            </div>

            {/* 3 ── Feature promises ───────────────────────────────────────── */}
            <div className="login-anim-features space-y-3 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/25">
                Designed around everyday care
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map(({ icon: Icon, label, description }) => (
                  <div
                    key={label}
                    className="feature-card bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between space-y-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="feature-icon p-2 rounded-xl bg-white/[0.05] text-white/70 shrink-0">
                        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">{label}</h3>
                    </div>
                    <p className="text-xs text-white/45 leading-relaxed">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════════
              RIGHT COLUMN  —  Login card
              ════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 w-full max-w-md lg:max-w-none mx-auto login-anim-card">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5 relative overflow-hidden">
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B7A]/30 to-transparent" aria-hidden="true" />

              {/* Card header */}
              <div className="space-y-1 relative z-10">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-sm text-white/45">
                  Let's check in on your loved one.
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="bg-[#FF6B7A]/10 border border-[#FF6B7A]/20 text-[#FF6B7A] p-3.5 rounded-xl text-sm font-medium flex items-start gap-2.5"
                >
                  <span className="text-[#FF6B7A] mt-0.5 shrink-0" aria-hidden="true">•</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Login form */}
              <form
                id="login-form"
                onSubmit={handleSubmit}
                className="space-y-3.5 relative z-10"
                noValidate
              >
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/60 mb-1.5">
                    Caregiver email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                      <Mail size={15} aria-hidden="true" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-white/25 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B7A]/30 focus:border-[#FF6B7A]/40 transition-all duration-200"
                      placeholder="caregiver@eldersafe.org"
                      autoComplete="username"
                      aria-label="Caregiver email address"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/60 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                      <KeyRound size={15} aria-hidden="true" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-white/25 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B7A]/30 focus:border-[#FF6B7A]/40 transition-all duration-200"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-label="Password"
                    />
                  </div>
                </div>

                {/* Keep signed in */}
                <div className="flex items-center gap-2.5 pt-0.5">
                  <input
                    id="keep-signed-in"
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-white/[0.05] text-[#FF6B7A] focus:ring-[#FF6B7A]/30 cursor-pointer shrink-0"
                    aria-label="Keep me signed in"
                  />
                  <label htmlFor="keep-signed-in" className="text-sm text-white/45 font-medium cursor-pointer select-none">
                    Keep me signed in
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-btn w-full min-h-[48px] sm:min-h-[52px] flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-[#FF6B7A] hover:bg-[#FF5A6B] active:bg-[#E85A68] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B7A] focus:ring-offset-[#0a0e1a] disabled:opacity-50 cursor-pointer transition-all duration-200"
                  aria-label={isLoading ? 'Opening your dashboard…' : 'Continue to ElderSafe'}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        aria-hidden="true"
                      />
                      <span>Opening dashboard…</span>
                    </span>
                  ) : (
                    <>
                      <span>Continue to ElderSafe</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo helper */}
              <div className="text-center pt-1 border-t border-white/[0.06] relative z-10">
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-xs text-white/35 hover:text-white/60 transition-colors duration-200 inline-flex items-center gap-1.5 focus:outline-none focus:underline cursor-pointer"
                  title="Click to fill demo credentials"
                  aria-label="Fill demo login credentials"
                >
                  <span>Demo access:</span>
                  <code className="bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06] text-[#FF6B7A]/80 font-mono text-[11px]">
                    caregiver@eldersafe.org
                  </code>
                </button>
              </div>

              {/* Trust / security reassurance */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3.5 flex items-start gap-3 text-white/50 relative z-10">
                <Lock size={14} className="text-white/40 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white/80">
                    Built for everyday peace of mind.
                  </p>
                  <p className="text-[11px] text-white/35 leading-normal">
                    Passive monitoring · No indoor cameras · Secure caregiver access
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full border-t border-white/[0.04] py-4 px-4 text-center">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#FF6B7A]/60">
            Hackfinity
          </p>
          <p className="text-[11px] text-white/30 font-medium">
            Built with <span className="text-[#FF6B7A]/70" aria-label="love">❤</span> for elderly safety and caregiver peace of mind
          </p>
          <p className="text-[10px] text-white/20 font-medium tracking-wide">
            Saniya&nbsp;•&nbsp;Mohit&nbsp;•&nbsp;Aryan&nbsp;•&nbsp;Bhavya&nbsp;•&nbsp;Anantshree&nbsp;•&nbsp;Harsh
          </p>
        </div>
      </footer>
    </main>
  );
};
