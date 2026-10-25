import { useId, type ReactNode } from 'react';
import { species, type SpeciesId } from '../data/species';
import { LOOKS, type Body, type Look } from './looks';
import styles from './MonsterArt.module.css';

/** #rrggbb를 흰색(+)·검은색(-) 쪽으로 섞기 */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** 몸 모양별: 외곽선 path, 얼굴 위치, 배 위치, 팔다리 위치 */
interface Frame {
  path: string;
  face: { x: number; y: number; gap: number };
  belly: { x: number; y: number; rx: number; ry: number };
  top: number;
  arms?: [number, number][];
  feet?: [number, number][];
}

const FRAMES: Record<Body, Frame> = {
  round: {
    path: 'M80 54 C110 54 126 76 126 100 C126 128 106 144 80 144 C54 144 34 128 34 100 C34 76 50 54 80 54 Z',
    face: { x: 80, y: 90, gap: 18 }, belly: { x: 80, y: 120, rx: 26, ry: 17 }, top: 56,
    arms: [[38, 112], [122, 112]], feet: [[62, 144], [98, 144]],
  },
  pear: {
    path: 'M80 46 C104 46 116 66 118 86 C130 98 132 116 126 130 C118 146 100 148 80 148 C60 148 42 146 34 130 C28 116 30 98 42 86 C44 66 56 46 80 46 Z',
    face: { x: 80, y: 80, gap: 17 }, belly: { x: 80, y: 122, rx: 28, ry: 19 }, top: 48,
    arms: [[40, 108], [120, 108]], feet: [[60, 148], [100, 148]],
  },
  egg: {
    path: 'M80 44 C106 44 120 70 120 98 C120 128 102 146 80 146 C58 146 40 128 40 98 C40 70 54 44 80 44 Z',
    face: { x: 80, y: 82, gap: 16 }, belly: { x: 80, y: 120, rx: 24, ry: 19 }, top: 46,
    feet: [[66, 146], [94, 146]],
  },
  fish: {
    path: 'M74 62 C108 60 128 80 128 100 C128 122 108 138 74 138 C44 138 26 122 26 100 C26 78 44 64 74 62 Z',
    face: { x: 66, y: 92, gap: 16 }, belly: { x: 76, y: 120, rx: 30, ry: 13 }, top: 64,
  },
  rock: {
    path: 'M40 140 C30 132 28 108 32 94 C36 78 46 66 60 58 C72 52 90 52 102 58 C116 66 126 80 128 96 C132 112 130 132 120 140 C104 148 56 148 40 140 Z',
    face: { x: 80, y: 90, gap: 18 }, belly: { x: 80, y: 122, rx: 26, ry: 15 }, top: 56,
    arms: [[34, 116], [126, 116]], feet: [[60, 146], [100, 146]],
  },
  ghost: {
    path: 'M36 136 L36 98 C36 66 56 48 80 48 C104 48 124 66 124 98 L124 136 C120 146 112 146 108 138 C104 146 96 148 92 140 C88 148 72 148 68 140 C64 148 56 146 52 138 C48 146 40 146 36 136 Z',
    face: { x: 80, y: 88, gap: 17 }, belly: { x: 80, y: 118, rx: 22, ry: 15 }, top: 50,
    arms: [[38, 106], [122, 106]],
  },
  bot: {
    path: 'M50 56 L110 56 C120 56 126 62 126 72 L126 128 C126 138 120 144 110 144 L50 144 C40 144 34 138 34 128 L34 72 C34 62 40 56 50 56 Z',
    face: { x: 80, y: 88, gap: 18 }, belly: { x: 80, y: 124, rx: 26, ry: 13 }, top: 56,
    arms: [[32, 108], [128, 108]], feet: [[60, 146], [100, 146]],
  },
  cloud: {
    path: 'M46 136 C28 136 24 112 38 104 C30 86 46 70 62 76 C66 58 94 54 102 72 C118 66 134 82 126 100 C140 108 134 136 116 136 Z',
    face: { x: 80, y: 96, gap: 18 }, belly: { x: 80, y: 127, rx: 24, ry: 9.5 }, top: 60,
  },
};

