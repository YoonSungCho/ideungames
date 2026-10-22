import { betterThan, type Better } from './medals';

/** 한 판의 기록. value는 시간(ms) 또는 점수 */
export interface Run {
  value: number;
  /** 끝난 시각 (epoch ms) */
  at: number;
  mistakes?: number;
}

/** 모드·난이도 하나의 기록 묶음 */
export interface RecordBook {
  plays: number;
  best?: number;
  /** 좋은 순 TOP 기록 */
  runs: Run[];
}

export const TOP_RUNS = 10;
export const emptyBook = (): RecordBook => ({ plays: 0, runs: [] });

/** 기록을 추가하고, 새 기록 묶음과 이번 기록의 순위(1부터, TOP 밖이면 undefined)를 돌려준다 */
export function addRun(book: RecordBook | undefined, run: Run, better: Better) {
  const prev = book ?? emptyBook();
  const runs = [...prev.runs, run].sort((a, b) => (better === 'lower' ? a.value - b.value : b.value - a.value)).slice(0, TOP_RUNS);
  const idx = runs.indexOf(run);
  return {
    book: {
      plays: prev.plays + 1,
      best: betterThan(run.value, prev.best, better) ? run.value : prev.best,
      runs,
    } satisfies RecordBook,
    rank: idx === -1 ? undefined : idx + 1,
    prevBest: prev.best,
  };
}

/** 기록 날짜를 아이가 읽기 쉽게: 오늘 / 어제 / 10.21 */
export function whenLabel(at: number) {
  if (!at) return '';
  const d = new Date(at);
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(at).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  return `${d.getMonth() + 1}.${d.getDate()}`;
}
