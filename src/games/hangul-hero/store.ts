import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { medalOf, type MedalLimits } from '@/shared/game/medals';
import { addRun, type RecordBook } from '@/shared/game/records';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { BOSS_HP, REGIONS, STAGE_QUESTIONS, regionById } from './data/regions';
import { makeSet, randomRng } from './engine/questions';
import type { Piece, Question } from './engine/types';

export type StageId = 0 | 1 | 2 | 'boss';

export interface RegionProgress {
  /** 단계별 별 (0 = 아직 못 깸) */
  stars: [number, number, number];
  bossCleared: boolean;
  introSeen: boolean;
}

export interface Session {
  regionId: string;
  stage: StageId;
  questions: Question[];
  index: number;
  /** 지금 문제에서 틀린 횟수 (2번이면 정답을 보여줌) */
  tries: number;
  mistakes: number;
  status: 'ready' | 'playing' | 'done';
  /** 정답을 맞혀 다음 문제로 넘어가기 직전 (애니메이션 중) */
  solved: boolean;
  elapsedMs: number;
  /** 지금 문제가 나온 시각 (빠르게 맞히면 보스에게 더 큰 공격) */
  questionAt: number;
  hp: number;
  lastHit: number;
  /** 글자 짓기 / 문장 순서에서 지금까지 고른 것 */
  build: { cho?: string; jung?: string };
  order: number[];
  /** 이번 판에 새로 찾은 조각 */
  newPieces: Piece[];
  /** 끝났을 때 */
  stars?: number;
  prevBest?: number;
  rank?: number;
}

export interface HeroEvent {
  kind: 'correct' | 'wrong' | 'reveal' | 'hit' | 'win' | 'clear';
  /** 누른 보기 */
  value?: string;
  key: number;
}

interface State {
  progress: Record<string, RegionProgress>;
  pieces: Piece[];
  prologueSeen: boolean;
  endingSeen: boolean;
  bossBooks: Record<string, RecordBook>;
  session: Session | null;
  paused: boolean;
  event: HeroEvent | null;

  markSeen: (what: 'prologue' | 'ending' | { intro: string }) => void;
  startStage: (regionId: string, stage: StageId) => void;
  start: () => void;
  pause: () => void;
  choose: (value: string) => void;
  pickBuild: (part: 'cho' | 'jung', jamo: string) => void;
  tapTile: (index: number) => void;
  undoTile: () => void;
  next: () => void;
  tick: (ms: number) => void;
  quit: () => void;
}

/** 보스를 무찌른 시간(초)으로 메달 [다이아, 금, 은, 동] */
export const BOSS_LIMITS: MedalLimits = [30_000, 45_000, 70_000, 120_000];
export const bossMedal = (ms: number | undefined) => medalOf(BOSS_LIMITS, ms, 'lower');

const emptyProgress = (): RegionProgress => ({ stars: [0, 0, 0], bossCleared: false, introSeen: false });

export const regionProgress = (p: Record<string, RegionProgress>, id: string) => p[id] ?? emptyProgress();
export const isRegionOpen = (p: Record<string, RegionProgress>, index: number) => index === 0 || regionProgress(p, REGIONS[index - 1].id).bossCleared;
export const isStageOpen = (p: RegionProgress, stage: StageId) => (stage === 'boss' ? p.stars[2] > 0 : stage === 0 || p.stars[stage - 1] > 0);
export const totalStars = (p: Record<string, RegionProgress>) => REGIONS.reduce((n, r) => n + regionProgress(p, r.id).stars.reduce((a, b) => a + b, 0), 0);
export const hasProgress = (s: Session | null) => s?.status === 'playing';
export const currentQuestion = (s: Session) => s.questions[s.index];
export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

/** 빠르게 맞힐수록 큰 공격: 기본 14, 3초 안 +4, 1.5초 안 +8 */
export function bossDamage(thinkMs: number) {
  return 14 + (thinkMs < 1500 ? 8 : thinkMs < 3000 ? 4 : 0);
}

const isLive = (st: Pick<State, 'session' | 'paused'>) => st.session?.status === 'playing' && !st.paused && !st.session.solved;
let eventKey = 0;
const ev = (kind: HeroEvent['kind'], value?: string): HeroEvent => ({ kind, value, key: ++eventKey });

