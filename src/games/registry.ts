import type { GameManifest } from './types';

/**
 * games/<id>/manifest.ts 를 자동으로 수집한다.
 * 새 게임은 폴더만 추가하면 등록된다 — 이 파일은 수정할 필요 없음.
 * manifest는 가볍게(eager) 불러오고, 게임 본체는 manifest.load()로 필요할 때만 불러온다.
 */
const modules = import.meta.glob<{ default: GameManifest }>('./*/manifest.ts', { eager: true });

export const games: GameManifest[] = Object.values(modules)
  .map((m) => m.default)
  .filter((g) => !g.hidden || import.meta.env.DEV)
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title, 'ko'));

const byId = new Map(games.map((g) => [g.id, g]));

export const getGame = (id: string) => byId.get(id);
