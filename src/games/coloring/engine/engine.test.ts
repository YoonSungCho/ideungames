import { beforeEach, describe, expect, it } from 'vitest';
import { PALETTE, PICTURES } from '../data/pictures';
import { useColoring } from '../store';
import { emptyArt, fillPart, isComplete, makeFill, parseFill, simplify, strokePath } from './art';

const S = () => useColoring.getState();

describe('도안', () => {
  it('그림마다 조각 이름·id가 겹치지 않고, 예시 색이 있다', () => {
    const ids = new Set<string>();
    for (const pic of PICTURES) {
      expect(new Set(pic.parts.map((p) => p.name)).size, pic.name).toBe(pic.parts.length);
      for (const p of pic.parts) {
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);
        expect(p.c).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
    expect(new Set(PICTURES.map((p) => p.id)).size).toBe(PICTURES.length);
  });
});

describe('칠하기', () => {
  it('무늬 칠 값 만들기·읽기', () => {
    expect(makeFill('#ef476f', 'solid')).toBe('#ef476f');
    expect(parseFill(makeFill('#ef476f', 'dots'))).toEqual({ color: '#ef476f', pattern: 'dots' });
  });

  it('모든 조각을 칠하면 완성', () => {
    const pic = PICTURES[0];
    let art = emptyArt();
    for (const p of pic.parts) art = fillPart(art, p.id, p.c);
    expect(isComplete(pic, art)).toBe(true);
    expect(isComplete(pic, fillPart(art, pic.parts[0].id, null))).toBe(false);
  });

  it('붓 선: 가까운 점은 줄이고 끝점은 남긴다', () => {
    const pts = [0, 0, 0.2, 0, 0.4, 0, 5, 5, 5.1, 5, 10, 10];
    const s = simplify(pts, 1);
    expect(s.slice(0, 2)).toEqual([0, 0]);
    expect(s.slice(-2)).toEqual([10, 10]);
    expect(s.length).toBeLessThan(pts.length);
    expect(strokePath([1, 1])).toContain('M1 1');
  });
});

describe('색칠 가게', () => {
  beforeEach(() => useColoring.setState({ art: {}, history: {}, tool: 'fill', color: PALETTE[0], pattern: 'solid', event: null }));

  it('누르면 칠하고, 되돌리기·지우개·마법 붓', () => {
    const pic = PICTURES[0];
    const [a, b] = pic.parts;
    S().tapPart(pic.id, a.id);
    expect(S().art.cat.fills[a.id]).toBe(PALETTE[0]);
    S().setColor(PALETTE[3]);
    S().setPattern('dots');
    S().tapPart(pic.id, a.id);
    expect(S().art.cat.fills[a.id]).toBe(`dots:${PALETTE[3]}`);
    S().undo(pic.id);
    expect(S().art.cat.fills[a.id]).toBe(PALETTE[0]);
    S().setTool('eraser');
    S().tapPart(pic.id, a.id);
    expect(S().art.cat.fills[a.id]).toBeUndefined();
    S().setTool('magic');
    S().tapPart(pic.id, b.id);
    expect(S().art.cat.fills[b.id]).toBe(b.c);
  });

  it('다 칠하면 한 번만 축하', () => {
    const pic = PICTURES.find((p) => p.id === 'icecream')!;
    S().setTool('magic');
    for (const p of pic.parts) S().tapPart(pic.id, p.id);
    expect(S().art.icecream.done).toBe(true);
    expect(S().event?.kind).toBe('done');
    S().setTool('eraser');
    S().tapPart(pic.id, pic.parts[0].id);
    S().setTool('magic');
    S().tapPart(pic.id, pic.parts[0].id);
    expect(S().event?.kind).toBe('fill');
  });

  it('무지개 붓은 누를 때마다 다음 색', () => {
    const pic = PICTURES[0];
    S().setColor('rainbow');
    S().tapPart(pic.id, pic.parts[0].id);
    S().tapPart(pic.id, pic.parts[1].id);
    expect(S().art.cat.fills[pic.parts[0].id]).not.toBe(S().art.cat.fills[pic.parts[1].id]);
  });

  it('붓으로 그린 선은 남고, 처음부터는 비우되 되돌릴 수 있다', () => {
    S().setTool('brush');
    S().drawStroke('cat', { pts: [10, 10, 20, 20] });
    expect(S().art.cat.strokes).toHaveLength(1);
    S().reset('cat');
    expect(S().art.cat.strokes).toHaveLength(0);
    S().undo('cat');
    expect(S().art.cat.strokes).toHaveLength(1);
  });
});
