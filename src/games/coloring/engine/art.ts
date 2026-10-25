import type { Picture } from '../data/pictures';

/** 칠하는 무늬: 단색 · 물방울 · 줄무늬 · 반짝이 */
export type Pattern = 'solid' | 'dots' | 'stripes' | 'sparkle';
export const PATTERNS: Pattern[] = ['solid', 'dots', 'stripes', 'sparkle'];

/** 조각 하나의 칠: '#ef476f' 또는 'dots:#ef476f' */
export type Fill = string;

export const makeFill = (color: string, pattern: Pattern): Fill => (pattern === 'solid' ? color : `${pattern}:${color}`);
export function parseFill(f: Fill): { color: string; pattern: Pattern } {
  const [a, b] = f.split(':');
  return b ? { color: b, pattern: a as Pattern } : { color: a, pattern: 'solid' };
}

/** 붓으로 그린 선: 색 · 굵기 · [x, y, x, y, …] (그림판 좌표). e = 지우개 선 (앞서 그린 붓 선을 지운다) */
export interface Stroke {
  c: string;
  w: number;
  pts: number[];
  e?: 1;
}

export interface Art {
  fills: Record<string, Fill>;
  strokes: Stroke[];
  /** 다 칠해서 축하를 받았음 */
  done: boolean;
}

export const emptyArt = (): Art => ({ fills: {}, strokes: [], done: false });

export function fillPart(art: Art, partId: string, fill: Fill | null): Art {
  const fills = { ...art.fills };
  if (fill === null) delete fills[partId];
  else fills[partId] = fill;
  return { ...art, fills };
}

/** 한 그림에 붓 선은 이만큼까지 (저장 공간) */
export const MAX_STROKES = 300;
export const addStroke = (art: Art, s: Stroke): Art => ({ ...art, strokes: [...art.strokes, s].slice(-MAX_STROKES) });

export function progress(pic: Picture, art: Art | undefined) {
  const filled = pic.parts.filter((p) => art?.fills[p.id]).length;
  return { filled, total: pic.parts.length };
}

export const isComplete = (pic: Picture, art: Art) => pic.parts.every((p) => art.fills[p.id]);

/** 붓 선 점 줄이기: 앞 점과 tol보다 가까운 점은 버린다 (끝점은 남김) */
export function simplify(pts: number[], tol: number): number[] {
  if (pts.length <= 4) return pts;
  const out = [pts[0], pts[1]];
  for (let i = 2; i < pts.length - 2; i += 2) {
    const dx = pts[i] - out[out.length - 2];
    const dy = pts[i + 1] - out[out.length - 1];
    if (dx * dx + dy * dy >= tol * tol) out.push(pts[i], pts[i + 1]);
  }
  out.push(pts[pts.length - 2], pts[pts.length - 1]);
  return out.map((v) => Math.round(v * 10) / 10);
}

/** 점 목록 → 부드러운 SVG 선 (중점을 잇는 2차 곡선) */
export function strokePath(pts: number[]): string {
  if (pts.length < 4) return pts.length === 2 ? `M${pts[0]} ${pts[1]}h0.01` : '';
  let d = `M${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length - 2; i += 2) {
    const mx = (pts[i] + pts[i + 2]) / 2;
    const my = (pts[i + 1] + pts[i + 3]) / 2;
    d += `Q${pts[i]} ${pts[i + 1]} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d + `L${pts[pts.length - 2]} ${pts[pts.length - 1]}`;
}

/** 점(x, y)에서 선까지 가장 가까운 거리 */
function distToStroke(pts: number[], x: number, y: number): number {
  if (pts.length === 2) return Math.hypot(pts[0] - x, pts[1] - y);
  let best = Infinity;
  for (let i = 0; i + 3 < pts.length; i += 2) {
    const [ax, ay, bx, by] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2)) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx - x, ay + t * dy - y));
  }
  return best;
}

/** (x, y)에 지금 보이는 붓 그림이 있는가 (r = 지우개 반지름만큼 넉넉히). 나중 지우개 선에 지워졌으면 없음 */
export function paintAt(strokes: Stroke[], x: number, y: number, r = 0): boolean {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];
    const d = distToStroke(s.pts, x, y);
    if (s.e) {
      if (d <= s.w / 2) return false;
    } else if (d <= s.w / 2 + r) return true;
  }
  return false;
}
