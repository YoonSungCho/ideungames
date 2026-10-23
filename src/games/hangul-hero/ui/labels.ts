import type { StageId } from '../store';

export const stageLabel = (s: StageId) => (s === 'boss' ? '보스전' : `${s + 1}단계`);
