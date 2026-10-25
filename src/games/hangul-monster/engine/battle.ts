import { josa } from '@/shared/korean';
import { effectiveness, move, movesAt, species, type MoveId } from '../data/species';
import { gainXp, maxHp, type Mon } from './monster';
import type { Rng } from './rng';

/**
 * 턴제 배틀 (순수 로직). 내 차례: 기술(문제 풀기)·가방·친구 바꾸기·도망 → 상대 차례.
 * 한 번 행동하면 화면에 차례로 보여줄 장면(Beat)들과 새 상태를 돌려준다.
 */
export interface Battle {
  kind: 'wild' | 'trainer';
  trainerId?: string;
  trainerName?: string;
  foes: Mon[];
  foeIdx: number;
  party: Mon[];
  myIdx: number;
  result?: 'win' | 'lose' | 'run' | 'caught';
  caught?: Mon;
  coins: number;
  /** 내 몬스터가 쓰러져서 다음 친구를 골라야 함 */
  needSwitch?: boolean;
}

export type Fx =
  | 'myAttack' | 'foeAttack' | 'foeHit' | 'myHit' | 'miss' | 'foeMiss'
  | 'ball' | 'wobble' | 'caught' | 'breakOut'
  | 'foeFaint' | 'myFaint' | 'foeIn' | 'myIn' | 'myOut'
  | 'levelUp' | 'evolve' | 'heal' | 'run' | 'win' | 'lose';

export interface Beat {
  text: string;
  fx?: Fx;
  /** 이 장면이 끝났을 때의 모습 (체력 막대 등) */
  snap: Pick<Battle, 'foes' | 'foeIdx' | 'party' | 'myIdx'>;
  /** 효과가 굉장함/별로/급소 */
  tag?: 'super' | 'weak' | 'crit';
  dmg?: number;
}

/** 아이들이 지치지 않게 상대 공격은 약하게 */
const FOE_SCALE = 0.55;
const FOE_MISS = 0.15;
const CRIT = 1.5;

export const me = (b: Battle) => b.party[b.myIdx];
export const foe = (b: Battle) => b.foes[b.foeIdx];
/** 숫자 + (으)로: 3·6·10 → 으로, 나머지(일·이·사·오·칠·팔·구) → 로 */
export const numRo = (n: number) => `${n}${[0, 3, 6].includes(n % 10) ? '으로' : '로'}`;
const name = (m: Mon) => species(m.sp).name;
export const josaName = (sp: Mon['sp'], pair: Parameters<typeof josa>[1]) => josa(species(sp).name, pair);
const snap = (b: Battle): Beat['snap'] => ({ foes: b.foes.map((m) => ({ ...m })), party: b.party.map((m) => ({ ...m })), foeIdx: b.foeIdx, myIdx: b.myIdx });

export function damage(attacker: Mon, power: number, defenderSp: Mon['sp'], crit: boolean, rng: Rng, scale = 1) {
  const sp = species(attacker.sp);
  const eff = effectiveness(sp.elem, species(defenderSp).elem);
  const raw = power * (0.55 + attacker.lv * 0.09) * sp.atk * eff * (crit ? CRIT : 1) * (0.9 + rng() * 0.2) * scale;
  return { dmg: Math.max(1, Math.round(raw)), eff };
}

export function startBattle(party: Mon[], foes: Mon[], trainer?: { id: string; name: string }): { battle: Battle; beats: Beat[] } {
  const myIdx = party.findIndex((m) => m.hp > 0);
  const b: Battle = { kind: trainer ? 'trainer' : 'wild', trainerId: trainer?.id, trainerName: trainer?.name, foes, foeIdx: 0, party, myIdx, coins: 0 };
  const f = foes[0];
  const beats: Beat[] = [
    { text: trainer ? `${josa(trainer.name, '이/가')} 승부를 걸어왔다! ${josa(name(f), '을/를')} 내보냈다!` : `앗! 야생 ${josa(name(f), '이/가')} 나타났다!`, fx: 'foeIn', snap: snap(b) },
    { text: `가랏, ${name(party[myIdx])}!`, fx: 'myIn', snap: snap(b) },
  ];
  return { battle: b, beats };
}