export const useHangulHero = create<State>()(
  persist(
    (set, get) => {
      /** 정답 처리: 조각 모으기, 보스 공격 */
      const correct = (value: string) => {
        const s = get().session!;
        const q = currentQuestion(s);
        const owned = new Set(get().pieces);
        const fresh = q.pieces.filter((p) => !owned.has(p));
        const pieces = fresh.length ? [...get().pieces, ...fresh] : get().pieces;
        const newPieces = [...s.newPieces, ...fresh.filter((p) => !s.newPieces.includes(p))];
        if (s.stage === 'boss') {
          const dmg = bossDamage(s.elapsedMs - s.questionAt);
          playSound('complete');
          set({ pieces, session: { ...s, solved: true, newPieces, hp: Math.max(0, s.hp - dmg), lastHit: dmg }, event: ev('hit', value) });
          return;
        }
        playSound('place');
        set({ pieces, session: { ...s, solved: true, newPieces }, event: ev('correct', value) });
      };

      const wrong = (value: string, reset: Partial<Session> = {}) => {
        const s = get().session!;
        const tries = s.tries + 1;
        playSound('wrong');
        set({ session: { ...s, ...reset, tries, mistakes: s.mistakes + 1 }, event: ev(tries >= 2 ? 'reveal' : 'wrong', value) });
      };

      const finish = (s: Session): Partial<State> => {
        const progress = { ...get().progress };
        const rp = { ...regionProgress(progress, s.regionId) };
        if (s.stage === 'boss') {
          rp.bossCleared = true;
          progress[s.regionId] = rp;
          const { book, rank, prevBest } = addRun(get().bossBooks[s.regionId], { value: s.elapsedMs, at: Date.now(), mistakes: s.mistakes }, 'lower');
          playSound('win');
          return {
            progress,
            bossBooks: { ...get().bossBooks, [s.regionId]: book },
            session: { ...s, status: 'done', solved: false, rank, prevBest },
            event: ev('win'),
          };
        }
        const stars = starsFor(s.mistakes);
        const st = [...rp.stars] as RegionProgress['stars'];
        st[s.stage] = Math.max(st[s.stage], stars);
        rp.stars = st;
        progress[s.regionId] = rp;
        playSound('win');
        return { progress, session: { ...s, status: 'done', solved: false, stars }, event: ev('clear') };
      };

      return {
        progress: {},
        pieces: [],
        prologueSeen: false,
        endingSeen: false,
        bossBooks: {},
        session: null,
        // 앱을 새로 열면 진행 중인 판은 멈춘 상태로
        paused: true,
        event: null,

        markSeen: (what) => {
          if (what === 'prologue') return set({ prologueSeen: true });
          if (what === 'ending') return set({ endingSeen: true });
          const progress = { ...get().progress };
          progress[what.intro] = { ...regionProgress(progress, what.intro), introSeen: true };
          set({ progress });
        },

        startStage: (regionId, stage) => {
          const region = regionById(regionId)!;
          const conf = stage === 'boss' ? region.boss : region.stages[stage];
          const count = stage === 'boss' ? 24 : STAGE_QUESTIONS;
          set({
            session: {
              regionId, stage, questions: makeSet(conf.types, count, randomRng, conf.options),
              index: 0, tries: 0, mistakes: 0, status: 'ready', solved: false, elapsedMs: 0, questionAt: 0,
              hp: BOSS_HP, lastHit: 0, build: {}, order: [], newPieces: [],
            },
            paused: false,
            event: null,
          });
        },

        start: () => {
          const { session } = get();
          if (!session || session.status === 'done') return;
          playSound('select');
          set({ session: session.status === 'ready' ? { ...session, status: 'playing' } : session, paused: false });
        },

        pause: () => {
          if (get().session?.status === 'playing' && !get().paused) set({ paused: true });
        },

        choose: (value) => {
          const { session } = get();
          if (!session || !isLive(get())) return;
          const q = currentQuestion(session);
          if (q.kind !== 'choice') return;
          if (value === q.answer) correct(value);
          else if (session.tries >= 2) return; // 정답을 보여준 뒤에는 정답만 누를 수 있게
          else wrong(value);
        },

        pickBuild: (part, jamo) => {
          const { session } = get();
          if (!session || !isLive(get())) return;
          const q = currentQuestion(session);
          if (q.kind !== 'build') return;
          playSound('tap');
          const build = { ...session.build, [part]: jamo };
          set({ session: { ...session, build } });
          if (build.cho && build.jung) {
            if (build.cho === q.answer.cho && build.jung === q.answer.jung) correct(q.result);
            else wrong(`${build.cho}${build.jung}`, { build: {} });
          }
        },

        tapTile: (index) => {
          const { session } = get();
          if (!session || !isLive(get())) return;
          const q = currentQuestion(session);
          if (q.kind !== 'order' || session.order.includes(index)) return;
          playSound('tap');
          const order = [...session.order, index];
          set({ session: { ...session, order } });
          if (order.length === q.answer.length) {
            const made = order.map((i) => q.tiles[i]);
            if (made.join(' ') === q.answer.join(' ')) correct(made.join(' '));
            else wrong(made.join(' '), { order: [] });
          }
        },

        undoTile: () => {
          const { session } = get();
          if (!session || !isLive(get()) || session.order.length === 0) return;
          playSound('erase');
          set({ session: { ...session, order: session.order.slice(0, -1) } });
        },

        /** 정답 애니메이션이 끝나면 화면이 부른다 */
        next: () => {
          const { session } = get();
          if (!session || !session.solved) return;
          if (session.stage === 'boss' && session.hp <= 0) return set(finish(session));
          let s: Session = { ...session, solved: false, tries: 0, build: {}, order: [], questionAt: session.elapsedMs };
          if (s.index + 1 >= s.questions.length) {
            if (s.stage !== 'boss') return set(finish(s));
            // 보스전은 문제가 모자라면 더 만든다
            const region = regionById(s.regionId)!;
            s = { ...s, questions: [...s.questions, ...makeSet(region.boss.types, 12, randomRng, region.boss.options)] };
          }
          set({ session: { ...s, index: s.index + 1 } });
        },

        tick: (ms) => {
          const { session } = get();
          if (!session || session.status !== 'playing' || get().paused) return;
          set({ session: { ...session, elapsedMs: session.elapsedMs + ms } });
        },

        quit: () => set({ session: null, event: null, paused: false }),
      };
    },
    {
      name: storageKey('hangul-hero'),
      version: 1,
      partialize: (s) => ({
        progress: s.progress, pieces: s.pieces, prologueSeen: s.prologueSeen, endingSeen: s.endingSeen,
        bossBooks: s.bossBooks, session: s.session,
      }),
    },
  ),
);
