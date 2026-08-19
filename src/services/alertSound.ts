let audioCtx: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let emergencyBeepInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, startTime: number, duration: number, volume: number, type: OscillatorType = 'sine'): OscillatorNode {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.linearRampToValueAtTime(volume, startTime + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
  activeOscillators.push(osc);
  osc.onended = () => {
    activeOscillators = activeOscillators.filter(o => o !== osc);
  };
  return osc;
}

// Soft single beep - for opening Medicine Check screen
export function playOpenBeep(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(660, now, 0.1, 0.15);
  } catch { /* Silently fail */ }
}

// Clear confirmation beep - for successful medicine check
export function playConfirmBeep(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(880, now, 0.12, 0.25);
    playTone(1100, now + 0.14, 0.12, 0.25);
  } catch { /* Silently fail */ }
}

// Distinct alert pattern - for missed/urgent medicine
export function playAlertPattern(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    playTone(880, now, 0.15, 0.3);
    playTone(660, now + 0.2, 0.15, 0.3);
    playTone(880, now + 0.4, 0.15, 0.3);
    playTone(1100, now + 0.6, 0.2, 0.35);
  } catch { /* Silently fail */ }
}

// Single double-beep burst (used by the repeating loop)
function playEmergencyBeepBurst(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const frequencies = [880, 660];
    frequencies.forEach((freq, i) => {
      playTone(freq, now + i * 0.18, 0.15, 0.3);
    });
  } catch { /* Silently fail */ }
}

// Start continuous repeating beep for active CRITICAL alerts
export function playAlertBeep(): void {
  // Prevent overlapping loops
  if (emergencyBeepInterval) return;
  // Play first burst immediately
  playEmergencyBeepBurst();
  // Then repeat every 1.5 seconds
  emergencyBeepInterval = setInterval(() => {
    playEmergencyBeepBurst();
  }, 1500);
}

export function stopAlertBeep(): void {
  if (emergencyBeepInterval) {
    clearInterval(emergencyBeepInterval);
    emergencyBeepInterval = null;
  }
  activeOscillators.forEach(osc => {
    try { osc.stop(); } catch { /* Already stopped */ }
  });
  activeOscillators = [];
}
