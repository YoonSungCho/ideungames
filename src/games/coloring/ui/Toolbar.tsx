import type { CSSProperties } from 'react';
import { COLOR_NAME, PALETTE } from '../data/pictures';
import { PATTERNS, type Pattern } from '../engine/art';
import { RAINBOW, useColoring, type Tool } from '../store';
import styles from './Coloring.module.css';

const TOOLS: { id: Tool; icon: string; name: string }[] = [
  { id: 'fill', icon: '🪣', name: '칠하기' },
  { id: 'brush', icon: '🖌️', name: '붓' },
  { id: 'eraser', icon: '🧽', name: '지우개' },
  { id: 'magic', icon: '🪄', name: '마법 붓' },
];
const PATTERN_NAME: Record<Pattern, string> = { solid: '그냥', dots: '물방울', stripes: '줄무늬', sparkle: '반짝이' };
const SIZES = [{ w: 3, name: '가는 붓' }, { w: 6, name: '보통 붓' }, { w: 12, name: '굵은 붓' }];

/** 도구 줄: 칠하기·붓·지우개·마법 붓 | 되돌리기·처음부터·저장 */
export function Tools({ onUndo, canUndo, onReset, onSave }: { onUndo: () => void; canUndo: boolean; onReset: () => void; onSave: () => void }) {
  const tool = useColoring((s) => s.tool);
  const setTool = useColoring((s) => s.setTool);
  return (
    <div className={styles.tools} role="toolbar" aria-label="도구">
      {TOOLS.map((t) => (
        <button key={t.id} className={[styles.tool, tool === t.id && styles.on].filter(Boolean).join(' ')} onClick={() => setTool(t.id)} aria-pressed={tool === t.id} aria-label={t.name}>
          <span className={styles.toolIcon}>{t.icon}</span>
          <span className={styles.toolName}>{t.name}</span>
        </button>
      ))}
      <button className={[styles.tool, styles.toolFn].join(' ')} onClick={onUndo} disabled={!canUndo} aria-label="되돌리기">
        <span className={styles.toolIcon}>↩️</span>
        <span className={styles.toolName}>되돌리기</span>
      </button>
      <button className={[styles.tool, styles.toolFn].join(' ')} onClick={onReset} aria-label="처음부터">
        <span className={styles.toolIcon}>🗑️</span>
        <span className={styles.toolName}>처음부터</span>
      </button>
      <button className={[styles.tool, styles.toolFn].join(' ')} onClick={onSave} aria-label="그림 저장">
        <span className={styles.toolIcon}>📷</span>
        <span className={styles.toolName}>저장</span>
      </button>
    </div>
  );
}

/** 도구별 옵션 한 줄: 칠하기 → 무늬, 붓 → 굵기, 지우개·마법 붓 → 설명 */
export function Options() {
  const tool = useColoring((s) => s.tool);
  const pattern = useColoring((s) => s.pattern);
  const brushSize = useColoring((s) => s.brushSize);
  const color = useColoring((s) => s.color);
  const { setPattern, setBrushSize } = useColoring.getState();
  const swatch = color === RAINBOW ? undefined : color;

  if (tool === 'eraser') return <p className={styles.optHint}>🧽 지울 곳을 눌러 봐!</p>;
  if (tool === 'magic') return <p className={styles.optHint}>🪄 누르면 어울리는 색으로 칠해 줘!</p>;
  if (tool === 'brush')
    return (
      <div className={styles.options} role="radiogroup" aria-label="붓 굵기">
        {SIZES.map((s) => (
          <button key={s.w} role="radio" aria-checked={brushSize === s.w} aria-label={s.name} className={[styles.opt, brushSize === s.w && styles.on].filter(Boolean).join(' ')} onClick={() => setBrushSize(s.w)}>
            <span className={styles.dot} style={{ width: s.w * 2 + 4, height: s.w * 2 + 4, background: swatch ?? 'conic-gradient(#ef476f, #ffd166, #7ed957, #3fa9f5, #9b6bff, #ef476f)' }} />
          </button>
        ))}
      </div>
    );
  return (
    <div className={styles.options} role="radiogroup" aria-label="무늬">
      {PATTERNS.map((p) => (
        <button key={p} role="radio" aria-checked={pattern === p} aria-label={PATTERN_NAME[p]} className={[styles.opt, styles[`pat_${p}`], pattern === p && styles.on].filter(Boolean).join(' ')} onClick={() => setPattern(p)} style={{ '--c': swatch ?? '#9b6bff' } as CSSProperties}>
          <span className={styles.patSwatch} />
          <span className={styles.optName}>{PATTERN_NAME[p]}</span>
        </button>
      ))}
    </div>
  );
}

/** 색 고르기: 🌈 무지개 + 18색 */
export function Palette() {
  const color = useColoring((s) => s.color);
  const setColor = useColoring((s) => s.setColor);
  return (
    <div className={styles.palette} role="radiogroup" aria-label="색">
      <button role="radio" aria-checked={color === RAINBOW} aria-label="무지개" className={[styles.swatch, styles.rainbow, color === RAINBOW && styles.on].filter(Boolean).join(' ')} onClick={() => setColor(RAINBOW)} />
      {PALETTE.map((c) => (
        <button key={c} role="radio" aria-checked={color === c} aria-label={COLOR_NAME[c]} className={[styles.swatch, color === c && styles.on].filter(Boolean).join(' ')} style={{ background: c }} onClick={() => setColor(c)} />
      ))}
    </div>
  );
}
