import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { makeQuestion } from '../hangul-hero/engine/questions';
import type { ChoiceQuestion } from '../hangul-hero/engine/types';
import { move, type MoveId, type SpeciesId } from './data/species';
import { BADGES, ITEMS, MAPS, npcById, POTION_HP, type Building, type ItemId, type Line, type MapId, type Npc } from './data/world';
import * as battleEngine from './engine/battle';
import type { Battle, Beat } from './engine/battle';
import { healed, makeMon, maxHp, PARTY_MAX, type Mon } from './engine/monster';
import { createRng } from './engine/rng';
import { gymNpc, rollEncounter, step, type Dir, type Flags } from './engine/world';

/** 빨리 맞히면 급소 (ms) */
export const FAST_MS = 5000;
/** 수풀에서 이만큼 걷고 나서부터 야생 몬스터가 나온다 */
const SAFE_STEPS = 3;

type Action = { type: 'battle'; npcId: string } | { type: 'starter' } | { type: 'ending' } | { type: 'shop' };

export interface Dialog {
  lines: Line[];
  idx: number;
  then?: Action;
}

export interface BattleUi {
  state: Battle;
  beats: Beat[];
  beatIdx: number;
  /** beats: 장면 보는 중, menu: 할 일 고르기, moves: 기술, question: 문제, bag: 가방, party: 친구 고르기 */
  phase: 'beats' | 'menu' | 'moves' | 'question' | 'bag' | 'party';
  question?: { q: ChoiceQuestion; moveId: MoveId };
  /** 가장 최근 답들 (같은 문제 반복 피하기) */
  recent: string[];
}

export type Overlay = 'starter' | 'shop' | 'menu' | 'ending' | null;

interface Save {
  started: boolean;
  map: MapId;
  x: number;
  y: number;
  dir: Dir;
  party: Mon[];
  box: Mon[];
  seen: SpeciesId[];
  caught: SpeciesId[];
  items: Record<ItemId, number>;
  coins: number;
  badges: number;
  defeated: string[];
  picked: string[];
  lastHeal: { map: MapId; x: number; y: number };
  champion: boolean;
  grassSteps: number;
  music: boolean;
}

interface State extends Save {
  dialog: Dialog | null;
  battle: BattleUi | null;
  overlay: Overlay;
  /** 지도에 들어설 때 이름 알림 */
  toast: { id: number; text: string } | null;

  newGame: () => void;
  walk: (dir: Dir) => 'moved' | 'stopped';
  advance: () => void;
  pickStarter: (sp: SpeciesId) => void;
  buy: (item: ItemId) => boolean;
  closeOverlay: () => void;
  openMenu: () => void;
  usePotionOutside: (item: 'potion' | 'bigPotion', uid: string) => void;
  makeLead: (uid: string) => void;
  toBox: (uid: string) => void;
  fromBox: (uid: string) => void;
  toggleMusic: () => void;

  // 배틀
  nextBeat: () => void;
  battleMenu: (phase: 'menu' | 'moves' | 'bag' | 'party') => void;
  chooseMove: (moveId: MoveId) => void;
  answer: (correct: boolean, elapsedMs: number) => void;
  throwBall: () => void;
  battlePotion: (item: 'potion' | 'bigPotion', idx: number) => void;
  switchMon: (idx: number) => void;
  runAway: () => void;
  cancelBattle: () => void;
}

const START: Save = {
  started: false, map: 'town', x: 4, y: 4, dir: 'up', party: [], box: [], seen: [], caught: [],
  items: { ball: 5, potion: 2, bigPotion: 0 }, coins: 100, badges: 0, defeated: [], picked: [],
  lastHeal: { map: 'town', x: 13, y: 4 }, champion: false, grassSteps: 0, music: true,
};

export const flagsOf = (s: Pick<Save, 'badges' | 'defeated' | 'picked' | 'party'>): Flags => ({
  badges: s.badges, defeated: s.defeated, picked: s.picked, hasStarter: s.party.length > 0,
});

