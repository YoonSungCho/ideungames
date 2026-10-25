import { createElement, forwardRef, type ReactNode } from 'react';
import type { Part, Picture } from '../data/pictures';
import { parseFill, strokePath, type Art, type Fill, type Pattern } from '../engine/art';

const INK = '#2f2a55';
const BLANK = '#ffffff';

const patternId = (pattern: Pattern, color: string) => `cp-${pattern}-${color.slice(1)}`;

/** 물방울·줄무늬·반짝이 무늬 (저장한 그림 파일에도 그대로 나오게 CSS 없이 속성만) */
function PatternDef({ pattern, color }: { pattern: Pattern; color: string }) {
  const id = patternId(pattern, color);
  if (pattern === 'dots')
    return (
      <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill={color} />
        <circle cx="3" cy="3" r="2.2" fill="#fff" fillOpacity="0.65" />
        <circle cx="9" cy="9" r="2.2" fill="#fff" fillOpacity="0.65" />
      </pattern>
    );
  if (pattern === 'stripes')
    return (
      <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" fill={color} />
        <rect width="4" height="10" fill="#fff" fillOpacity="0.5" />
      </pattern>
    );
  return (
    <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
      <rect width="18" height="18" fill={color} />
      <path d="M5 1.5L6 4L8.5 5L6 6L5 8.5L4 6L1.5 5L4 4Z M13.5 10L14.2 12.3L16.5 13L14.2 13.7L13.5 16L12.8 13.7L10.5 13L12.8 12.3Z" fill="#fff" fillOpacity="0.85" />
      <circle cx="14" cy="4" r="1" fill="#fff" fillOpacity="0.7" />
      <circle cx="4" cy="14" r="0.9" fill="#fff" fillOpacity="0.7" />
    </pattern>
  );
}

export function paint(f: Fill | undefined) {
  if (!f) return BLANK;
  const { color, pattern } = parseFill(f);
  return pattern === 'solid' ? color : `url(#${patternId(pattern, color)})`;
}

interface DrawingProps {
  pic: Picture;
  art?: Art;
  /** 조각마다 덧붙일 속성 (누르기·이름 등) */
  partProps?: (p: Part) => Record<string, unknown>;
  /** 그리는 중인 붓 선 등 맨 위 덧그림 (선 그림 아래) */
  overlay?: ReactNode;
  /** 맨 위 (붓 입력판 등) */
  top?: ReactNode;
  className?: string;
  title?: string;
}

/** 도안 + 칠 + 붓 선 + 선 그림 */
export const Drawing = forwardRef<SVGSVGElement, DrawingProps>(function Drawing({ pic, art, partProps, overlay, top, className, title }, ref) {
  const patterns = new Map<string, { pattern: Pattern; color: string }>();
  for (const f of Object.values(art?.fills ?? {})) {
    const p = parseFill(f);
    if (p.pattern !== 'solid') patterns.set(patternId(p.pattern, p.color), p);
  }
  const clip = `cc-${pic.id}`;
  return (
    <svg ref={ref} viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        {[...patterns.values()].map((p) => <PatternDef key={patternId(p.pattern, p.color)} {...p} />)}
        <clipPath id={clip}>
          <rect width="200" height="200" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {pic.parts.map((p) =>
          createElement(p.el, {
            key: p.id,
            ...p.a,
            fill: paint(art?.fills[p.id]),
            stroke: INK,
            strokeWidth: 2.4,
            strokeLinejoin: 'round',
            ...partProps?.(p),
          }),
        )}
        {art?.strokes.map((s, i) => (
          <path key={i} d={strokePath(s.pts)} fill="none" stroke={s.c} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {overlay}
        {pic.lines && <path d={pic.lines} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />}
      </g>
      {top}
    </svg>
  );
});
