// Web Audio API Synthesizer for Real-Time Keyword Alerts

let audioCtx = null;
let isMuted = localStorage.getItem('omni_audio_muted') === 'true';

const getAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const setMutedState = (muted) => {
  isMuted = muted;
  localStorage.setItem('omni_audio_muted', muted ? 'true' : 'false');
};

export const getMutedState = () => isMuted;

export const playAlertSound = (priority = 'HIGH') => {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (priority === 'CRITICAL') {
      // Alarm double ping
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1109, now + 0.1); // C#6
      osc.frequency.setValueAtTime(880, now + 0.2); // A5
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);

    } else if (priority === 'HIGH') {
      // Pleasant rising chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);

    } else if (priority === 'MEDIUM') {
      // Soft single pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);

    } else {
      // Low subtle tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    console.warn('Audio play error:', e);
  }
};
