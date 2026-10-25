import type { GameMap } from '../data/world';

type Theme = GameMap['theme'];

/** 배틀 배경: 지역마다 하늘·먼 풍경·땅 (SVG 한 장, 화면을 꽉 채움) */
const SKY: Record<Theme, [string, string]> = {
  town: ['#8fd3ff', '#e6f6ff'], forest: ['#7cc4ef', '#dff3ff'], beach: ['#62c1ff', '#e7f8ff'], cave: ['#2a2230', '#4a3b45'],
  flower: ['#ffc6e0', '#fff0f7'], mountain: ['#8ab8e8', '#eef6ff'], tower: ['#5d6b85', '#a9b7cc'], castle: ['#1d1638', '#4b3a7a'],
};
const GROUND: Record<Theme, [string, string]> = {
  town: ['#9ddc7c', '#7fc65c'], forest: ['#86c95e', '#6db04c'], beach: ['#f6e2ad', '#e9cf8c'], cave: ['#75625a', '#5e4c45'],
  flower: ['#a8e086', '#8fcf6c'], mountain: ['#b4cf7a', '#9cb965'], tower: ['#a4b0c0', '#8794a7'], castle: ['#5b4a8a', '#463870'],
};

export function BattleBackdrop({ theme }: { theme: Theme }) {
  const [s1, s2] = SKY[theme];
  const [g1, g2] = GROUND[theme];
  const far = (() => {
    switch (theme) {
      case 'beach':
        return <><rect x="0" y="230" width="800" height="40" fill="#3aa6ef" /><path d="M0 236 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfe6ff" strokeWidth="4" fill="none" /></>;
      case 'cave':
        return <><path d="M0 0 H800 V60 L760 110 L720 60 L660 130 L610 50 L540 100 L470 40 L400 120 L340 50 L270 110 L200 40 L140 120 L80 50 L0 100 Z" fill="#1a141f" /><path d="M120 200 l8 -20 l8 20 Z M600 190 l10 -26 l10 26 Z" fill="#7be0ff" opacity="0.8" /></>;
      case 'castle':
        return <><path d="M80 270 V150 h30 v-20 h20 v20 h30 v-20 h20 v20 h30 V270 Z M560 270 V130 h30 v-20 h20 v20 h30 v-20 h20 v20 h30 V270 Z" fill="#2d2347" /><circle cx="660" cy="70" r="30" fill="#fff6c7" opacity="0.8" /></>;
      case 'tower':
        return <><path d="M60 270 V120 h70 V270 Z M200 270 V80 h60 V270 Z M560 270 V100 h80 V270 Z M690 270 V140 h60 V270 Z" fill="#46526a" /><g fill="#ffd166" opacity="0.7"><rect x="75" y="140" width="10" height="10" /><rect x="105" y="170" width="10" height="10" /><rect x="215" y="110" width="10" height="10" /><rect x="580" y="130" width="10" height="10" /><rect x="610" y="170" width="10" height="10" /></g></>;
      case 'mountain':
        return <><path d="M0 270 L140 90 L260 270 Z M200 270 L380 60 L560 270 Z M480 270 L650 100 L800 270 Z" fill="#9aa9c8" /><path d="M140 90 L110 130 L140 120 L170 130 Z M380 60 L340 110 L380 98 L420 110 Z M650 100 L620 136 L650 126 L680 136 Z" fill="#fff" /></>;
      case 'flower':
        return <><ellipse cx="200" cy="280" rx="260" ry="70" fill="#b9e79a" /><ellipse cx="620" cy="285" rx="280" ry="70" fill="#a8de88" /><g>{[80, 160, 300, 470, 560, 700].map((x, i) => <circle key={x} cx={x} cy={250 + (i % 2) * 10} r="7" fill={['#ff8fb8', '#ffd166', '#fff'][i % 3]} />)}</g></>;
      default:
        return <><ellipse cx="180" cy="285" rx="260" ry="80" fill={theme === 'forest' ? '#5aa84e' : '#a9dd8a'} /><ellipse cx="640" cy="290" rx="300" ry="80" fill={theme === 'forest' ? '#4c9a44' : '#9bd47b'} />{theme === 'forest' && [60, 130, 560, 640, 730].map((x) => <path key={x} d={`M${x} 250 l22 -70 l22 70 Z`} fill="#2f7d44" />)}</>;
    }
  })();
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
      <defs>
        <linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s1} /><stop offset="1" stopColor={s2} /></linearGradient>
        <linearGradient id="bground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={g1} /><stop offset="1" stopColor={g2} /></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bsky)" />
      {(theme === 'town' || theme === 'forest' || theme === 'beach' || theme === 'mountain' || theme === 'flower') && (
        <g fill="#fff" opacity="0.85">
          <ellipse cx="140" cy="70" rx="46" ry="16" /><ellipse cx="170" cy="60" rx="30" ry="16" />
          <ellipse cx="600" cy="110" rx="56" ry="18" /><ellipse cx="630" cy="98" rx="34" ry="16" />
        </g>
      )}
      {far}
      <rect y="270" width="800" height="330" fill="url(#bground)" />
    </svg>
  );
}
