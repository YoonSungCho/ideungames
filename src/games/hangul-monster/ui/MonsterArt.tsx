import { useId } from 'react';
import { species, type SpeciesId } from '../data/species';

const INK = '#3b3567';

/**
 * 몬스터 그림 (SVG, 파일 없음). 모양(shape)마다 몸, 배에는 몬스터의 글자.
 * 진화한 모습(stage 2)은 왕관이 생긴다. silhouette이면 도감에서 아직 못 본 모습.
 */
export function MonsterArt({ sp, size = 120, silhouette = false, className }: { sp: SpeciesId; size?: number; silhouette?: boolean; className?: string }) {
  const s = species(sp);
  const gid = useId();
  const fill = silhouette ? '#cfc9e6' : s.color;
  const belly = silhouette ? '#cfc9e6' : '#fffaf0';
  const stroke = silhouette ? '#b5aed6' : INK;
  const angry = s.elem === 'chaos';
  const letterSize = s.letter.length >= 3 ? 15 : s.letter.length === 2 ? 19 : 26;

  const body = (() => {
    switch (s.shape) {
      case 'beast':
        return (
          <>
            <path d="M28 44 L36 14 L52 36 Z M92 44 L84 14 L68 36 Z" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
            <path d="M94 80 Q116 74 110 52" fill="none" stroke={stroke} strokeWidth="10" strokeLinecap="round" />
            <path d="M94 80 Q116 74 110 52" fill="none" stroke={fill} strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="60" cy="68" rx="38" ry="36" fill={fill} stroke={stroke} strokeWidth="4" />
          </>
        );
      case 'bird':
        return (
          <>
            <ellipse cx="22" cy="66" rx="18" ry="10" transform="rotate(-30 22 66)" fill={fill} stroke={stroke} strokeWidth="4" />
            <ellipse cx="98" cy="66" rx="18" ry="10" transform="rotate(30 98 66)" fill={fill} stroke={stroke} strokeWidth="4" />
            <path d="M52 30 Q60 10 68 30" fill={fill} stroke={stroke} strokeWidth="4" />
            <ellipse cx="60" cy="68" rx="34" ry="36" fill={fill} stroke={stroke} strokeWidth="4" />
            <path d="M54 60 L60 70 L66 60 Z" fill="#ffb703" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          </>
        );
      case 'fish':
        return (
          <>
            <path d="M92 66 L116 48 L114 88 Z" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
            <path d="M46 36 Q62 14 76 36" fill={fill} stroke={stroke} strokeWidth="4" />
            <ellipse cx="56" cy="68" rx="42" ry="32" fill={fill} stroke={stroke} strokeWidth="4" />
          </>
        );
      case 'rock':
        return <path d="M20 96 L16 60 L34 30 L62 22 L90 32 L106 62 L100 96 Z" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />;
      case 'sprout':
        return (
          <>
            <path d="M60 34 L60 18" stroke={stroke} strokeWidth="4" />
            <path d="M60 20 Q42 4 30 16 Q44 28 60 20 Z M60 20 Q78 4 90 16 Q76 28 60 20 Z" fill={silhouette ? fill : '#8bd46b'} stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" />
            <ellipse cx="60" cy="70" rx="38" ry="34" fill={fill} stroke={stroke} strokeWidth="4" />
          </>
        );
      case 'ghost':
        return <path d="M22 98 L22 62 Q22 26 60 26 Q98 26 98 62 L98 98 L86 88 L74 98 L60 88 L46 98 L34 88 Z" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round" />;
      default:
        return (
          <>
            <ellipse cx="42" cy="100" rx="10" ry="6" fill={fill} stroke={stroke} strokeWidth="3.5" />
            <ellipse cx="78" cy="100" rx="10" ry="6" fill={fill} stroke={stroke} strokeWidth="3.5" />
            <ellipse cx="60" cy="68" rx="40" ry="34" fill={fill} stroke={stroke} strokeWidth="4" />
          </>
        );
    }
  })();

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden>
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="34" ry="6" fill="#000" opacity="0.12" />
      {body}
      {!silhouette && <ellipse cx="58" cy="58" rx="34" ry="30" fill={`url(#${gid})`} />}
      {s.stage === 2 && (
        <path d="M42 30 L46 14 L54 24 L60 10 L66 24 L74 14 L78 30 Z" fill={silhouette ? fill : '#ffd166'} stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      )}
      {/* 얼굴 */}
      <g>
        <ellipse cx="46" cy="54" rx="6.5" ry="7.5" fill={silhouette ? '#b5aed6' : '#fff'} stroke={stroke} strokeWidth="2.5" />
        <ellipse cx="74" cy="54" rx="6.5" ry="7.5" fill={silhouette ? '#b5aed6' : '#fff'} stroke={stroke} strokeWidth="2.5" />
        {!silhouette && (
          <>
            <circle cx="47" cy="56" r="3.5" fill={INK} />
            <circle cx="75" cy="56" r="3.5" fill={INK} />
            <circle cx="48" cy="54.5" r="1.2" fill="#fff" />
            <circle cx="76" cy="54.5" r="1.2" fill="#fff" />
            {angry ? (
              <path d="M38 42 L52 47 M82 42 L68 47" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
            ) : (
              <>
                <ellipse cx="36" cy="66" rx="5" ry="3" fill="#ff8fb1" opacity="0.7" />
                <ellipse cx="84" cy="66" rx="5" ry="3" fill="#ff8fb1" opacity="0.7" />
              </>
            )}
            <path d={angry ? 'M53 68 Q60 63 67 68' : 'M53 65 Q60 71 67 65'} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </g>
      {/* 배의 글자 */}
      <ellipse cx="60" cy="88" rx={letterSize > 20 ? 17 : 22} ry="13" fill={belly} stroke={stroke} strokeWidth="2.5" />
      {!silhouette && (
        <text x="60" y={88 + letterSize * 0.36} textAnchor="middle" fontSize={letterSize} fontFamily="Jua, sans-serif" fill={INK}>
          {s.letter}
        </text>
      )}
    </svg>
  );
}
