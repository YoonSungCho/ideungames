import { describe, expect, it } from 'vitest';
import { josa } from '@/shared/korean';
import { makeQuestion } from '../../hangul-hero/engine/questions';
import { DEX, effectiveness, MOVES, movesAt, SPECIES, SPECIES_IDS, STARTERS, type MoveId } from '../data/species';
import { BUILDING_TILE, MAPS, NPCS, WALK, type MapId } from '../data/world';
import { attack, catchChance, foe, heal, me, numRo, run, startBattle, switchTo, throwBall } from './battle';
import { gainXp, makeMon, maxHp, xpNeed } from './monster';
import { createRng } from './rng';
import { findPath, rollEncounter, step, visibleNpcs, type Flags } from './world';

const ALL: Flags = { badges: 4, defeated: NPCS.map((n) => n.id), picked: NPCS.map((n) => n.id), hasStarter: true };
const NONE: Flags = { badges: 0, defeated: [], picked: [], hasStarter: false };
const fixed = (v: number) => () => v;

describe('지도', () => {
  for (const [id, m] of Object.entries(MAPS) as [MapId, (typeof MAPS)[MapId]][]) {
    it(`${m.name}: 네모 반듯하고, 나가는 곳·도착 칸·센터 앞이 걸을 수 있는 칸`, () => {
      expect(new Set(m.rows.map((r) => r.length)).size).toBe(1);
      for (const e of m.exits) {
        expect(WALK.has(m.rows[e.y][e.x]), `${id} 출구`).toBe(true);
        const t = MAPS[e.to];
        expect(WALK.has(t.rows[e.ty][e.tx]), `${e.to} 도착`).toBe(true);
        expect(t.exits.some((x) => x.x === e.tx && x.y === e.ty), '도착 칸이 출구면 왔다 갔다 한다').toBe(false);
      }
      expect(WALK.has(m.rows[m.heal[1]][m.heal[0]])).toBe(true);
      if (m.gym !== undefined) expect(m.rows.join('')).toContain('G');
    });

    it(`${m.name}: 모든 출구·건물·사람에게 걸어갈 수 있다`, () => {
      const arrive = Object.values(MAPS).flatMap((o) => o.exits).filter((e) => e.to === id).map((e) => [e.tx, e.ty] as [number, number]);
      const from = id === 'town' ? ([4, 4] as [number, number]) : arrive[0];
      const targets: [number, number][] = [...m.exits.map((e) => [e.x, e.y] as [number, number])];
      m.rows.forEach((r, y) => [...r].forEach((t, x) => BUILDING_TILE[t] && targets.push([x, y])));
      // 지기·졸개가 다 비켜 준 상태에서 / 아직 안 비켜 준 사람에게는 말 걸 수 있게
      for (const n of NPCS.filter((n) => n.map === id && n.kind !== 'gym')) {
        expect(WALK.has(m.rows[n.y][n.x]), `${n.id} 서 있는 칸`).toBe(true);
        // 이 사람만 남아 있는 상태 (앞을 막던 졸개는 이긴 뒤)
        const only: Flags = {
          badges: n.kind === 'guard' ? n.needBadges! - 1 : 4,
          defeated: ALL.defeated.filter((d) => d !== n.id),
          picked: ALL.picked.filter((d) => d !== n.id),
          hasStarter: true,
        };
        expect(findPath(id, from, [n.x, n.y], only), `${n.id}에게 가는 길`).not.toBeNull();
      }
      for (const t of targets) expect(findPath(id, from, t, ALL), `${id} ${t}`).not.toBeNull();
    });
  }

  it('지기는 배지가 모이면, 졸개는 이기면, 물건은 주우면 사라진다', () => {
    expect(visibleNpcs('forest', NONE).some((n) => n.id === 'forest-guard')).toBe(true);
    expect(visibleNpcs('forest', { ...NONE, badges: 1 }).some((n) => n.id === 'forest-guard')).toBe(false);
    expect(visibleNpcs('town', { ...NONE, defeated: ['grunt0'] }).some((n) => n.id === 'grunt0')).toBe(false);
    expect(visibleNpcs('town', { ...NONE, picked: ['town-ball'] }).some((n) => n.id === 'town-ball')).toBe(false);
  });

  it('걷기: 길은 지나가고, 사람·건물은 부딪히면 알려 주고, 나무는 막힌다', () => {
    expect(step('town', 4, 4, 'down', NONE)).toMatchObject({ kind: 'move', x: 4, y: 5 });
    expect(step('town', 4, 4, 'up', NONE)).toMatchObject({ kind: 'building', building: 'lab' });
    expect(step('town', 9, 2, 'up', NONE)).toMatchObject({ kind: 'npc', npc: { id: 'grunt0' } });
    expect(step('town', 2, 2, 'left', NONE)).toEqual({ kind: 'blocked' });
    expect(step('town', 9, 1, 'up', ALL)).toMatchObject({ kind: 'exit', exit: { to: 'forest' } });
  });

  it('누른 칸까지 길 찾기 (사람을 누르면 앞까지 가서 말 걸기)', () => {
    const dirs = findPath('town', [4, 4], [8, 4], NONE)!;
    expect(dirs).toHaveLength(4);
    // 길대로 걸으면 마지막 걸음에 연구소에 부딪힌다
    let at: [number, number] = [6, 6];
    const toLab = findPath('town', at, [4, 3], NONE)!;
    for (const d of toLab.slice(0, -1)) {
      const r = step('town', at[0], at[1], d, NONE);
      expect(r.kind).toBe('move');
      if (r.kind === 'move') at = [r.x, r.y];
    }
    expect(step('town', at[0], at[1], toLab.at(-1)!, NONE)).toMatchObject({ kind: 'building', building: 'lab' });
    expect(findPath('town', [4, 4], [0, 0], NONE)).toBeNull();
  });

  it('수풀에서만 야생 몬스터 (마을엔 없음), 레벨은 지도 범위 안', () => {
    expect(rollEncounter('town', fixed(0))).toBeNull();
    const rng = createRng(3);
    for (let i = 0; i < 300; i++) {
      const r = rollEncounter('forest', rng);
      if (!r) continue;
      expect(r[1]).toBeGreaterThanOrEqual(2);
      expect(r[1]).toBeLessThanOrEqual(5);
      expect(MAPS.forest.wild!.table.map(([s]) => s)).toContain(r[0]);
    }
  });
});

