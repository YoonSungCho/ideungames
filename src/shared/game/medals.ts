/**
 * 모든 게임 공용 메달. 기록 방향(better)에 따라
 *  - 'lower'  : 시간처럼 작을수록 좋음 → 기준값 이하이면 획득
 *  - 'higher' : 점수처럼 클수록 좋음   → 기준값 이상이면 획득
 */
export type Medal = 'diamond' | 'gold' | 'silver' | 'bronze';
export const MEDALS: Medal[] = ['diamond', 'gold', 'silver', 'bronze'];
export const MEDAL_ICON: Record<Medal, string> = { diamond: '💎', gold: '🥇', silver: '🥈', bronze: '🥉' };
export const MEDAL_LABEL: Record<Medal, string> = { diamond: '다이아', gold: '금', silver: '은', bronze: '동' };

/** [다이아, 금, 은, 동] 기준값 (시간이면 ms, 점수면 점) */
export type MedalLimits = readonly [number, number, number, number];
export type Better = 'lower' | 'higher';

const reaches = (value: number, limit: number, better: Better) => (better === 'lower' ? value <= limit : value >= limit);

export function medalOf(limits: MedalLimits, value: number | undefined, better: Better): Medal | null {
  if (value === undefined) return null;
  return MEDALS.find((_, i) => reaches(value, limits[i], better)) ?? null;
}

/** 지금 기록보다 한 단계 좋은 메달과 그 기준값 (기록 화면·클리어 창의 "다음 목표") */
export function nextMedal(limits: MedalLimits, best: number | undefined, better: Better) {
  const current = medalOf(limits, best, better);
  const idx = current ? MEDALS.indexOf(current) : MEDALS.length;
  if (idx === 0) return null;
  return { medal: MEDALS[idx - 1], limit: limits[idx - 1] };
}

/** 시간 기록 게임에서, 지금 흐른 시간으로 아직 노릴 수 있는 가장 좋은 메달과 남은 시간 */
export function timeTarget(limits: MedalLimits, elapsedMs: number) {
  for (let i = 0; i < MEDALS.length; i++) {
    const leftMs = limits[i] - elapsedMs;
    if (leftMs > 0) return { medal: MEDALS[i], leftMs };
  }
  return null;
}

/** 점수 게임에서, 지금 점수로 다음에 받을 메달과 필요한 점수 */
export function scoreTarget(limits: MedalLimits, score: number) {
  for (let i = MEDALS.length - 1; i >= 0; i--) {
    if (score < limits[i]) return { medal: MEDALS[i], need: limits[i] - score };
  }
  return null;
}

export function betterThan(a: number, b: number | undefined, better: Better) {
  return b === undefined || (better === 'lower' ? a < b : a > b);
}