const rng = createRng();
let toastId = 0;
const add = <T,>(xs: T[], ...ys: T[]) => [...xs, ...ys.filter((y) => !xs.includes(y))];
const name = () => callName(useSettings.getState().playerName);
const PROF = '한글 박사';

const SOUND: Partial<Record<NonNullable<Beat['fx']>, Parameters<typeof playSound>[0]>> = {
  myAttack: 'select', foeHit: 'boom', myHit: 'splash', miss: 'wrong', foeMiss: 'erase',
  ball: 'pop', wobble: 'tap', caught: 'win', breakOut: 'wrong', foeFaint: 'complete',
  levelUp: 'levelup', evolve: 'fever', heal: 'heart', win: 'win', lose: 'gameover', run: 'erase', foeIn: 'select', myIn: 'place',
};

export const useHangulMonster = create<State>()(
  persist(
    (set, get) => {
      const say = (lines: Line[], then?: Action) => set({ dialog: { lines, idx: 0, then } });

      const playBeats = (r: { battle: Battle; beats: Beat[] }) => {
        const b = get().battle!;
        set({ battle: { ...b, state: r.battle, beats: r.beats, beatIdx: 0, phase: 'beats', question: undefined } });
        const fx = r.beats[0]?.fx;
        if (fx && SOUND[fx]) playSound(SOUND[fx]!);
      };

      const startFight = (foes: Mon[], trainer?: Npc) => {
        const s = get();
        const r = battleEngine.startBattle(s.party.map((m) => ({ ...m })), foes, trainer && { id: trainer.id, name: trainer.name });
        set({
          battle: { state: r.battle, beats: r.beats, beatIdx: 0, phase: 'beats', recent: [] },
          seen: add(s.seen, ...foes.map((f) => f.sp)),
          grassSteps: 0,
        });
        playSound('select');
      };

      const heal = (at: { map: MapId; x: number; y: number }) => set({ party: get().party.map(healed), lastHeal: at });

      /** 배틀이 끝나면 결과를 모험에 반영 */
      const finishBattle = () => {
        const s = get();
        const b = s.battle!.state;
        const npc = b.trainerId ? npcById(b.trainerId) : undefined;
        const patch: Partial<State> = { battle: null, party: b.party, coins: s.coins + b.coins };
        if (b.result === 'caught' && b.caught) {
          const mon = { ...b.caught };
          if (b.party.length < PARTY_MAX) patch.party = [...b.party, mon];
          else patch.box = [...s.box, mon];
          patch.caught = add(s.caught, mon.sp);
          set(patch);
          say([{ text: b.party.length < PARTY_MAX ? `${battleEngine.josaName(mon.sp, '이/가')} 친구가 됐어요! 도감에 기록했어요. 📖` : `${battleEngine.josaName(mon.sp, '은/는')} 보관함으로 갔어요. (함께 다니는 친구는 6마리까지)` }]);
          return;
        }
        if (b.result === 'lose') {
          const at = s.lastHeal;
          set({ ...patch, party: b.party.map(healed), map: at.map, x: at.x, y: at.y, dir: 'down' });
          say([{ text: '눈을 떠 보니 몬스터 센터예요. 친구들이 다시 기운을 차렸어요! 💖' }]);
          return;
        }
        if (b.result === 'win' && npc) {
          patch.defeated = add(s.defeated, npc.id);
          if (npc.kind === 'gym') {
            const gym = MAPS[npc.map].gym!;
            patch.badges = Math.max(s.badges, gym + 1);
            set(patch);
            playSound('win');
            say([...(npc.after ?? []), { text: `🏅 ${BADGES[gym].icon} ${BADGES[gym].name}를 받았다!` }]);
            return;
          }
          if (npc.kind === 'boss') {
            set({ ...patch, champion: true });
            say(
              [
                ...(npc.after ?? []),
                { who: PROF, text: `${name()}, 해냈구나! 뒤죽박죽단이 섞어 놓은 한글이 모두 제자리로 돌아왔어!` },
                { who: PROF, text: '이제 너는 진짜 한글 몬스터 챔피언이야! 🏆' },
              ],
              { type: 'ending' },
            );
            return;
          }
          set(patch);
          if (npc.after) say(npc.after);
          return;
        }
        set(patch);
      };

      const talk = (npc: Npc) => {
        const s = get();
        playSound('tap');
        if (npc.kind === 'item' && npc.item) {
          const it = ITEMS[npc.item.id];
          set({ picked: add(s.picked, npc.id), items: { ...s.items, [npc.item.id]: s.items[npc.item.id] + npc.item.count } });
          playSound('heart');
          say([{ text: `✨ ${it.emoji} ${it.name} ${npc.item.count}개를 주웠다!` }]);
          return;
        }
        if (npc.kind === 'trainer' || npc.kind === 'boss' || npc.kind === 'gym') {
          if (s.defeated.includes(npc.id)) return say(npc.after ?? npc.lines);
          if (!s.party.length) return say([{ who: npc.name, text: '몬스터가 없잖아? 박사님 연구소에 먼저 다녀와!', villain: npc.villain }]);
          if (!s.party.some((m) => m.hp > 0)) return say([{ text: '친구들이 모두 지쳤어요. 몬스터 센터 🏥에서 쉬고 오자!' }]);
          return say(npc.lines, { type: 'battle', npcId: npc.id });
        }
        say(npc.lines);
      };

      const enter = (building: Building) => {
        const s = get();
        playSound('tap');
        switch (building) {
          case 'lab':
            if (!s.party.length) {
              return say(
                [
                  { who: PROF, text: `${name()}, 어서 와! 나는 한글 박사야.` },
                  { who: PROF, text: '이 나라에는 한글을 품은 몬스터들이 살아. 그런데 뒤죽박죽단이 한글을 엉망으로 만들고 있대!' },
                  { who: PROF, text: '너와 함께할 첫 친구를 골라 볼래?' },
                ],
                { type: 'starter' },
              );
            }
            return say([
              { who: PROF, text: '기술을 쓸 때 문제를 빨리 맞히면 급소에 맞아! ⚡' },
              { who: PROF, text: '여러 속성의 몬스터를 모으면 자음·모음·받침·낱말을 모두 배울 수 있단다.' },
            ]);
          case 'home':
            heal({ map: 'town', x: 13, y: 4 });
            playSound('heart');
            return say([{ who: '엄마', text: `${name()}, 푹 쉬었다 가렴. 친구들도 기운이 났어! 💖` }]);
          case 'center':
            heal({ map: s.map, x: MAPS[s.map].heal[0], y: MAPS[s.map].heal[1] });
            playSound('heart');
            return say([{ who: '간호사', text: '몬스터들이 모두 기운을 차렸어요! 💖 또 오세요!' }]);
          case 'shop':
            return set({ overlay: 'shop' });
          case 'gym': {
            const npc = gymNpc(s.map);
            if (npc) talk(npc);
          }
        }
      };

      const tryEncounter = () => {
        const s = get();
        if (!s.party.some((m) => m.hp > 0) || s.grassSteps < SAFE_STEPS) return;
        const r = rollEncounter(s.map, rng);
        if (r) startFight([makeMon(r[0], r[1])]);
      };

      const afterBeats = () => {
        const b = get().battle!;
        const st = b.state;
        if (st.result) return finishBattle();
        set({ battle: { ...b, phase: st.needSwitch ? 'party' : 'menu' } });
      };

      return {
        ...START,
        dialog: null,
        battle: null,
        overlay: null,
        toast: null,

        newGame: () => {
          set({ ...START, music: get().music, started: true, battle: null, overlay: null });
          say([
            { text: '여기는 한글을 품은 몬스터들이 사는 한글 나라.' },
            { text: '그런데 뒤죽박죽단이 나타나 한글을 엉망으로 만들기 시작했어요!' },
            { who: PROF, text: `${name()}! 연구소 🏫로 와 줄래? 부탁할 게 있단다!` },
          ]);
        },

        walk: (dir) => {
          const s = get();
          if (s.dialog || s.battle || s.overlay) return 'stopped';
          const r = step(s.map, s.x, s.y, dir, flagsOf(s));
          switch (r.kind) {
            case 'move':
              set({ x: r.x, y: r.y, dir, grassSteps: r.grass ? s.grassSteps + 1 : s.grassSteps });
              if (r.grass) tryEncounter();
              return get().battle ? 'stopped' : 'moved';
            case 'exit': {
              const m = MAPS[r.exit.to];
              set({ map: r.exit.to, x: r.exit.tx, y: r.exit.ty, dir, toast: { id: ++toastId, text: `${m.emoji} ${m.name}` } });
              playSound('complete');
              return 'stopped';
            }
            case 'npc':
              set({ dir });
              talk(r.npc);
              return 'stopped';
            case 'building':
              set({ dir });
              enter(r.building);
              return 'stopped';
            default:
              set({ dir });
              return 'stopped';
          }
        },

        advance: () => {
          const d = get().dialog;
          if (!d) return;
          if (d.idx + 1 < d.lines.length) return set({ dialog: { ...d, idx: d.idx + 1 } });
          set({ dialog: null });
          const then = d.then;
          if (!then) return;
          if (then.type === 'starter') set({ overlay: 'starter' });
          if (then.type === 'ending') set({ overlay: 'ending' });
          if (then.type === 'shop') set({ overlay: 'shop' });
          if (then.type === 'battle') {
            const npc = npcById(then.npcId)!;
            startFight(npc.team!.map(([sp, lv]) => makeMon(sp, lv)), npc);
          }
        },

        pickStarter: (sp) => {
          const s = get();
          const mon = makeMon(sp, 5);
          set({ party: [mon], seen: add(s.seen, sp), caught: add(s.caught, sp), overlay: null });
          playSound('win');
          say([
            { who: PROF, text: `${battleEngine.josaName(sp, '과/와')} 함께라면 든든하겠구나!` },
            { who: PROF, text: '풀숲에서 야생 몬스터를 만나면 기술로 싸워 봐. 기술을 쓰려면 한글 문제를 맞혀야 해!' },
            { who: PROF, text: '힘이 약해진 몬스터에게 한글볼 🔴을 던지면 친구로 만들 수 있어. 볼 5개를 줄게!' },
            { who: PROF, text: '체육관 배지 4개를 모아서 뒤죽박죽 성으로 가 줘. 한글 나라를 부탁해!' },
          ]);
        },

        buy: (item) => {
          const s = get();
          const price = ITEMS[item].price;
          if (s.coins < price) {
            playSound('wrong');
            return false;
          }
          playSound('place');
          set({ coins: s.coins - price, items: { ...s.items, [item]: s.items[item] + 1 } });
          return true;
        },

        closeOverlay: () => set({ overlay: null }),
        openMenu: () => {
          if (!get().battle && !get().dialog) set({ overlay: 'menu' });
        },

        usePotionOutside: (item, uid) => {
          const s = get();
          const m = s.party.find((p) => p.uid === uid);
          if (!m || s.items[item] <= 0 || m.hp >= maxHp(m)) return;
          playSound('heart');
          const hp = item === 'bigPotion' ? maxHp(m) : Math.min(maxHp(m), m.hp + POTION_HP);
          set({ items: { ...s.items, [item]: s.items[item] - 1 }, party: s.party.map((p) => (p.uid === uid ? { ...p, hp } : p)) });
        },

        makeLead: (uid) => {
          const s = get();
          const m = s.party.find((p) => p.uid === uid);
          if (!m) return;
          playSound('select');
          set({ party: [m, ...s.party.filter((p) => p.uid !== uid)] });
        },

        toBox: (uid) => {
          const s = get();
          if (s.party.length <= 1) return;
          const m = s.party.find((p) => p.uid === uid)!;
          playSound('tap');
          set({ party: s.party.filter((p) => p.uid !== uid), box: [...s.box, m] });
        },

        fromBox: (uid) => {
          const s = get();
          if (s.party.length >= PARTY_MAX) return;
          const m = s.box.find((p) => p.uid === uid)!;
          playSound('tap');
          set({ box: s.box.filter((p) => p.uid !== uid), party: [...s.party, m] });
        },

        toggleMusic: () => set({ music: !get().music }),

        nextBeat: () => {
          const b = get().battle;
          if (!b || b.phase !== 'beats') return;
          if (b.beatIdx + 1 < b.beats.length) {
            const fx = b.beats[b.beatIdx + 1].fx;
            if (fx && SOUND[fx]) playSound(SOUND[fx]!);
            return set({ battle: { ...b, beatIdx: b.beatIdx + 1 } });
          }
          afterBeats();
        },

        battleMenu: (phase) => {
          const b = get().battle;
          if (!b || b.phase === 'beats' || b.phase === 'question' || (b.state.needSwitch && phase !== 'party')) return;
          playSound('tap');
          set({ battle: { ...b, phase } });
        },

        chooseMove: (moveId) => {
          const b = get().battle;
          if (!b || b.phase !== 'moves') return;
          const mv = move(moveId);
          let q = makeQuestion(mv.q[Math.floor(rng() * mv.q.length)], rng, mv.options) as ChoiceQuestion;
          for (let i = 0; i < 6 && b.recent.includes(q.answer + q.prompt.ask); i++) q = makeQuestion(mv.q[Math.floor(rng() * mv.q.length)], rng, mv.options) as ChoiceQuestion;
          playSound('select');
          set({ battle: { ...b, phase: 'question', question: { q, moveId }, recent: [...b.recent, q.answer + q.prompt.ask].slice(-6) } });
        },

        answer: (correct, elapsedMs) => {
          const b = get().battle;
          if (!b || b.phase !== 'question' || !b.question) return;
          playBeats(battleEngine.attack(b.state, b.question.moveId, correct ? (elapsedMs <= FAST_MS ? 'fast' : 'correct') : 'wrong', rng));
        },

        throwBall: () => {
          const s = get();
          const b = s.battle;
          if (!b || b.state.kind !== 'wild' || s.items.ball <= 0) return;
          set({ items: { ...s.items, ball: s.items.ball - 1 } });
          playBeats(battleEngine.throwBall(b.state, rng));
        },

        battlePotion: (item, idx) => {
          const s = get();
          const b = s.battle;
          const t = b?.state.party[idx];
          if (!b || !t || s.items[item] <= 0 || t.hp <= 0 || t.hp >= maxHp(t)) return;
          set({ items: { ...s.items, [item]: s.items[item] - 1 } });
          playBeats(battleEngine.heal(b.state, idx, item === 'bigPotion' ? maxHp(t) : POTION_HP, rng));
        },

        switchMon: (idx) => {
          const b = get().battle;
          if (!b || idx === b.state.myIdx || b.state.party[idx]?.hp <= 0) return;
          playBeats(battleEngine.switchTo(b.state, idx, rng));
        },

        runAway: () => {
          const b = get().battle;
          if (!b) return;
          const r = battleEngine.run(b.state);
          playBeats(r);
        },

        cancelBattle: () => {
          // 나가기 확인창에서 "그만하기": 배틀은 없던 일로 (체력은 배틀 전 그대로)
          set({ battle: null });
        },
      };
    },
    {
      name: storageKey('hangul-monster'),
      version: 1,
      partialize: (s): Save => ({
        started: s.started, map: s.map, x: s.x, y: s.y, dir: s.dir, party: s.party, box: s.box, seen: s.seen, caught: s.caught,
        items: s.items, coins: s.coins, badges: s.badges, defeated: s.defeated, picked: s.picked, lastHeal: s.lastHeal,
        champion: s.champion, grassSteps: s.grassSteps, music: s.music,
      }),
      // 저장된 체력이 최대 체력보다 크면(기록을 옮겨 왔을 때 등) 맞춘다
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Save>;
        const fit = (m: Mon) => ({ ...m, hp: Math.min(m.hp, maxHp(m)) });
        return { ...current, ...p, party: (p.party ?? current.party).map(fit), box: (p.box ?? current.box).map(fit) };
      },
    },
  ),
);

export const currentBeat = (b: BattleUi) => b.beats[Math.min(b.beatIdx, b.beats.length - 1)];
