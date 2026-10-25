import { useSettings } from '../settings/store';
import { audio } from './sfx';

/**
 * 파일 없이 Web Audio로 만드는 배경 음악 (8분음표 32칸 = 4마디 반복).
 * 곡(Song)마다 멜로디·베이스·빠르기가 다르고, setTempo / setAlt(피버 같은 다른 멜로디)로 바꿀 수 있다.
 * 소리 설정이 꺼져 있으면 조용하다.
 */
const _ = null;
type Line = (number | null)[];
export interface Song {
  bpm: number;
  melody: Line;
  /** 신날 때(피버 등) 바꿔 부르는 멜로디 */
  alt?: Line;
  /** 마디마다 베이스 근음 (MIDI) */
  roots: number[];
  lead: OscillatorType;
  /** 드럼 세기 0~1 */
  drums: number;
}

// C  Am  F  G
export const RAIN_SONG: Song = {
  bpm: 120, lead: 'triangle', drums: 1, roots: [48, 45, 41, 43],
  melody: [
    72, _, 76, _, 79, 76, 72, _,
    69, _, 72, _, 76, 72, 69, _,
    65, _, 69, _, 72, 69, 77, 76,
    74, _, 71, _, 67, 71, 74, _,
  ],
  alt: [
    84, 79, 84, 88, 91, 88, 84, 79,
    81, 76, 81, 84, 88, 84, 81, 76,
    77, 72, 77, 81, 84, 81, 89, 88,
    86, 83, 86, 79, 83, 86, 91, 86,
  ],
};

/** 마을·길을 걸을 때: 느긋하고 밝게 (F  C  Dm  C) */
export const FIELD_SONG: Song = {
  bpm: 100, lead: 'sine', drums: 0.35, roots: [41, 48, 50, 48],
  melody: [
    72, _, 74, 76, _, 77, 76, _,
    72, _, 67, _, 72, _, _, _,
    74, _, 76, 77, _, 79, 77, _,
    76, _, 72, _, 74, _, _, _,
  ],
};

/** 배틀: 빠르고 두근두근 (Am  F  G  E) */
export const BATTLE_SONG: Song = {
  bpm: 152, lead: 'square', drums: 1, roots: [45, 41, 43, 40],
  melody: [
    69, 72, 76, 72, 81, 76, 72, 76,
    65, 69, 72, 69, 77, 72, 69, 72,
    67, 71, 74, 71, 79, 74, 71, 74,
    68, 71, 76, 71, 80, 76, 71, 68,
  ],
};

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

let timer: ReturnType<typeof setInterval> | null = null;
let master: GainNode | null = null;
let stepIdx = 0;
let nextTime = 0;
let song: Song = RAIN_SONG;
let tempo = song.bpm;
let alt = false;
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

function kick(ac: AudioContext, out: AudioNode, at: number, vol = 1) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.frequency.setValueAtTime(150, at);
  osc.frequency.exponentialRampToValueAtTime(45, at + 0.14);
  g.gain.setValueAtTime(0.5 * vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + 0.2);
}

function schedule(ac: AudioContext, out: AudioNode, i: number, at: number) {
  const eighth = 60 / tempo / 2;
  const bar = Math.floor(i / 8) % song.roots.length;
  const inBar = i % 8;
  const useAlt = alt && !!song.alt;
  const m = (useAlt ? song.alt! : song.melody)[i];
  const lead = useAlt ? 'square' : song.lead;
  if (m !== null) tone(ac, out, hz(m), at, eighth * (useAlt || lead === 'square' ? 0.9 : 1.6), lead === 'square' ? 0.06 : 0.09, lead);
  // 베이스: 4분음표마다 근음 ↔ 옥타브
  if (inBar % 2 === 0) tone(ac, out, hz(song.roots[bar] + (inBar % 4 === 2 ? 12 : 0)), at, eighth * 1.7, 0.13, 'triangle');
  const d = song.drums;
  if (d > 0) {
    if (inBar === 0 || inBar === 4) kick(ac, out, at, d);
    if (d >= 0.5 && (inBar === 2 || inBar === 6)) noiseHit(ac, out, at, 0.12, 0.12 * d, 1800);
    noiseHit(ac, out, at, 0.04, (inBar % 2 ? 0.05 : 0.025) * d, 7000);
  }
  if (useAlt && inBar % 2) tone(ac, out, hz(96 + (i % 4) * 2), at, 0.06, 0.03, 'sine');
}

function pump() {
  const ac = audio();
  if (!ac || !master) return;
  master.gain.setTargetAtTime(useSettings.getState().sound ? 0.32 : 0, ac.currentTime, 0.05);
  while (nextTime < ac.currentTime + 0.15) {
    schedule(ac, master, stepIdx, nextTime);
    nextTime += 60 / tempo / 2;
    stepIdx = (stepIdx + 1) % song.melody.length;
  }
}

export const music = {
  /** 곡을 틀기 (이미 같은 곡이면 그대로, 다른 곡이면 바꿔서) */
  start(next: Song = RAIN_SONG) {
    if (timer && song === next) return;
    if (timer) this.stop();
    song = next;
    tempo = next.bpm;
    alt = false;
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
  setTempo(bpm: number) {
    tempo = bpm;
  },
  setAlt(on: boolean) {
    alt = on;
  },
};
