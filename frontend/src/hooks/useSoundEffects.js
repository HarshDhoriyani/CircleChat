import { useState, useCallback } from 'react';

// Global shared AudioContext singleton
let globalAudioCtx = null;
let isUnlocked = false;

const getOrCreateAudioContext = (attemptResume = false) => {
  if (typeof window === 'undefined') return null;
  try {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        globalAudioCtx = new AudioCtx();
      }
    }
    if (attemptResume && globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
  } catch {}
  return globalAudioCtx;
};

// Global user-gesture unlocker for browser autoplay policies
const unlockAudioPipeline = () => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getOrCreateAudioContext(true);
    if (ctx && ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          isUnlocked = true;
          // Prime a silent 1-sample buffer to warm up browser audio engine
          try {
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
          } catch {}
        })
        .catch(() => {});
    } else if (ctx && ctx.state === 'running') {
      isUnlocked = true;
    }
  } catch {}
};

// Attach passive gesture listeners
if (typeof window !== 'undefined') {
  ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click'].forEach((event) => {
    window.addEventListener(event, unlockAudioPipeline, { passive: true });
    document.addEventListener(event, unlockAudioPipeline, { passive: true });
  });
}

// Fallback WAV data URI generator for background autoplay tolerance
const wavCache = {};
const generateWavDataUri = (notes = [[880, 0, 0.2], [1318.5, 0.08, 0.3]], duration = 0.45) => {
  try {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * duration);
    const dataByteLength = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataByteLength);
    const view = new DataView(buffer);

    const writeStr = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataByteLength, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataByteLength, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let val = 0;
      for (const [freq, start, dur] of notes) {
        if (t >= start && t <= start + dur) {
          const localT = t - start;
          const decay = Math.exp(-localT * 10);
          val += Math.sin(2 * Math.PI * freq * localT) * decay * 0.45;
        }
      }
      const clamped = Math.max(-1, Math.min(1, val));
      view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + window.btoa(binary);
  } catch {
    return null;
  }
};

const getFallbackWavUri = (type) => {
  if (wavCache[type]) return wavCache[type];
  if (typeof window === 'undefined') return null;

  if (type === 'notification') {
    // E5 (659Hz) + A5 (880Hz) + C#6 (1108Hz) bell chord
    wavCache[type] = generateWavDataUri(
      [
        [659.25, 0, 0.3],
        [880.0, 0.08, 0.35],
        [1108.73, 0.16, 0.35],
      ],
      0.55
    );
  } else if (type === 'receive') {
    // Dual pop (720Hz -> 960Hz)
    wavCache[type] = generateWavDataUri(
      [
        [720, 0, 0.06],
        [960, 0.04, 0.12],
      ],
      0.2
    );
  } else if (type === 'send') {
    // Soft upward chime (580Hz -> 880Hz)
    wavCache[type] = generateWavDataUri(
      [
        [580, 0, 0.06],
        [880, 0.05, 0.1],
      ],
      0.18
    );
  } else if (type === 'ai') {
    wavCache[type] = generateWavDataUri(
      [
        [520, 0, 0.15],
        [1040, 0.1, 0.25],
      ],
      0.35
    );
  }
  return wavCache[type];
};

const playFallbackAudio = (type) => {
  try {
    const uri = getFallbackWavUri(type);
    if (!uri) return;
    const audio = new Audio(uri);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
};

/**
 * Web Audio API synthesizer for crisp real-time sounds with mute toggle
 */
export const useSoundEffects = () => {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('aether_sound_muted') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aether_sound_muted', String(next));
      } catch {}
      return next;
    });
  }, []);

  const playSound = useCallback(
    (type = 'notification') => {
      try {
        if (localStorage.getItem('aether_sound_muted') === 'true') {
          return;
        }

        const ctx = getOrCreateAudioContext(true);

        if (!ctx) {
          playFallbackAudio(type);
          return;
        }

        if (ctx.state === 'running') {
          renderTone(ctx, type);
          return;
        }

        if (ctx.state === 'suspended') {
          let played = false;
          ctx
            .resume()
            .then(() => {
              if (!played) {
                played = true;
                renderTone(ctx, type);
              }
            })
            .catch(() => {
              if (!played) {
                played = true;
                playFallbackAudio(type);
              }
            });

          // Timeout fallback: if audio context hasn't resumed within 80ms, play via Audio element
          setTimeout(() => {
            if (!played) {
              played = true;
              playFallbackAudio(type);
            }
          }, 80);
          return;
        }

        renderTone(ctx, type);
      } catch {
        playFallbackAudio(type);
      }
    },
    []
  );

  return { playSound, isMuted, toggleMute };
};

const renderTone = (ctx, type) => {
  try {
    const now = ctx.currentTime;

    if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtPoint(580, now);
      osc.frequency.exponentialRampToValueAtPoint(880, now + 0.08);
      gain.gain.setValueAtPoint(0.12, now);
      gain.gain.exponentialRampToValueAtPoint(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'receive') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtPoint(720, now);
      osc.frequency.exponentialRampToValueAtPoint(960, now + 0.06);
      gain.gain.setValueAtPoint(0.18, now);
      gain.gain.exponentialRampToValueAtPoint(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'notification') {
      // Bell 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtPoint(659.25, now);
      gain1.gain.setValueAtPoint(0.3, now);
      gain1.gain.exponentialRampToValueAtPoint(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Bell 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtPoint(880, now + 0.09);
      gain2.gain.setValueAtPoint(0.001, now);
      gain2.gain.setValueAtPoint(0.35, now + 0.09);
      gain2.gain.exponentialRampToValueAtPoint(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.55);

      // Bell 3: C#6 (1108.73 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtPoint(1108.73, now + 0.18);
      gain3.gain.setValueAtPoint(0.001, now);
      gain3.gain.setValueAtPoint(0.2, now + 0.18);
      gain3.gain.exponentialRampToValueAtPoint(0.001, now + 0.6);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.18);
      osc3.stop(now + 0.6);
    } else if (type === 'ai') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtPoint(520, now);
      osc.frequency.exponentialRampToValueAtPoint(1040, now + 0.2);
      gain.gain.setValueAtPoint(0.15, now);
      gain.gain.exponentialRampToValueAtPoint(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    playFallbackAudio(type);
  }
};

export default useSoundEffects;
