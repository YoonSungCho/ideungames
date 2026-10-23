import { useSettings } from '../settings/store';

/**
 * 파일 없이 Web Audio로 합성하는 효과음. 오프라인에서도 동작하고 용량이 0.
 * 새 효과음은 SOUNDS에 음표 배열로 추가하면 된다.
 */
/** f: 주파수, d: 길이(초), t: 시작(초), to: 끝 주파수(미끄러지듯), noise: 잡음(펑·철썩) */
type Note = { f: number; d: number; t?: number; type?: OscillatorType; v?: number; to?: number; noise?: boolean };

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
  // ── 숫자 비 ──
  pop: [
    { f: 880, d: 0.09, type: 'triangle', to: 1400 },
    { f: 1760, d: 0.06, t: 0.05, type: 'sine', v: 0.08 },
  ],
  boom: [
    { f: 900, d: 0.6, noise: true, v: 0.35, to: 120 },
    { f: 140, d: 0.5, type: 'sine', v: 0.3, to: 40 },
    { f: 523, d: 0.12, t: 0.25, type: 'triangle', v: 0.1 },
    { f: 784, d: 0.12, t: 0.33, type: 'triangle', v: 0.1 },
    { f: 1046, d: 0.25, t: 0.41, type: 'triangle', v: 0.12 },
  ],
  freeze: [
    { f: 1568, d: 0.1, type: 'sine', v: 0.1 },
    { f: 2093, d: 0.1, t: 0.07, type: 'sine', v: 0.1 },
    { f: 2637, d: 0.1, t: 0.14, type: 'sine', v: 0.1 },
    { f: 3136, d: 0.3, t: 0.21, type: 'sine', v: 0.08 },
  ],
  heart: [
    { f: 659, d: 0.1, type: 'triangle' },
    { f: 880, d: 0.1, t: 0.09, type: 'triangle' },
    { f: 1319, d: 0.25, t: 0.18, type: 'triangle' },
  ],
  splash: [
    { f: 1200, d: 0.25, noise: true, v: 0.18, to: 300 },
    { f: 300, d: 0.3, type: 'sine', v: 0.15, to: 120 },
  ],
  levelup: [
    { f: 523, d: 0.1, type: 'square', v: 0.07 },
    { f: 659, d: 0.1, t: 0.1, type: 'square', v: 0.07 },
    { f: 784, d: 0.1, t: 0.2, type: 'square', v: 0.07 },
    { f: 1046, d: 0.3, t: 0.3, type: 'square', v: 0.08 },
  ],
  fever: [
    { f: 523, d: 0.08, type: 'square', v: 0.06 },
    { f: 784, d: 0.08, t: 0.07, type: 'square', v: 0.06 },
    { f: 1046, d: 0.08, t: 0.14, type: 'square', v: 0.06 },
    { f: 1568, d: 0.08, t: 0.21, type: 'square', v: 0.06 },
    { f: 2093, d: 0.35, t: 0.28, type: 'triangle', v: 0.1, to: 2600 },
  ],
  gameover: [
    { f: 523, d: 0.2, type: 'triangle', v: 0.14 },
    { f: 440, d: 0.2, t: 0.2, type: 'triangle', v: 0.14 },
    { f: 349, d: 0.2, t: 0.4, type: 'triangle', v: 0.14 },
    { f: 392, d: 0.5, t: 0.6, type: 'triangle', v: 0.14 },
  ],
} satisfies Record<string, Note[]>;

export type SoundName = keyof typeof SOUNDS;

let ctx: AudioContext | null = null;

/** 배경 음악 등 다른 소리도 같은 AudioContext를 쓴다 (브라우저마다 개수 제한) */
export function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  return src;
}

/** pitch: 음높이 배율 (연속 정답일수록 조금씩 높게 등) */
export function playSound(name: SoundName, pitch = 1) {
  if (!useSettings.getState().sound) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of SOUNDS[name] as Note[]) {
    const gain = ac.createGain();
    const start = now + (n.t ?? 0);
    const vol = n.v ?? 0.18;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    let src: AudioScheduledSourceNode;
    if (n.noise) {
      // 잡음을 저역 통과 필터로 깎아 "펑"·"철썩"
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(n.f * pitch, start);
      if (n.to) filter.frequency.exponentialRampToValueAtTime(n.to * pitch, start + n.d);
      src = noise(ac);
      src.connect(filter).connect(gain);
    } else {
      const osc = ac.createOscillator();
      osc.type = n.type ?? 'sine';
      osc.frequency.setValueAtTime(n.f * pitch, start);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to * pitch, start + n.d);
      src = osc;
      osc.connect(gain);
    }
    gain.connect(ac.destination);
    src.start(start);
    src.stop(start + n.d + 0.02);
  }
}