/** 상대 차례 */
function foeTurn(b: Battle, rng: Rng, beats: Beat[]): Battle {
  const f = foe(b);
  const moves = movesAt(f.sp, f.lv);
  const mv = move(moves[Math.floor(rng() * moves.length)]);
  const m = me(b);
  beats.push({ text: `${name(f)}의 ${mv.name}!`, fx: 'foeAttack', snap: snap(b) });
  if (rng() < FOE_MISS) {
    beats.push({ text: '휴, 빗나갔다!', fx: 'foeMiss', snap: snap(b) });
    return b;
  }
  const { dmg, eff } = damage(f, mv.power, m.sp, false, rng, FOE_SCALE);
  const party = b.party.map((p, i) => (i === b.myIdx ? { ...p, hp: Math.max(0, p.hp - dmg) } : p));
  let next: Battle = { ...b, party };
  beats.push({ text: eff > 1 ? '아야! 효과가 굉장했다!' : eff < 1 ? '효과가 별로인 것 같다.' : `${josa(name(m), '이/가')} ${dmg}만큼 아파했다.`, fx: 'myHit', dmg, tag: eff > 1 ? 'super' : eff < 1 ? 'weak' : undefined, snap: snap(next) });
  if (me(next).hp > 0) return next;
  beats.push({ text: `${josa(name(m), '이/가')} 쓰러졌다…`, fx: 'myFaint', snap: snap(next) });
  if (next.party.some((p) => p.hp > 0)) {
    next = { ...next, needSwitch: true };
    beats.push({ text: '다음에 나갈 친구를 골라 줘!', snap: snap(next) });
  } else {
    next = { ...next, result: 'lose' };
    beats.push({ text: '싸울 수 있는 친구가 없다… 눈앞이 캄캄해졌다!', fx: 'lose', snap: snap(next) });
  }
  return next;
}

/** 상대가 쓰러졌을 때: 경험치 → 다음 상대 or 이김 */
function foeFainted(b: Battle, beats: Beat[]): Battle {
  const f = foe(b);
  beats.push({ text: `${josa(name(f), '이/가')} 쓰러졌다!`, fx: 'foeFaint', snap: snap(b) });
  const xp = Math.round(f.lv * 6 * (b.kind === 'trainer' ? 1.5 : 1));
  const g = gainXp(me(b), xp);
  let next: Battle = { ...b, party: b.party.map((p, i) => (i === b.myIdx ? g.mon : p)), coins: b.coins + f.lv * (b.kind === 'trainer' ? 8 : 2) };
  const myName = g.evolvedFrom ? species(g.evolvedFrom).name : name(g.mon);
  beats.push({ text: `${josa(myName, '은/는')} 경험치를 ${xp} 얻었다!`, snap: snap(next) });
  for (const lv of g.levels) beats.push({ text: `${myName}의 레벨이 ${numRo(lv)} 올랐다!`, fx: 'levelUp', snap: snap(next) });
  if (g.evolvedFrom) {
    beats.push({ text: `어라? ${myName}의 모습이…! ${josa(name(g.mon), '으로/로')} 진화했다! ✨`, fx: 'evolve', snap: snap(next) });
  }
  for (const id of g.learned) beats.push({ text: `새 기술 「${move(id as MoveId).name}」을 배웠다!`, snap: snap(next) });

  if (next.foeIdx + 1 < next.foes.length) {
    next = { ...next, foeIdx: next.foeIdx + 1 };
    beats.push({ text: `${josa(next.trainerName!, '은/는')} ${josa(name(foe(next)), '을/를')} 내보냈다!`, fx: 'foeIn', snap: snap(next) });
    return next;
  }
  next = { ...next, result: 'win' };
  beats.push({ text: next.kind === 'trainer' ? `${josa(next.trainerName!, '과/와')}의 승부에서 이겼다! 🪙 ${next.coins}개를 받았다!` : `이겼다! 🪙 ${next.coins}개를 주웠다!`, fx: 'win', snap: snap(next) });
  return next;
}

export type Answer = 'fast' | 'correct' | 'wrong';