const INK = '#2b2350';
/** 속성마다 눈동자 색 */
const IRIS: Record<string, string> = { consonant: '#c2410c', vowel: '#1d4ed8', batchim: '#7a4a2a', word: '#15803d', number: '#b45309', math: '#0f766e', chaos: '#9333ea' };

/**
 * 몬스터 그림: 몸 모양 + 귀·뿔·꼬리·날개·머리 장식·무늬 + 표정 + 배의 글자.
 * 진화한 모습(stage 2)은 왕관과 빛이 더해진다. silhouette이면 도감에서 아직 못 본 그림자.
 */
export function MonsterArt({ sp, size = 120, silhouette = false, animate = false, className }: { sp: SpeciesId; size?: number; silhouette?: boolean; animate?: boolean; className?: string }) {
  const s = species(sp);
  const look: Look = LOOKS[sp];
  const uid = useId().replace(/:/g, '');
  const f = FRAMES[look.body];
  const base = silhouette ? '#c9c2e3' : s.color;
  const light = shade(base, 0.45);
  const dark = shade(base, -0.28);
  const line = silhouette ? '#aaa2cc' : shade(base, -0.62);
  const accent = silhouette ? '#bdb5dc' : look.accent ?? light;
  const accentDark = silhouette ? '#aaa2cc' : shade(look.accent ?? base, -0.45);
  const belly = silhouette ? '#d6d0ec' : look.belly ?? shade(base, 0.72);
  const sw = 3.2;
  const wing = silhouette ? base : shade(base, -0.12);
  const fill = `url(#b${uid})`;
  const P = (d: string, c = fill, extra: Record<string, unknown> = {}) => <path d={d} fill={c} stroke={line} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" {...extra} />;

  const back: ReactNode[] = [];
  const front: ReactNode[] = [];
  const { face, top } = f;
  const cx = face.x;

  // 꼬리
  switch (look.tail) {
    case 'flame':
      back.push(
        <g key="tail" className={animate ? styles.flicker : undefined} style={{ transformOrigin: '118px 120px' }}>
          {P('M112 124 C128 122 134 108 130 96 C138 100 144 90 140 78 C150 90 152 110 142 122 C134 134 120 136 112 130 Z', accent, { stroke: accentDark })}
          <path d="M120 124 C130 120 134 110 132 102 C138 108 138 118 132 124 Z" fill="#fff6c7" />
        </g>,
      );
      break;
    case 'leaf':
      back.push(<g key="tail">{P('M114 126 C132 128 146 114 148 96 C134 96 118 106 114 126 Z', accent, { stroke: accentDark })}<path d="M116 124 C126 116 136 106 146 98" stroke={accentDark} strokeWidth="2" fill="none" /></g>);
      break;
    case 'fish':
      back.push(<g key="tail">{P('M122 100 C134 86 146 76 156 74 C150 90 150 110 156 126 C146 124 134 114 122 100 Z', accent, { stroke: accentDark })}</g>);
      break;
    case 'curl':
      back.push(<path key="tail" d="M116 128 C138 132 146 112 136 104 C128 98 120 108 128 114" fill="none" stroke={line} strokeWidth="9" strokeLinecap="round" />, <path key="tail2" d="M116 128 C138 132 146 112 136 104 C128 98 120 108 128 114" fill="none" stroke={dark} strokeWidth="4.5" strokeLinecap="round" />);
      break;
    case 'bolt':
      back.push(<g key="tail">{P('M114 128 L132 112 L124 108 L146 86 L138 104 L146 106 L122 130 Z', accent, { stroke: accentDark })}</g>);
      break;
  }

  // 날개
  switch (look.wings) {
    case 'feather':
      back.push(
        <g key="wings">
          {P('M44 96 C26 88 12 96 8 112 C18 110 22 118 30 116 C30 124 38 128 46 122 Z', wing)}
          {P('M116 96 C134 88 148 96 152 112 C142 110 138 118 130 116 C130 124 122 128 114 122 Z', wing)}
        </g>,
      );
      break;
    case 'bat':
      back.push(
        <g key="wings">
          {P('M42 92 C26 76 10 78 4 92 C12 92 14 100 20 102 C20 110 30 112 34 108 C38 114 44 112 46 106 Z', wing)}
          {P('M118 92 C134 76 150 78 156 92 C148 92 146 100 140 102 C140 110 130 112 126 108 C122 114 116 112 114 106 Z', wing)}
        </g>,
      );
      break;
    case 'butterfly':
      back.push(
        <g key="wings">
          {P('M46 92 C20 62 2 74 6 96 C8 110 26 110 46 104 Z', accent, { stroke: accentDark })}
          {P('M46 108 C26 112 14 126 22 136 C32 144 44 128 50 116 Z', shade(accent === '#7be0ff' ? '#ff9fd4' : accent, -0.1), { stroke: accentDark })}
          {P('M114 92 C140 62 158 74 154 96 C152 110 134 110 114 104 Z', accent, { stroke: accentDark })}
          {P('M114 108 C134 112 146 126 138 136 C128 144 116 128 110 116 Z', shade(accent === '#7be0ff' ? '#ff9fd4' : accent, -0.1), { stroke: accentDark })}
          <circle cx="22" cy="90" r="5" fill="#fff" opacity="0.7" />
          <circle cx="138" cy="90" r="5" fill="#fff" opacity="0.7" />
        </g>,
      );
      break;
  }

  // 귀
  const earY = top + 6;
  switch (look.ears) {
    case 'cat':
      back.push(
        <g key="ears">
          {P(`M${cx - 34} ${earY + 18} L${cx - 32} ${earY - 22} L${cx - 8} ${earY + 2} Z`)}
          {P(`M${cx + 34} ${earY + 18} L${cx + 32} ${earY - 22} L${cx + 8} ${earY + 2} Z`)}
          <path d={`M${cx - 28} ${earY + 10} L${cx - 27} ${earY - 12} L${cx - 14} ${earY + 2} Z`} fill={silhouette ? belly : '#ffb3c7'} />
          <path d={`M${cx + 28} ${earY + 10} L${cx + 27} ${earY - 12} L${cx + 14} ${earY + 2} Z`} fill={silhouette ? belly : '#ffb3c7'} />
        </g>,
      );
      break;
    case 'bunny':
      back.push(
        <g key="ears">
          {P(`M${cx - 20} ${earY + 8} C${cx - 34} ${earY - 18} ${cx - 30} ${earY - 46} ${cx - 20} ${earY - 46} C${cx - 10} ${earY - 46} ${cx - 6} ${earY - 18} ${cx - 8} ${earY + 6} Z`)}
          {P(`M${cx + 20} ${earY + 8} C${cx + 34} ${earY - 18} ${cx + 30} ${earY - 46} ${cx + 20} ${earY - 46} C${cx + 10} ${earY - 46} ${cx + 6} ${earY - 18} ${cx + 8} ${earY + 6} Z`)}
          <path d={`M${cx - 19} ${earY} C${cx - 26} ${earY - 18} ${cx - 24} ${earY - 38} ${cx - 19} ${earY - 38} C${cx - 14} ${earY - 38} ${cx - 12} ${earY - 18} ${cx - 14} ${earY} Z`} fill={silhouette ? belly : accent} />
          <path d={`M${cx + 19} ${earY} C${cx + 26} ${earY - 18} ${cx + 24} ${earY - 38} ${cx + 19} ${earY - 38} C${cx + 14} ${earY - 38} ${cx + 12} ${earY - 18} ${cx + 14} ${earY} Z`} fill={silhouette ? belly : accent} />
        </g>,
      );
      break;
    case 'bear':
      back.push(
        <g key="ears">
          <circle cx={cx - 30} cy={earY + 4} r="13" fill={fill} stroke={line} strokeWidth={sw} />
          <circle cx={cx + 30} cy={earY + 4} r="13" fill={fill} stroke={line} strokeWidth={sw} />
          <circle cx={cx - 30} cy={earY + 5} r="6.5" fill={silhouette ? belly : accent} />
          <circle cx={cx + 30} cy={earY + 5} r="6.5" fill={silhouette ? belly : accent} />
        </g>,
      );
      break;
    case 'fin':
      back.push(
        <g key="ears">
          {P(`M${cx - 8} ${top + 4} C${cx - 4} ${top - 22} ${cx + 22} ${top - 26} ${cx + 30} ${top - 10} C${cx + 22} ${top - 6} ${cx + 18} ${top + 2} ${cx + 18} ${top + 8} Z`, accent, { stroke: accentDark })}
        </g>,
      );
      break;
  }

  // 뿔
  switch (look.horn) {
    case 'nub':
      front.push(<g key="horn">{P(`M${cx - 16} ${top + 6} L${cx - 12} ${top - 10} L${cx - 6} ${top + 4} Z`, accent, { stroke: accentDark })}{P(`M${cx + 16} ${top + 6} L${cx + 12} ${top - 10} L${cx + 6} ${top + 4} Z`, accent, { stroke: accentDark })}</g>);
      break;
    case 'unicorn':
      front.push(<g key="horn">{P(`M${cx - 7} ${top + 4} L${cx} ${top - 28} L${cx + 7} ${top + 4} Z`, accent, { stroke: accentDark })}<path d={`M${cx - 4} ${top - 6} L${cx + 4} ${top - 10} M${cx - 5} ${top - 0} L${cx + 5} ${top - 4}`} stroke={accentDark} strokeWidth="2" /></g>);
      break;
    case 'curl':
      front.push(
        <g key="horn">
          <path d={`M${cx - 22} ${top + 8} C${cx - 40} ${top - 4} ${cx - 36} ${top - 26} ${cx - 22} ${top - 22}`} fill="none" stroke={line} strokeWidth="10" strokeLinecap="round" />
          <path d={`M${cx - 22} ${top + 8} C${cx - 40} ${top - 4} ${cx - 36} ${top - 26} ${cx - 22} ${top - 22}`} fill="none" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
          <path d={`M${cx + 22} ${top + 8} C${cx + 40} ${top - 4} ${cx + 36} ${top - 26} ${cx + 22} ${top - 22}`} fill="none" stroke={line} strokeWidth="10" strokeLinecap="round" />
          <path d={`M${cx + 22} ${top + 8} C${cx + 40} ${top - 4} ${cx + 36} ${top - 26} ${cx + 22} ${top - 22}`} fill="none" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
        </g>,
      );
      break;
  }

  // 머리 장식
  const crestY = top + 2;
  switch (look.crest) {
    case 'sprout':
      front.push(
        <g key="crest" className={animate ? styles.sway : undefined} style={{ transformOrigin: `${cx}px ${crestY}px` }}>
          <path d={`M${cx} ${crestY + 2} L${cx} ${crestY - 14}`} stroke={line} strokeWidth="4" strokeLinecap="round" />
          {P(`M${cx} ${crestY - 12} C${cx - 8} ${crestY - 30} ${cx - 30} ${crestY - 30} ${cx - 32} ${crestY - 18} C${cx - 22} ${crestY - 8} ${cx - 8} ${crestY - 8} ${cx} ${crestY - 12} Z`, accent, { stroke: accentDark })}
          {P(`M${cx} ${crestY - 12} C${cx + 8} ${crestY - 30} ${cx + 30} ${crestY - 30} ${cx + 32} ${crestY - 18} C${cx + 22} ${crestY - 8} ${cx + 8} ${crestY - 8} ${cx} ${crestY - 12} Z`, accent, { stroke: accentDark })}
        </g>,
      );
      break;
    case 'leafCrown':
      front.push(
        <g key="crest">
          {[-30, -15, 0, 15, 30].map((dx, i) => (
            <g key={i}>{P(`M${cx + dx} ${crestY + 6} C${cx + dx - 10} ${crestY - 8} ${cx + dx - 4} ${crestY - 24} ${cx + dx} ${crestY - 28} C${cx + dx + 4} ${crestY - 24} ${cx + dx + 10} ${crestY - 8} ${cx + dx} ${crestY + 6} Z`, i % 2 ? accent : shade(accent, -0.15), { stroke: accentDark })}</g>
          ))}
        </g>,
      );
      break;
    case 'feather':
      front.push(<g key="crest">{P(`M${cx - 4} ${crestY + 4} C${cx - 18} ${crestY - 12} ${cx - 10} ${crestY - 26} ${cx - 2} ${crestY - 22} C${cx} ${crestY - 32} ${cx + 14} ${crestY - 30} ${cx + 10} ${crestY - 16} C${cx + 20} ${crestY - 18} ${cx + 18} ${crestY - 2} ${cx + 6} ${crestY + 4} Z`, accent, { stroke: accentDark })}</g>);
      break;
    case 'flame':
      front.push(
        <g key="crest" className={animate ? styles.flicker : undefined} style={{ transformOrigin: `${cx}px ${crestY}px` }}>
          {P(`M${cx - 14} ${crestY + 6} C${cx - 22} ${crestY - 10} ${cx - 12} ${crestY - 22} ${cx - 6} ${crestY - 30} C${cx - 4} ${crestY - 18} ${cx + 4} ${crestY - 22} ${cx + 4} ${crestY - 34} C${cx + 16} ${crestY - 22} ${cx + 22} ${crestY - 6} ${cx + 14} ${crestY + 6} Z`, accent, { stroke: accentDark })}
          <path d={`M${cx - 6} ${crestY + 4} C${cx - 8} ${crestY - 6} ${cx - 2} ${crestY - 12} ${cx + 2} ${crestY - 18} C${cx + 8} ${crestY - 8} ${cx + 10} ${crestY} ${cx + 6} ${crestY + 4} Z`} fill="#fff6c7" />
        </g>,
      );
      break;
    case 'drop':
      front.push(<g key="crest">{P(`M${cx} ${crestY - 30} C${cx + 10} ${crestY - 14} ${cx + 14} ${crestY - 6} ${cx + 10} ${crestY + 2} C${cx + 6} ${crestY + 8} ${cx - 6} ${crestY + 8} ${cx - 10} ${crestY + 2} C${cx - 14} ${crestY - 6} ${cx - 10} ${crestY - 14} ${cx} ${crestY - 30} Z`, accent, { stroke: accentDark })}<ellipse cx={cx - 4} cy={crestY - 6} rx="3" ry="5" fill="#fff" opacity="0.8" /></g>);
      break;
    case 'spikes':
      front.push(<g key="crest">{P(`M${cx - 30} ${crestY + 12} L${cx - 22} ${crestY - 12} L${cx - 10} ${crestY + 4} L${cx} ${crestY - 20} L${cx + 10} ${crestY + 4} L${cx + 22} ${crestY - 12} L${cx + 30} ${crestY + 12} Z`, accent, { stroke: accentDark })}</g>);
      break;
    case 'flower':
      front.push(
        <g key="crest" className={animate ? styles.sway : undefined} style={{ transformOrigin: `${cx}px ${crestY}px` }}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={cx} cy={crestY - 22} rx="7" ry="11" transform={`rotate(${a} ${cx} ${crestY - 12})`} fill={['#ff8fb8', '#ffd166', '#7be0ff', '#a0e57a', '#c9a6ff'][a / 72]} stroke={line} strokeWidth="2.5" />
          ))}
          <circle cx={cx} cy={crestY - 12} r="7" fill="#fff3b0" stroke={line} strokeWidth="2.5" />
        </g>,
      );
      break;
    case 'antenna':
      front.push(
        <g key="crest">
          <path d={`M${cx - 10} ${crestY + 4} C${cx - 14} ${crestY - 10} ${cx - 22} ${crestY - 18} ${cx - 26} ${crestY - 22} M${cx + 10} ${crestY + 4} C${cx + 14} ${crestY - 10} ${cx + 22} ${crestY - 18} ${cx + 26} ${crestY - 22}`} stroke={line} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx={cx - 27} cy={crestY - 24} r="6" fill={accent} stroke={line} strokeWidth="2.5" className={animate ? styles.blink : undefined} />
          <circle cx={cx + 27} cy={crestY - 24} r="6" fill={accent} stroke={line} strokeWidth="2.5" className={animate ? styles.blink : undefined} />
        </g>,
      );
      break;
    case 'star':
      front.push(<g key="crest" className={animate ? styles.twinkle : undefined} style={{ transformOrigin: `${cx}px ${crestY - 12}px` }}>{P(`M${cx} ${crestY - 32} L${cx + 6} ${crestY - 18} L${cx + 20} ${crestY - 16} L${cx + 9} ${crestY - 6} L${cx + 13} ${crestY + 8} L${cx} ${crestY} L${cx - 13} ${crestY + 8} L${cx - 9} ${crestY - 6} L${cx - 20} ${crestY - 16} L${cx - 6} ${crestY - 18} Z`, accent, { stroke: accentDark })}</g>);
      break;
    case 'gear':
      front.push(
        <g key="crest" className={animate ? styles.spin : undefined} style={{ transformOrigin: `${cx}px ${crestY - 10}px` }}>
          {[0, 45, 90, 135].map((a) => (
            <rect key={a} x={cx - 4} y={crestY - 26} width="8" height="32" rx="2" transform={`rotate(${a} ${cx} ${crestY - 10})`} fill={accent} stroke={line} strokeWidth="2" />
          ))}
          <circle cx={cx} cy={crestY - 10} r="11" fill={accent} stroke={line} strokeWidth="2.5" />
          <circle cx={cx} cy={crestY - 10} r="4" fill={line} />
        </g>,
      );
      break;
  }

  // 팔·발
  const limbs: ReactNode[] = [];
  f.feet?.forEach(([x, y], i) => limbs.push(<ellipse key={`f${i}`} cx={x} cy={y - 3} rx="13" ry="7.5" fill={dark} stroke={line} strokeWidth={sw} />));
  const armsBack: ReactNode[] = [];
  if (!look.wings || look.wings === 'none') {
    f.arms?.forEach(([x, y], i) =>
      armsBack.push(<ellipse key={`a${i}`} cx={x} cy={y} rx="9" ry="13" transform={`rotate(${i ? -25 : 25} ${x} ${y})`} fill={fill} stroke={line} strokeWidth={sw} />),
    );
  }

  // 무늬 (몸 안에만 보이게 clip)
  const pattern: ReactNode[] = [];
  const pc = silhouette ? 'transparent' : dark;
  switch (look.pattern) {
    case 'spots':
      [[52, 104, 6], [108, 100, 5], [100, 132, 4], [58, 134, 4.5], [112, 120, 3.5]].forEach(([x, y, r], i) => pattern.push(<circle key={i} cx={x} cy={y} r={r} fill={pc} opacity="0.5" />));
      break;
    case 'stripes':
      [[top + 8], [top + 18]].forEach(([y], i) => pattern.push(<path key={i} d={`M${cx - 8} ${y} L${cx} ${y + 8} L${cx + 8} ${y}`} stroke={pc} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />));
      pattern.push(<path key="s3" d="M36 108 L46 112 M36 120 L46 122 M124 108 L114 112 M124 120 L114 122" stroke={pc} strokeWidth="4" strokeLinecap="round" opacity="0.5" />);
      break;
    case 'sparkle':
      [[50, 108], [110, 104], [104, 136]].forEach(([x, y], i) =>
        pattern.push(<path key={i} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`} fill={silhouette ? 'transparent' : '#fff'} opacity="0.85" />),
      );
      break;
    case 'bolts':
      [[48, 104], [112, 104]].forEach(([x, y], i) => pattern.push(<path key={i} d={`M${x} ${y - 8} L${x - 5} ${y + 1} L${x} ${y + 1} L${x - 3} ${y + 9}`} stroke={pc} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />));
      break;
    case 'cracks':
      pattern.push(<path key="c" d="M48 96 L56 104 L52 112 M112 92 L104 100 L110 108 M96 136 L102 130" stroke={pc} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />);
      break;
  }

  // 눈
  const eyeR = look.body === 'fish' ? 7 : 8.5;
  const eye = (x: number, right: boolean) => {
    const y = face.y;
    switch (look.eyes) {
      case 'sleepy':
        return (
          <g key={x}>
            <path d={`M${x - eyeR} ${y} Q${x} ${y + eyeR * 0.9} ${x + eyeR} ${y}`} stroke={INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d={`M${x - eyeR + 1} ${y - 1} L${x - eyeR - 3} ${y - 4}`} stroke={INK} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 'happy':
        return <path key={x} d={`M${x - eyeR} ${y + 2} Q${x} ${y - eyeR - 2} ${x + eyeR} ${y + 2}`} stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />;
      case 'screen':
        return (
          <g key={x}>
            <rect x={x - eyeR} y={y - eyeR + 1} width={eyeR * 2} height={eyeR * 1.7} rx="3" fill="#1d2b3a" stroke={line} strokeWidth="2.5" />
            <rect x={x - eyeR + 4} y={y - eyeR + 5} width={eyeR - 2} height={eyeR - 2} rx="1.5" fill="#7cf5d6" className={animate ? styles.blink : undefined} />
          </g>
        );
      default: {
        const sharp = look.eyes === 'sharp';
        return (
          <g key={x}>
            <ellipse cx={x} cy={y} rx={eyeR} ry={eyeR * 1.15} fill="#fff" stroke={INK} strokeWidth="2.4" />
            <ellipse cx={x + (right ? -1 : 1)} cy={y + 1.5} rx={eyeR * 0.68} ry={eyeR * 0.85} fill={`url(#i${uid})`} />
            <circle cx={x + (right ? -3 : -1)} cy={y - 2.5} r={eyeR * 0.32} fill="#fff" />
            <circle cx={x + (right ? 1.5 : 3)} cy={y + 3.5} r={eyeR * 0.15} fill="#fff" />
            {sharp && <path d={`M${x - eyeR - 2} ${y - eyeR - (right ? 1 : 5)} L${x + eyeR + 2} ${y - eyeR - (right ? 5 : 1)}`} stroke={INK} strokeWidth="3.6" strokeLinecap="round" />}
          </g>
        );
      }
    }
  };

  const my = face.y + (look.body === 'fish' ? 13 : 15);
  const mouth = (() => {
    switch (look.mouth) {
      case 'cat':
        return <path d={`M${cx - 8} ${my - 2} Q${cx - 4} ${my + 3} ${cx} ${my - 1} Q${cx + 4} ${my + 3} ${cx + 8} ${my - 2}`} stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
      case 'fang':
        return (
          <g>
            <path d={`M${cx - 9} ${my - 3} Q${cx} ${my + 8} ${cx + 9} ${my - 3} Z`} fill="#7a2240" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d={`M${cx - 6} ${my - 2} L${cx - 3.5} ${my + 3} L${cx - 1} ${my - 1.5} Z M${cx + 6} ${my - 2} L${cx + 3.5} ${my + 3} L${cx + 1} ${my - 1.5} Z`} fill="#fff" />
          </g>
        );
      case 'o':
        return <ellipse cx={cx} cy={my} rx="4.5" ry="5.5" fill="#7a2240" stroke={INK} strokeWidth="2.2" />;
      case 'grin':
        return (
          <g>
            <path d={`M${cx - 12} ${my - 3} Q${cx} ${my + 10} ${cx + 12} ${my - 3} Z`} fill="#7a2240" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d={`M${cx - 6} ${my + 3} Q${cx} ${my + 7} ${cx + 6} ${my + 3} Q${cx} ${my + 1} ${cx - 6} ${my + 3} Z`} fill="#ff8fa3" />
          </g>
        );
      case 'beak':
        return <path d={`M${cx - 7} ${my - 4} L${cx + 7} ${my - 4} L${cx} ${my + 5} Z`} fill="#ffb703" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />;
      default:
        return (
          <g>
            <path d={`M${cx - 8} ${my - 2} Q${cx} ${my + 7} ${cx + 8} ${my - 2}`} fill="#7a2240" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d={`M${cx - 4} ${my + 1.5} Q${cx} ${my + 4.5} ${cx + 4} ${my + 1.5}`} fill="#ff8fa3" />
          </g>
        );
    }
  })();

  const letter = s.letter;
  const fs = letter.length >= 3 ? 15 : letter.length === 2 ? 19 : 25;
  const { belly: bl } = f;

  return (
    <svg viewBox="0 0 160 160" width={size} height={size} className={[styles.art, className].filter(Boolean).join(' ')} aria-hidden>
      <defs>
        <radialGradient id={`b${uid}`} cx="38%" cy="30%" r="78%">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={base} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <radialGradient id={`i${uid}`} cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor={IRIS[s.elem]} />
          <stop offset="1" stopColor={INK} />
        </radialGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="0.45" stopColor={light} stopOpacity="0.9" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`c${uid}`}>
          <path d={f.path} />
        </clipPath>
      </defs>
      <ellipse cx="80" cy="150" rx="40" ry="6" fill="#000" opacity="0.14" />
      <g className={animate ? styles.breathe : undefined}>
        {s.stage === 2 && !silhouette && <circle cx="80" cy="98" r="70" fill={`url(#g${uid})`} opacity="0.55" className={animate ? styles.aura : undefined} />}
        {back}
        {armsBack}
        <path d={f.path} fill={fill} stroke={line} strokeWidth={sw} strokeLinejoin="round" />
        {look.body === 'bot' && !silhouette && (
          <>
            <rect x="44" y="66" width="72" height="44" rx="12" fill={shade(base, 0.6)} stroke={line} strokeWidth="2.5" />
            <circle cx="40" cy="64" r="3" fill={line} />
            <circle cx="120" cy="64" r="3" fill={line} />
          </>
        )}
        <g clipPath={`url(#c${uid})`}>
          {pattern}
          {!silhouette && <ellipse cx="62" cy={top + 22} rx="18" ry="10" fill="#fff" opacity="0.35" transform={`rotate(-20 62 ${top + 22})`} />}
        </g>
        {/* 배의 글자 무늬 */}
        <ellipse cx={bl.x} cy={bl.y} rx={bl.rx} ry={bl.ry} fill={belly} />
        {!silhouette && (
          <text x={bl.x} y={bl.y + fs * 0.36} textAnchor="middle" fontSize={fs} fontFamily="Jua, sans-serif" fill={line} stroke={belly} strokeWidth="0.5" paintOrder="stroke">
            {letter}
          </text>
        )}
        {limbs}
        {front}
        {!silhouette && (
          <g className={animate ? styles.blinkEyes : undefined} style={{ transformOrigin: `${cx}px ${face.y}px` }}>
            {eye(cx - face.gap, false)}
            {eye(cx + face.gap, true)}
          </g>
        )}
        {!silhouette && (
          <>
            {look.eyes !== 'screen' && (
              <>
                <ellipse cx={cx - face.gap - 6} cy={face.y + 13} rx="6" ry="3.5" fill="#ff7fa8" opacity="0.45" />
                <ellipse cx={cx + face.gap + 6} cy={face.y + 13} rx="6" ry="3.5" fill="#ff7fa8" opacity="0.45" />
              </>
            )}
            {mouth}
          </>
        )}
        {s.stage === 2 && (
          <g>
            {P(`M${cx - 18} ${top - 2} L${cx - 22} ${top - 22} L${cx - 10} ${top - 12} L${cx} ${top - 28} L${cx + 10} ${top - 12} L${cx + 22} ${top - 22} L${cx + 18} ${top - 2} Z`, silhouette ? base : '#ffd166', { stroke: silhouette ? line : '#a86b00' })}
            {!silhouette && <circle cx={cx} cy={top - 10} r="3.5" fill="#ef476f" stroke="#a86b00" strokeWidth="1.5" />}
          </g>
        )}
      </g>
    </svg>
  );
}
