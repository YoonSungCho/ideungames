import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playSound } from '@/shared/sound/sfx';
import { storageKey } from '@/shared/storage';
import { PALETTE, picture } from './data/pictures';
import { addStroke, emptyArt, fillPart, isComplete, makeFill, type Art, type Pattern, type Stroke } from './engine/art';

/** fill: 칠하기 · brush: 붓 · eraser: 지우개 · magic: 마법 붓(예시 색) */
export type Tool = 'fill' | 'brush' | 'eraser' | 'magic';
/** 무지개 붓: 누를 때마다 다음 색 */
export const RAINBOW = 'rainbow';
const RAINBOW_COLORS = PALETTE.slice(0, 9);
const HISTORY = 40;

export interface ColoringEvent {
  kind: 'fill' | 'done';
  part?: string;
  key: number;
}

interface State {
  tool: Tool;
  color: string;
  pattern: Pattern;
  brushSize: number;
  art: Record<string, Art>;
  event: ColoringEvent | null;
  /** 되돌리기용 (저장 안 함) */
  history: Record<string, Art[]>;
  rainbowAt: number;

  setTool: (t: Tool) => void;
  setColor: (c: string) => void;
  setPattern: (p: Pattern) => void;
  setBrushSize: (w: number) => void;
  tapPart: (pic: string, part: string) => void;
  drawStroke: (pic: string, stroke: Omit<Stroke, 'c' | 'w'>) => void;
  undo: (pic: string) => void;
  reset: (pic: string) => void;
}

let eventKey = 0;
const ev = (kind: ColoringEvent['kind'], part?: string): ColoringEvent => ({ kind, part, key: ++eventKey });

export const useColoring = create<State>()(
  persist(
    (set, get) => {
      /** 지금 색 (무지개 붓이면 다음 색으로 넘김) */
      const nextColor = () => {
        const { color, rainbowAt } = get();
        if (color !== RAINBOW) return color;
        set({ rainbowAt: rainbowAt + 1 });
        return RAINBOW_COLORS[rainbowAt % RAINBOW_COLORS.length];
      };

      const commit = (picId: string, next: Art, part?: string) => {
        const prev = get().art[picId] ?? emptyArt();
        const pic = picture(picId)!;
        const finished = !prev.done && isComplete(pic, next);
        const art = finished ? { ...next, done: true } : next;
        const hist = [...(get().history[picId] ?? []), prev].slice(-HISTORY);
        set({ art: { ...get().art, [picId]: art }, history: { ...get().history, [picId]: hist }, event: finished ? ev('done') : part ? ev('fill', part) : get().event });
        if (finished) playSound('win');
      };

      return {
        tool: 'fill',
        color: PALETTE[0],
        pattern: 'solid',
        brushSize: 6,
        art: {},
        event: null,
        history: {},
        rainbowAt: 0,

        setTool: (tool) => {
          playSound('tap');
          set({ tool });
        },
        setColor: (color) => {
          playSound('select');
          // 색을 고르면 지우개·마법 붓에서 칠하기로 돌아온다 (붓은 그대로)
          set({ color, tool: get().tool === 'brush' ? 'brush' : 'fill' });
        },
        setPattern: (pattern) => {
          playSound('tap');
          set({ pattern, tool: get().tool === 'brush' ? 'brush' : 'fill' });
        },
        setBrushSize: (brushSize) => {
          playSound('tap');
          set({ brushSize, tool: 'brush' });
        },

        tapPart: (picId, partId) => {
          const pic = picture(picId);
          const part = pic?.parts.find((p) => p.id === partId);
          if (!pic || !part) return;
          const { tool, pattern } = get();
          if (tool === 'brush') return;
          const art = get().art[picId] ?? emptyArt();
          let fill: string | null;
          if (tool === 'eraser') fill = null;
          else if (tool === 'magic') fill = part.c;
          else fill = makeFill(nextColor(), pattern);
          if ((art.fills[partId] ?? null) === fill) return;
          playSound(fill ? 'splash' : 'erase', fill ? 1.4 : 1);
          commit(picId, fillPart(art, partId, fill), partId);
        },

        drawStroke: (picId, stroke) => {
          if (!stroke.pts.length) return;
          const art = get().art[picId] ?? emptyArt();
          commit(picId, addStroke(art, { ...stroke, c: nextColor(), w: get().brushSize }));
        },

        undo: (picId) => {
          const hist = get().history[picId] ?? [];
          if (!hist.length) return;
          playSound('erase');
          const prev = hist[hist.length - 1];
          // 되돌려도 "다 칠함" 축하는 다시 하지 않는다
          const done = get().art[picId]?.done ?? false;
          set({ art: { ...get().art, [picId]: { ...prev, done: prev.done || done } }, history: { ...get().history, [picId]: hist.slice(0, -1) } });
        },

        reset: (picId) => {
          playSound('erase');
          const prev = get().art[picId];
          const hist = prev ? [...(get().history[picId] ?? []), prev].slice(-HISTORY) : get().history[picId] ?? [];
          set({ art: { ...get().art, [picId]: { ...emptyArt(), done: prev?.done ?? false } }, history: { ...get().history, [picId]: hist } });
        },
      };
    },
    {
      name: storageKey('coloring'),
      version: 1,
      partialize: (s) => ({ tool: s.tool, color: s.color, pattern: s.pattern, brushSize: s.brushSize, art: s.art }),
    },
  ),
);
