import { useSettings } from '../settings/store';

/**
 * 파일 없이 Web Audio로 합성하는 효과음. 오프라인에서도 동작하고 용량이 0.
 * 새 효과음은 SOUNDS에 음표 배열로 추가하면 된다.
 */
type Note = { f: number; d: number; t?: number; type?: OscillatorType; v?: number };

const SOUNDS = {
  tap: [{ f: 660, d: 0.05, type: 'sine', v: 0.15 }],
  select: [{ f: 520, d: 0.06, type: 'triangle', v: 0.15 }],
  place: [
    { f: 784, d: 0.08, type: 'triangle' },
    { f: 1046, d: 0.12, t: 0.07, type: 'triangle' },
  ],
  wrong: [
    { f: 220, d: 0.12, type: 'square', v: 0.08 },
    { f: 180, d: 0.18, t: 0.1, type: 'square', v: 0.08 },
  ],
  erase: [{ f: 400, d: 0.07, type: 'sine', v: 0.12 }],
  hint: [
    { f: 880, d: 0.08, type: 'sine' },
    { f: 1175, d: 0.08, t: 0.08, type: 'sine' },
    { f: 1568, d: 0.14, t: 0.16, type: 'sine' },
  ],
  complete: [
    { f: 659, d: 0.1, type: 'triangle' },
    { f: 784, d: 0.1, t: 0.08, type: 'triangle' },
  ],
  win: [
    { f: 523, d: 0.14, type: 'triangle' },
    { f: 659, d: 0.14, t: 0.13, type: 'triangle' },
    { f: 784, d: 0.14, t: 0.26, type: 'triangle' },
    { f: 1046, d: 0.4, t: 0.39, type: 'triangle' },
    { f: 784, d: 0.12, t: 0.6, type: 'sine', v: 0.1 },
    { f: 1046, d: 0.5, t: 0.72, type: 'sine', v: 0.12 },
  ],
} satisfies Record<string, Note[]>;

export type SoundName = keyof typeof SOUNDS;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playSound(name: SoundName) {
  if (!useSettings.getState().sound) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of SOUNDS[name] as Note[]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const start = now + (n.t ?? 0);
    const vol = n.v ?? 0.18;
    osc.type = n.type ?? 'sine';
    osc.frequency.setValueAtTime(n.f, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + n.d + 0.02);
  }
}
