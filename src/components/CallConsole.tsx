import React, { useEffect, useMemo, useState } from 'react';
import { useDemo } from '../context/DemoContext';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneCall,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  History,
  FlaskConical,
} from 'lucide-react';
import {
  formatDuration,
  isTerminalStatus,
  statusLabel,
  type CallRecord,
} from '../services/callService';

function statusColor(status: CallRecord['status']): string {
  switch (status) {
    case 'ready':
      return 'bg-navy-700/60 text-navy-200 border-navy-600';
    case 'calling':
      return 'bg-primary-500/15 text-primary-300 border-primary-500/40';
    case 'ringing':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    case 'connected':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    case 'completed':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
    case 'failed':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    case 'no_answer':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/40';
    default:
      return 'bg-navy-700/60 text-navy-200 border-navy-600';
  }
}

function StatusIcon({ status }: { status: CallRecord['status'] }) {
  const cls = 'w-5 h-5';
  switch (status) {
    case 'connected':
      return <PhoneIncoming className={`${cls} text-emerald-400`} />;
    case 'ringing':
      return <PhoneCall className={`${cls} text-amber-400 animate-pulse`} />;
    case 'calling':
      return <Phone className={`${cls} text-primary-400 animate-pulse`} />;
    case 'completed':
      return <CheckCircle2 className={`${cls} text-sky-400`} />;
    case 'failed':
      return <XCircle className={`${cls} text-rose-400`} />;
    case 'no_answer':
      return <AlertTriangle className={`${cls} text-orange-400`} />;
    default:
      return <Phone className={`${cls} text-navy-300`} />;
  }
}

/**
 * Professional emergency communication console (full-screen overlay).
 * Replaces the old simulated call screen. Never fakes call status.
 */
