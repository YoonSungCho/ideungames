import { learnsAt, species, type SpeciesId } from '../data/species';

/** 내가 데리고 다니는(또는 상대가 내보낸) 몬스터 한 마리 */
export interface Mon {
  uid: string;
  sp: SpeciesId;
  lv: number;
  xp: number;
  hp: number;
}

export const MAX_LEVEL = 30;
export const PARTY_MAX = 6;

export const maxHp = (m: Pick<Mon, 'sp' | 'lv'>) => Math.round(species(m.sp).hp * (1 + (m.lv - 1) * 0.18));
/** 다음 레벨까지 필요한 경험치 */
export const xpNeed = (lv: number) => 10 + lv * 5;

let uidSeq = 0;
export const newUid = () => `${Date.now().toString(36)}${(uidSeq++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export function makeMon(sp: SpeciesId, lv: number, uid = newUid()): Mon {
  const m = { uid, sp, lv, xp: 0, hp: 0 };
  return { ...m, hp: maxHp(m) };
}

export const healed = (m: Mon): Mon => ({ ...m, hp: maxHp(m) });

export interface Growth {
  mon: Mon;
  /** 오른 레벨들 */
  levels: number[];
  learned: string[];
  evolvedFrom?: SpeciesId;
}

/**
 * 경험치를 더하고 레벨업·진화. 레벨이 오르면 오른 만큼 체력도 늘어난다.
 */
export function gainXp(m: Mon, amount: number): Growth {
  let mon = { ...m, xp: m.xp + amount };
  const levels: number[] = [];
  const learned: string[] = [];
  let evolvedFrom: SpeciesId | undefined;
  while (mon.lv < MAX_LEVEL && mon.xp >= xpNeed(mon.lv)) {
    const before = maxHp(mon);
    mon = { ...mon, xp: mon.xp - xpNeed(mon.lv), lv: mon.lv + 1 };
    levels.push(mon.lv);
    const evo = species(mon.sp).evolve;
    if (evo && mon.lv >= evo.at) {
      evolvedFrom = mon.sp;
      mon = { ...mon, sp: evo.to as SpeciesId };
    }
    mon.hp = Math.min(maxHp(mon), mon.hp + (maxHp(mon) - before));
    const mv = learnsAt(mon.sp, mon.lv);
    if (mv) learned.push(mv);
  }
  if (mon.lv >= MAX_LEVEL) mon.xp = 0;
  return { mon, levels, learned, evolvedFrom };
}
