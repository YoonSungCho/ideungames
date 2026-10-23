import { useSettings } from '@/shared/settings/store';
import { audio } from '@/shared/sound/sfx';

/**
 * 파일 없이 Web Audio로 만드는 신나는 배경 음악 (8분음표 32칸 = 4마디 반복).
 * 단계가 오르면 빨라지고, 피버 타임에는 한 옥타브 위 멜로디 + 반짝이 소리.
 * 소리 설정이 꺼져 있으면 조용하다.
 */
const _ = null;
// C  Am  F  G — 멜로디 (MIDI 번호)
const MELODY: (number | null)[] = [
  72, _, 76, _, 79, 76, 72, _,
  69, _, 72, _, 76, 72, 69, _,
  65, _, 69, _, 72, 69, 77, 76,
  74, _, 71, _, 67, 71, 74, _,
];
const FEVER: (number | null)[] = [
  84, 79, 84, 88, 91, 88, 84, 79,
  81, 76, 81, 84, 88, 84, 81, 76,
  77, 72, 77, 81, 84, 81, 89, 88,
  86, 83, 86, 79, 83, 86, 91, 86,
];
const ROOTS = [48, 45, 41, 43];

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

let timer: ReturnType<typeof setInterval> | null = null;
let master: GainNode | null = null;
let stepIdx = 0;
let nextTime = 0;
let level = 1;
let fever = false;

const bpm = () => Math.min(176, 120 + (level - 1) * 5 + (fever ? 12 : 0));

function tone(ac: AudioContext, out: AudioNode, f: number, at: number, dur: number, vol: number, type: OscillatorType) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

let hat: AudioBuffer | null = null;
function noiseHit(ac: AudioContext, out: AudioNode, at: number, dur: number, vol: number, cutoff: number) {
  if (!hat) {
    hat = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
    const d = hat.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = hat;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = cutoff;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(g).connect(out);
  src.start(at);
  src.stop(at + dur + 0.02);
}

function kick(ac: AudioContext, out: AudioNode, at: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.frequency.setValueAtTime(150, at);
  osc.frequency.exponentialRampToValueAtTime(45, at + 0.14);
  g.gain.setValueAtTime(0.5, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + 0.2);
}

function schedule(ac: AudioContext, out: AudioNode, i: number, at: number) {
  const eighth = 60 / bpm() / 2;
  const bar = Math.floor(i / 8);
  const inBar = i % 8;
  const m = (fever ? FEVER : MELODY)[i];
  if (m !== null) tone(ac, out, hz(m), at, eighth * (fever ? 0.9 : 1.6), fever ? 0.07 : 0.09, fever ? 'square' : 'triangle');
  // 베이스: 4분음표마다 근음 ↔ 옥타브
  if (inBar % 2 === 0) tone(ac, out, hz(ROOTS[bar] + (inBar % 4 === 2 ? 12 : 0)), at, eighth * 1.7, 0.13, 'triangle');
  if (inBar === 0 || inBar === 4) kick(ac, out, at);
  if (inBar === 2 || inBar === 6) noiseHit(ac, out, at, 0.12, 0.12, 1800);
  noiseHit(ac, out, at, 0.04, inBar % 2 ? 0.05 : 0.025, 7000);
  if (fever && inBar % 2) tone(ac, out, hz(96 + (i % 4) * 2), at, 0.06, 0.03, 'sine');
}

function pump() {
  const ac = audio();
  if (!ac || !master) return;
  master.gain.setTargetAtTime(useSettings.getState().sound ? 0.32 : 0, ac.currentTime, 0.05);
  while (nextTime < ac.currentTime + 0.15) {
    schedule(ac, master, stepIdx, nextTime);
    nextTime += 60 / bpm() / 2;
    stepIdx = (stepIdx + 1) % MELODY.length;
  }
}

export const music = {
  start() {
    if (timer) return;
    const ac = audio();
    if (!ac) return;
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    nextTime = ac.currentTime + 0.05;
    stepIdx = 0;
    timer = setInterval(pump, 40);
    pump();
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
    const ac = audio();
    if (master && ac) {
      const m = master;
      m.gain.setTargetAtTime(0, ac.currentTime, 0.03);
      setTimeout(() => m.disconnect(), 300);
    }
    master = null;
  },
  setLevel(n: number) {
    level = n;
  },
  setFever(on: boolean) {
    fever = on;
  },
};