describe('몬스터', () => {
  it('기술 문제는 모두 보기 고르기로 나온다', () => {
    const rng = createRng(1);
    for (const [id, mv] of Object.entries(MOVES)) {
      for (const t of mv.q) for (let i = 0; i < 20; i++) expect(makeQuestion(t, rng, mv.options).kind, `${id} ${t}`).toBe('choice');
    }
  });

  it('진화 대상·도감·첫 친구가 맞다', () => {
    for (const id of SPECIES_IDS) {
      const e = SPECIES[id].evolve as { to: keyof typeof SPECIES; at: number } | undefined;
      if (e) expect(SPECIES[e.to].stage).toBe(2);
    }
    expect(DEX).not.toContain('king');
    for (const s of STARTERS) expect(movesAt(s, 5)).toHaveLength(2);
  });

  it('레벨업하면 체력도 늘고, 12레벨에 진화한다', () => {
    const m = makeMon('giyeok', 11);
    const g = gainXp({ ...m, hp: 10 }, xpNeed(11));
    expect(g.mon.lv).toBe(12);
    expect(g.mon.sp).toBe('giga');
    expect(g.evolvedFrom).toBe('giyeok');
    expect(g.mon.hp).toBeGreaterThan(10);
    expect(g.learned).toContain('c_storm');
  });

  it('속성 상성: 자음(불) → 낱말(풀) 굉장, 반대는 별로', () => {
    expect(effectiveness('consonant', 'word')).toBe(1.5);
    expect(effectiveness('word', 'consonant')).toBe(0.75);
    expect(effectiveness('chaos', 'vowel')).toBe(1);
  });
});

