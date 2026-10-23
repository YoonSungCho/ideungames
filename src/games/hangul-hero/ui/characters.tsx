import { useId } from 'react';
import styles from './characters.module.css';

const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, '');

export type HeroMood = 'idle' | 'happy' | 'attack';

/** 한글 용사 (아이) — 머리띠, 망토, 커다란 한글 붓 */
export function Hero({ mood = 'idle', size = 120, className }: { mood?: HeroMood; size?: number; className?: string }) {
  const u = useUid();
  const id = (n: string) => `${n}${u}`;
  const attack = mood === 'attack';
  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} className={[styles.char, styles[`hero_${mood}`], className].filter(Boolean).join(' ')} role="img" aria-label="한글 용사">
      <defs>
        <radialGradient id={id('skin')} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffe3cf" />
          <stop offset="1" stopColor="#f6c3a2" />
        </radialGradient>
        <linearGradient id={id('cape')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="1" stopColor="#d63c5e" />
        </linearGradient>
        <linearGradient id={id('tunic')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b8cff" />
          <stop offset="1" stopColor="#3c5fd6" />
        </linearGradient>
        <radialGradient id={id('ink')} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff7c2" />
          <stop offset="0.5" stopColor="#ffd166" />
          <stop offset="1" stopColor="#ffd166" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="212" rx="44" ry="6" fill="#2f2a55" opacity="0.12" />
      {/* 망토 */}
      <path className={styles.cape} d="M62 118 Q40 170 46 206 L154 206 Q160 170 138 118 Z" fill={`url(#${id('cape')})`} />
      {/* 몸 */}
      <path d="M68 124 Q100 112 132 124 L140 196 Q100 206 60 196 Z" fill={`url(#${id('tunic')})`} />
      <rect x="64" y="164" width="72" height="12" rx="6" fill="#ffd166" />
      <circle cx="100" cy="170" r="11" fill="#fff" stroke="#ffd166" strokeWidth="3" />
      <text x="100" y="175" textAnchor="middle" fontSize="13" fontFamily="Jua, sans-serif" fill="#3c5fd6">한</text>
      {/* 다리 */}
      <rect x="76" y="196" width="18" height="14" rx="6" fill="#2f2a55" />
      <rect x="106" y="196" width="18" height="14" rx="6" fill="#2f2a55" />
      {/* 왼팔 */}
      <path d="M70 130 Q52 150 58 168" stroke={`url(#${id('tunic')})`} strokeWidth="15" fill="none" strokeLinecap="round" />
      <circle cx="58" cy="170" r="8" fill={`url(#${id('skin')})`} />
      {/* 붓 (오른손) */}
      <g className={styles.brush} transform={attack ? 'rotate(-55 136 150)' : 'rotate(0 136 150)'}>
        <path d="M130 132 Q150 140 144 160" stroke={`url(#${id('tunic')})`} strokeWidth="15" fill="none" strokeLinecap="round" />
        <rect x="142" y="70" width="8" height="96" rx="4" fill="#a0522d" transform="rotate(18 146 118)" />
        <path d="M156 64 q10 -22 0 -40 q-12 18 -12 34 z" fill="#2f2a55" transform="rotate(18 150 60)" />
        <circle cx="162" cy="40" r={attack ? 26 : 16} fill={`url(#${id('ink')})`} className={styles.glow} />
        <circle cx="146" cy="160" r="8" fill={`url(#${id('skin')})`} />
      </g>
      {/* 머리 */}
      <circle cx="100" cy="82" r="48" fill={`url(#${id('skin')})`} />
      <path d="M52 80 Q50 32 100 30 Q150 32 148 80 Q140 56 122 54 Q112 66 96 58 Q84 68 70 60 Q58 66 52 80 Z" fill="#3a2a22" />
      {/* 머리띠 */}
      <path d="M54 66 Q100 50 146 66 L146 78 Q100 62 54 78 Z" fill="#ff6b6b" />
      <path className={styles.ribbon} d="M146 70 q18 -4 26 6 q-14 0 -20 8 z M146 72 q16 6 18 20 q-10 -8 -20 -8 z" fill="#ff6b6b" />
      <circle cx="100" cy="64" r="7" fill="#ffd166" stroke="#fff" strokeWidth="2" />
      {/* 얼굴 */}
      {mood === 'happy' || attack ? (
        <g stroke="#2f2a55" strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M76 92 q8 -9 16 0" />
          <path d="M108 92 q8 -9 16 0" />
        </g>
      ) : (
        <g fill="#2f2a55" className={styles.blink}>
          <ellipse cx="84" cy="92" rx="6" ry="8" />
          <ellipse cx="116" cy="92" rx="6" ry="8" />
          <circle cx="86" cy="89" r="2.2" fill="#fff" />
          <circle cx="118" cy="89" r="2.2" fill="#fff" />
        </g>
      )}
      <ellipse cx="72" cy="106" rx="8" ry="5" fill="#ff8fab" opacity="0.6" />
      <ellipse cx="128" cy="106" rx="8" ry="5" fill="#ff8fab" opacity="0.6" />
      {attack ? (
        <path d="M88 108 q12 14 24 0 z" fill="#d63c5e" stroke="#2f2a55" strokeWidth="3" strokeLinejoin="round" />
      ) : (
        <path d="M89 108 q11 10 22 0" stroke="#2f2a55" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

export type ImpMood = 'normal' | 'laugh' | 'hit' | 'sad';

interface ImpLook {
  body: [string, string];
  accent: string;
  label: string;
  /** 머리 장식: swirl(소용돌이 뿔) / spike(뾰족 머리) */
  head: 'swirl' | 'spike';
}

const LOOKS: Record<'dwijuk' | 'bakjuk', ImpLook> = {
  dwijuk: { body: ['#b18cff', '#7448e0'], accent: '#ffd166', label: '마왕 뒤죽', head: 'swirl' },
  bakjuk: { body: ['#ffb36b', '#f0703a'], accent: '#7c6cf2', label: '마왕 박죽', head: 'spike' },
};

/** 장난꾸러기 쌍둥이 마왕 — 무섭지 않고 얄밉게 귀여운 꼬마 도깨비 */
export function Imp({ who, mood = 'normal', size = 120, className }: { who: 'dwijuk' | 'bakjuk'; mood?: ImpMood; size?: number; className?: string }) {
  const u = useUid();
  const L = LOOKS[who];
  const eye = '#2f2a55';
  const gid = `${who}${u}`;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={[styles.char, styles[`imp_${mood}`], className].filter(Boolean).join(' ')} role="img" aria-label={L.label}>
      <defs>
        <radialGradient id={gid} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor={L.body[0]} />
          <stop offset="1" stopColor={L.body[1]} />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="192" rx="46" ry="6" fill="#2f2a55" opacity="0.14" className={styles.impShadow} />
      <g className={styles.impFloat}>
        {/* 박쥐 날개 */}
        <path className={styles.wingL} d="M52 104 Q18 80 10 104 Q24 104 22 118 Q34 110 38 124 Q44 112 56 118 Z" fill={L.body[1]} />
        <path className={styles.wingR} d="M148 104 Q182 80 190 104 Q176 104 178 118 Q166 110 162 124 Q156 112 144 118 Z" fill={L.body[1]} />
        {/* 머리 장식 */}
        {L.head === 'swirl' ? (
          <g fill="none" stroke={L.accent} strokeWidth="9" strokeLinecap="round">
            <path d="M70 52 q-24 -10 -20 -32 q14 -8 20 6 q4 10 -6 12" />
            <path d="M130 52 q24 -10 20 -32 q-14 -8 -20 6 q-4 10 6 12" />
          </g>
        ) : (
          <path d="M56 62 L64 22 L80 50 L92 12 L104 46 L118 14 L126 50 L142 24 L146 64 Z" fill={L.accent} stroke={L.body[1]} strokeWidth="3" strokeLinejoin="round" />
        )}
        {/* 몸 */}
        <path d="M100 42 C150 42 166 86 160 128 C154 168 128 184 100 184 C72 184 46 168 40 128 C34 86 50 42 100 42 Z" fill={`url(#${gid})`} />
        {/* 배 무늬: 뒤죽=소용돌이, 박죽=번개 */}
        {L.head === 'swirl' ? (
          <path d="M100 150 m-14 0 a14 14 0 1 1 14 14 a8 8 0 1 1 -8 -8 a3 3 0 1 1 3 3" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <path d="M104 134 L92 154 L102 154 L96 172 L112 148 L102 148 L108 134 Z" fill="#fff" fillOpacity="0.6" />
        )}
        {/* 팔 */}
        <path className={styles.armL} d="M46 128 q-16 6 -16 20" stroke={L.body[1]} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path className={styles.armR} d="M154 128 q16 6 16 20" stroke={L.body[1]} strokeWidth="12" fill="none" strokeLinecap="round" />
        {/* 얼굴 */}
        {mood === 'hit' ? (
          <g stroke={eye} strokeWidth="6" strokeLinecap="round">
            <path d="M68 88 l16 14 M84 88 l-16 14" />
            <path d="M116 88 l16 14 M132 88 l-16 14" />
          </g>
        ) : mood === 'laugh' ? (
          <g stroke={eye} strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M66 98 q10 -12 20 0" />
            <path d="M114 98 q10 -12 20 0" />
          </g>
        ) : (
          <g>
            {/* 얄미운 반쯤 감은 눈 */}
            <ellipse cx="78" cy="96" rx="13" ry={mood === 'sad' ? 11 : 12} fill="#fff" />
            <ellipse cx="122" cy="96" rx="13" ry={mood === 'sad' ? 11 : 12} fill="#fff" />
            <circle cx={mood === 'sad' ? 78 : 81} cy={mood === 'sad' ? 100 : 98} r="6" fill={eye} />
            <circle cx={mood === 'sad' ? 122 : 125} cy={mood === 'sad' ? 100 : 98} r="6" fill={eye} />
            {mood === 'sad' ? (
              <>
                {/* 슬픈 눈썹: 안쪽이 올라감 */}
                <path d="M64 86 l26 -8 M136 86 l-26 -8" stroke={eye} strokeWidth="5" strokeLinecap="round" />
                <path className={styles.tear} d="M66 112 q-4 10 0 14 q4 -4 0 -14 z" fill="#6ee7f9" />
              </>
            ) : (
              // 얄미운 눈썹: 안쪽이 내려감
              <path d="M64 78 l26 8 M136 78 l-26 8" stroke={eye} strokeWidth="5" strokeLinecap="round" />
            )}
          </g>
        )}
        {/* 입 */}
        {mood === 'sad' ? (
          <path d="M84 136 q16 -12 32 0" stroke={eye} strokeWidth="5" fill="none" strokeLinecap="round" />
        ) : mood === 'hit' ? (
          <ellipse cx="100" cy="134" rx="10" ry="8" fill={eye} />
        ) : (
          <g>
            <path d={mood === 'laugh' ? 'M74 120 Q100 156 126 120 Z' : 'M78 122 Q100 146 122 122 Z'} fill={eye} />
            <path d="M88 124 l5 9 l5 -9 z" fill="#fff" />
            <path d="M106 124 l5 9 l5 -9 z" fill="#fff" />
          </g>
        )}
        <ellipse cx="60" cy="118" rx="8" ry="5" fill="#ff8fab" opacity="0.5" />
        <ellipse cx="140" cy="118" rx="8" ry="5" fill="#ff8fab" opacity="0.5" />
      </g>
    </svg>
  );
}
