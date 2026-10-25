import { theme, type Level, type Rule } from '../engine/deck';
import { josa } from '@/shared/korean';
import { rival, type Setup } from '../store';

export const LEVEL_LABEL: Record<Level, string> = { tiny: '꼬마', easy: '쉬움', medium: '중간', hard: '어려움' };
export const LEVEL_STARS: Record<Level, number> = { tiny: 1, easy: 2, medium: 3, hard: 4 };
/** 단계 색 (카드 그림자·별) */
export const LEVEL_COLOR: Record<Level, string> = { tiny: 'var(--num-5)', easy: 'var(--num-3)', medium: 'var(--num-2)', hard: 'var(--num-1)' };
export const RULE_LABEL: Record<Rule, string> = { same: '같은 그림', word: '그림과 글자', math: '계산식' };
export const RULE_ICON: Record<Rule, string> = { same: '🖼️', word: '🔤', math: '➕' };
/** 단계별 계산식 범위 (메뉴 설명) */
export const MATH_DESC: Record<Level, string> = { tiny: '10까지 더하기', easy: '10까지 더하기·빼기', medium: '20까지 더하기·빼기', hard: '50까지 더하기·빼기' };

/** 계산식은 그림 테마와 상관없어서 테마 이름을 빼고 보여 준다 */
const cardsTitle = (s: Setup) => (s.rule === 'math' ? `${RULE_LABEL.math} · ${LEVEL_LABEL[s.level]}` : `${theme(s.theme).name} · ${RULE_LABEL[s.rule]} · ${LEVEL_LABEL[s.level]}`);
export const setupTitle = (s: Setup) => (s.players === 2 ? `${josa(rival(s.rival).name, '과/와')} 대결 · ${cardsTitle(s)}` : cardsTitle(s));

/** 대결하는 두 사람: [나, 상대] */
export const PLAYER_COLOR = ['#7c5cff', '#ff8a3d'] as const;
export function players(s: Pick<Setup, 'rival'>, myName: string) {
  const r = rival(s.rival);
  return [
    { name: myName.trim() || '나', icon: '🙋' },
    { name: r.name, icon: r.icon },
  ] as const;
}