describe('배틀', () => {
  const party = () => [makeMon('giyeok', 5, 'a'), makeMon('aya', 5, 'b')];
  const wild = () => [makeMon('nieun', 3, 'w')];

  it('맞히면 공격, 빨리 맞히면 더 세게(급소), 틀리면 빗나간다', () => {
    const { battle } = startBattle(party(), wild());
    const hp0 = foe(battle).hp;
    const normal = attack(battle, 'c_punch', 'correct', fixed(0.5));
    const fast = attack(battle, 'c_punch', 'fast', fixed(0.5));
    const miss = attack(battle, 'c_punch', 'wrong', fixed(0.5));
    expect(foe(normal.battle).hp).toBeLessThan(hp0);
    expect(hp0 - foe(fast.battle).hp).toBeGreaterThan(hp0 - foe(normal.battle).hp);
    expect(foe(miss.battle).hp).toBe(hp0);
    expect(miss.beats.map((b) => b.text)).toContain('앗, 빗나갔다!');
    expect(fast.beats.some((b) => b.tag === 'crit')).toBe(true);
    // 상대도 공격한다 (0.5는 빗나감 확률보다 커서 맞음)
    expect(me(normal.battle).hp).toBeLessThan(maxHp(me(battle)));
  });

  it('상대를 쓰러뜨리면 경험치·코인, 이김', () => {
    const { battle } = startBattle(party(), [{ ...makeMon('nieun', 3, 'w'), hp: 1 }]);
    const r = attack(battle, 'c_punch', 'correct', fixed(0.5));
    expect(r.battle.result).toBe('win');
    expect(me(r.battle).xp).toBeGreaterThan(0);
    expect(r.battle.coins).toBe(6);
  });

  it('트레이너는 다음 몬스터를 내보내고, 도망칠 수 없다', () => {
    const { battle } = startBattle(party(), [{ ...makeMon('nieun', 3, 'x'), hp: 1 }, makeMon('mieum', 4, 'y')], { id: 't', name: '다온' });
    const r = attack(battle, 'c_punch', 'correct', fixed(0.5));
    expect(r.battle.result).toBeUndefined();
    expect(foe(r.battle).sp).toBe('mieum');
    expect(r.beats.at(-1)!.text).toBe('다온은 미음콩을 내보냈다!');
    expect(run(r.battle).battle.result).toBeUndefined();
  });

  it('한글볼: 힘이 4분의 1 이하면 꼭 잡힌다', () => {
    const f = makeMon('nieun', 3, 'w');
    expect(catchChance({ ...f, hp: 1 })).toBe(1);
    expect(catchChance(f)).toBeLessThan(0.5);
    const { battle } = startBattle(party(), [{ ...f, hp: 1 }]);
    const r = throwBall(battle, fixed(0.99));
    expect(r.battle.result).toBe('caught');
    expect(r.beats.filter((b) => b.fx === 'wobble')).toHaveLength(3);
    expect(r.battle.caught!.sp).toBe('nieun');
  });

  it('내 몬스터가 쓰러지면 다음 친구를 고르고(상대는 기다림), 다 쓰러지면 짐', () => {
    const p = [{ ...makeMon('giyeok', 5, 'a'), hp: 1 }, makeMon('aya', 5, 'b')];
    const { battle } = startBattle(p, [makeMon('digeut', 8, 'w')]);
    const r = attack(battle, 'c_punch', 'wrong', fixed(0.5));
    expect(r.battle.needSwitch).toBe(true);
    const s = switchTo(r.battle, 1, fixed(0.5));
    expect(me(s.battle).sp).toBe('aya');
    expect(me(s.battle).hp).toBe(maxHp(me(s.battle)));

    const alone = startBattle([{ ...makeMon('giyeok', 5, 'a'), hp: 1 }], [makeMon('digeut', 8, 'w')]).battle;
    expect(attack(alone, 'c_punch', 'wrong', fixed(0.5)).battle.result).toBe('lose');
  });

  it('회복약은 최대 체력까지만', () => {
    const p = [{ ...makeMon('giyeok', 5, 'a'), hp: 30 }];
    const { battle } = startBattle(p, wild());
    const r = heal(battle, 0, 25, fixed(0.01)); // 상대 공격 빗나감
    expect(me(r.battle).hp).toBe(maxHp(p[0]));
  });

  it('모든 기술의 상대 차례 대사가 자연스럽다 (조사)', () => {
    expect(josa('기역몬', '이/가')).toBe('기역몬이');
    expect(josa('아야몽', '을/를')).toBe('아야몽을');
    expect(josa('새싹말', '으로/로')).toBe('새싹말로');
    expect(josa('기가몬', '으로/로')).toBe('기가몬으로');
    expect(numRo(6)).toBe('6으로');
    expect(numRo(12)).toBe('12로');
    expect(numRo(10)).toBe('10으로');
    for (const id of Object.keys(MOVES) as MoveId[]) expect(MOVES[id].name.length).toBeGreaterThan(2);
  });
});