export const CallConsole: React.FC = () => {
  const { activeCall, callHistory, clearActiveCall, endActiveCall, exotelConfigured } =
    useDemo();
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);

  const call = activeCall;

  const initials = useMemo(() => {
    if (!call?.toLabel) return '??';
    const words = call.toLabel.replace(/^Escalation\s*→\s*/i, '').trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }, [call?.toLabel]);

  // Duration timer — ticks only while CONNECTED; snaps to server duration on terminal.
  useEffect(() => {
    if (!call) {
      setElapsed(0);
      return;
    }
    if (call.status === 'connected') {
      const base = call.connectedAt
        ? Math.max(0, Math.floor((Date.now() - Date.parse(call.connectedAt)) / 1000))
        : 0;
      setElapsed(base);
      const iv = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(iv);
    }
    if (isTerminalStatus(call.status)) {
      setElapsed(call.durationSec || 0);
    }
    if (call.status === 'calling' || call.status === 'ringing') {
      setElapsed(0);
    }
  }, [call?.id, call?.status, call?.connectedAt, call?.durationSec]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!call) return null;

  const isDemo = call.demo;
  const terminal = isTerminalStatus(call.status);

  const handleEnd = async () => {
    if (!call || terminal) {
      clearActiveCall();
      return;
    }
    setEnding(true);
    try {
      await endActiveCall();
    } finally {
      setEnding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-navy-950 flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Emergency call console"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-navy-800 bg-navy-950/95 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-navy-800 border border-navy-700 p-1.5 rounded-lg text-primary-400">
            <Radio size={16} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Emergency Communication Console
            </div>
            <div className="text-[10px] text-navy-500 font-semibold">
              ElderSafe · Outbound caregiver call
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="px-2.5 py-1 rounded-md bg-accent-950/80 border border-accent-800/50 text-accent-300 text-[10px] font-black uppercase tracking-widest">
              <FlaskConical size={11} className="inline mr-1 -mt-0.5" />
              Demo
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${statusColor(
              call.status
            )}`}
          >
            {statusLabel(call.status)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 sm:p-10 gap-6">
        {/* Avatar */}
        <div
          className={`relative w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ${
            call.status === 'calling' || call.status === 'ringing' ? 'animate-pulse' : ''
          }`}
        >
          <span className="text-3xl font-black text-white">{initials}</span>
          {call.status === 'connected' && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-4 border-navy-950 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          )}
        </div>

        {/* Target */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <StatusIcon status={call.status} />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {statusLabel(call.status)}
            </h2>
          </div>
          <p className="text-lg font-semibold text-primary-400">
            {call.toLabel || 'Emergency contact'}
          </p>
          <p className="text-sm font-mono text-navy-400">{call.to}</p>
        </div>

        {/* Duration / status line */}
        <div className="text-center space-y-2">
          {call.status === 'connected' && (
            <p className="text-4xl font-mono font-black text-emerald-400 tabular-nums">
              {formatDuration(elapsed)}
            </p>
          )}
          {(call.status === 'calling' || call.status === 'ringing') && (
            <p className="text-sm text-navy-400 animate-pulse">
              {call.status === 'calling'
                ? 'Dialing via Exotel…'
                : 'Ringing on carrier network…'}
            </p>
          )}
          {terminal && call.status === 'completed' && (
            <p className="text-sm text-sky-300 font-semibold">
              Duration {formatDuration(call.durationSec || elapsed)}
              {call.reason ? ` · ${call.reason}` : ''}
            </p>
          )}
          {terminal && call.status === 'no_answer' && (
            <p className="text-sm text-orange-300 font-semibold">
              Contact did not answer{call.reason ? ` · ${call.reason}` : ''}
            </p>
          )}
          {terminal && call.status === 'failed' && (
            <div className="max-w-md mx-auto space-y-1">
              <p className="text-sm text-rose-300 font-semibold">
                Call failed{call.reason ? ` · ${call.reason}` : ''}
              </p>
              {call.error && (
                <p className="text-xs text-rose-400/90 bg-rose-950/40 border border-rose-900/50 rounded-lg px-3 py-2">
                  {call.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Unconfigured notice for real calls */}
        {!isDemo && !exotelConfigured && (
          <div className="max-w-md w-full p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-left">
            <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
              Exotel not configured
            </p>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Add EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_VIRTUAL_NUMBER, and
              EXOTEL_FROM_NUMBER to your project <code className="font-mono">.env</code> file,
              then restart the dev server. Real calls will not place until configured.
            </p>
          </div>
        )}

        {isDemo && (
          <div className="max-w-md w-full p-3 rounded-xl border border-accent-800/40 bg-accent-950/40 text-center">
            <p className="text-[11px] font-bold text-accent-300 uppercase tracking-widest">
              Demo simulation — no real phone call is placed
            </p>
          </div>
        )}

        {/* Call history (compact) */}
        {terminal && callHistory.length > 0 && (
          <div className="w-full max-w-md">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-navy-500 uppercase tracking-wider">
              <History size={12} /> Recent calls
            </div>
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {callHistory.slice(0, 6).map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-navy-900/80 border border-navy-800"
                >
                  <span className="truncate text-navy-200 font-medium">
                    {h.toLabel || h.to}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {h.demo && (
                      <span className="text-[9px] font-black text-accent-400 uppercase">
                        Demo
                      </span>
                    )}
                    <span
                      className={`font-semibold ${
                        h.status === 'completed'
                          ? 'text-sky-400'
                          : h.status === 'connected'
                          ? 'text-emerald-400'
                          : h.status === 'no_answer'
                          ? 'text-orange-400'
                          : h.status === 'failed'
                          ? 'text-rose-400'
                          : 'text-navy-400'
                      }`}
                    >
                      {statusLabel(h.status)}
                    </span>
                    <span className="font-mono text-navy-500">
                      {formatDuration(h.durationSec || 0)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-navy-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-3">
        {!terminal ? (
          <button
            onClick={handleEnd}
            disabled={ending}
            className="w-full sm:w-auto sm:min-w-[220px] py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-2xl text-base font-extrabold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-900/30"
            aria-label="End call"
          >
            <PhoneOff size={20} />
            {ending ? 'Ending…' : 'End Call'}
          </button>
        ) : (
          <button
            onClick={clearActiveCall}
            className="w-full sm:w-auto sm:min-w-[220px] py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-base font-extrabold flex items-center justify-center gap-2 transition-colors"
            aria-label="Close call console"
          >
            <CheckCircle2 size={20} />
            Close Console
          </button>
        )}
      </div>
    </div>
  );
};