/** 기술 쓰기: 문제를 맞히면 공격, 빨리 맞히면 급소, 틀리면 빗나감 → 상대 차례 */
export function attack(b: Battle, moveId: MoveId, answer: Answer, rng: Rng) {
  const beats: Beat[] = [];
  const m = me(b);
  const mv = move(moveId);
  beats.push({ text: `${name(m)}의 ${mv.name}!`, fx: 'myAttack', snap: snap(b) });
  if (answer === 'wrong') {
    beats.push({ text: '앗, 빗나갔다!', fx: 'miss', snap: snap(b) });
    return { battle: foeTurn(b, rng, beats), beats };
  }
  const crit = answer === 'fast';
  const f = foe(b);
  const { dmg, eff } = damage(m, mv.power, f.sp, crit, rng);
  let next: Battle = { ...b, foes: b.foes.map((x, i) => (i === b.foeIdx ? { ...x, hp: Math.max(0, x.hp - dmg) } : x)) };
  const words = [crit && '급소에 맞았다!', eff > 1 && '효과가 굉장했다!', eff < 1 && '효과가 별로인 것 같다.'].filter(Boolean);
  beats.push({ text: words.length ? words.join(' ') : `${dmg}만큼 공격했다!`, fx: 'foeHit', dmg, tag: crit ? 'crit' : eff > 1 ? 'super' : eff < 1 ? 'weak' : undefined, snap: snap(next) });
  if (foe(next).hp <= 0) next = foeFainted(next, beats);
  else next = foeTurn(next, rng, beats);
  return { battle: next, beats };
}

/** 잡힐 확률: 힘이 빠질수록 잘 잡히고, 4분의 1 이하면 꼭 잡힌다 */
export function catchChance(f: Mon) {
  const r = f.hp / maxHp(f);
  return r <= 0.25 ? 1 : 0.35 + 0.65 * (1 - r);
}

export function throwBall(b: Battle, rng: Rng) {
  const beats: Beat[] = [];
  const f = foe(b);
  beats.push({ text: '한글볼을 던졌다!', fx: 'ball', snap: snap(b) });
  const ok = rng() < catchChance(f);
  const wobbles = ok ? 3 : 1 + Math.floor(rng() * 2);
  for (let i = 0; i < wobbles; i++) beats.push({ text: ['흔들…', '흔들… 흔들…', '흔들… 흔들… 흔들…'][i], fx: 'wobble', snap: snap(b) });
  if (ok) {
    const next: Battle = { ...b, result: 'caught', caught: { ...f } };
    beats.push({ text: `야호! ${josa(name(f), '을/를')} 잡았다! 🎉`, fx: 'caught', snap: snap(next) });
    return { battle: next, beats };
  }
  beats.push({ text: '아깝다! 볼에서 나와 버렸다!', fx: 'breakOut', snap: snap(b) });
  return { battle: foeTurn(b, rng, beats), beats };
}

export function heal(b: Battle, target: number, amount: number, rng: Rng) {
  const beats: Beat[] = [];
  const t = b.party[target];
  const hp = Math.min(maxHp(t), t.hp + amount);
  const next: Battle = { ...b, party: b.party.map((p, i) => (i === target ? { ...p, hp } : p)) };
  beats.push({ text: `회복약! ${name(t)}의 체력이 ${hp - t.hp} 회복됐다! 💖`, fx: 'heal', snap: snap(next) });
  return { battle: foeTurn(next, rng, beats), beats };
}

/** 친구 바꾸기. 쓰러져서 바꾸는 거면 상대가 공격하지 않는다 */
export function switchTo(b: Battle, idx: number, rng: Rng) {
  const beats: Beat[] = [];
  const forced = !!b.needSwitch;
  if (!forced) beats.push({ text: `돌아와, ${name(me(b))}!`, fx: 'myOut', snap: snap(b) });
  const next: Battle = { ...b, myIdx: idx, needSwitch: false };
  beats.push({ text: `가랏, ${name(me(next))}!`, fx: 'myIn', snap: snap(next) });
  return { battle: forced ? next : foeTurn(next, rng, beats), beats };
}

export function run(b: Battle) {
  if (b.kind === 'trainer') return { battle: b, beats: [{ text: '트레이너와의 승부에서는 도망칠 수 없어!', snap: snap(b) }] as Beat[] };
  const next: Battle = { ...b, result: 'run' };
  return { battle: next, beats: [{ text: '무사히 도망쳤다!', fx: 'run', snap: snap(next) }] as Beat[] };
}
