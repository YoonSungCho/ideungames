import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Robot, type RobotMood } from '@/shared/ui/Robot';
import type { Drop, GameEvent } from '../engine/game';
import type { Face } from '../engine/questions';
import { onGameEvents, useNumberRain } from '../store';
import styles from './NumberRain.module.css';

/** 땅(풀밭) 높이 */
const groundOf = (h: number) => Math.round(Math.min(96, Math.max(58, h * 0.13)));

function FaceView({ face }: { face: Face }) {
  if (face.t === 'count') {
    return (
      <span className={styles.count} style={{ gridTemplateColumns: `repeat(${Math.min(3, face.n)}, 1em)` }}>
        {Array.from({ length: face.n }, (_, i) => <span key={i}>{face.emoji}</span>)}
      </span>
    );
  }
  if (face.t === 'lines') {
    return (
      <span className={styles.lines}>
        <span>{face.lines[0]}</span>
        <span>{face.lines[1]}</span>
      </span>
    );
  }
  return <span className={face.text.length >= 4 ? styles.longText : undefined}>{face.text}</span>;
}

const faceLabel = (f: Face) => (f.t === 'count' ? `${f.emoji} ${f.n}개` : f.t === 'lines' ? f.lines.join(', ') : f.text);
const KIND_LABEL = { normal: '', bomb: '폭탄 ', ice: '얼음 ', heart: '하트 ' } as const;

function DropView({ d, x, y }: { d: Drop; x: number; y: number }) {
  return (
    <div
      className={[styles.drop, styles[`k_${d.kind}`], d.y > 0.78 && styles.danger].filter(Boolean).join(' ')}
      style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -100%)` }}
      role="img"
      aria-label={`${KIND_LABEL[d.kind]}물방울 ${faceLabel(d.q.face)}`}
      data-answer={d.q.answer}
      data-kind={d.kind}
    >
      <FaceView face={d.q.face} />
    </div>
  );
}

type Fx =
  | { id: number; kind: 'beam'; x: number; y: number; bomb: boolean }
  | { id: number; kind: 'burst'; x: number; y: number; big: boolean }
  | { id: number; kind: 'points'; x: number; y: number; text: string }
  | { id: number; kind: 'splash'; x: number };

const BANNER: Partial<Record<GameEvent['type'], string>> = {
  ice: '❄️ 꽁꽁! 천천히 내려와요',
  heart: '💖 목숨 하나 더!',
  fever: '🌈 피버 타임! 점수 2배',
};

const FX_MS = { beam: 320, burst: 650, points: 900, splash: 700 };
const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { '--dx': `${Math.cos(a) * 46}px`, '--dy': `${Math.sin(a) * 46}px` } as CSSProperties;
});

let fxId = 0;

/** 하늘(물방울이 떨어지는 곳) + 땅의 띠봇 + 터짐·번쩍임 효과 */
export function Field() {
  const game = useNumberRain((s) => s.game)!;
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [fx, setFx] = useState<Fx[]>([]);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [flash, setFlash] = useState(0);
  const [shake, setShake] = useState(0);
  const [hurt, setHurt] = useState(0);
  const [mood, setMood] = useState<RobotMood>('idle');
  const [wrong, setWrong] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const add = (f: Fx) => {
      setFx((xs) => [...xs, f]);
      later(() => setFx((xs) => xs.filter((x) => x.id !== f.id)), FX_MS[f.kind]);
    };
    const say = (text: string) => {
      const id = ++fxId;
      setBanner({ id, text });
      later(() => setBanner((b) => (b?.id === id ? null : b)), 1600);
    };
    const feel = (m: RobotMood) => {
      setMood(m);
      later(() => setMood('idle'), 700);
    };

    const off = onGameEvents((events, g) => {
      for (const e of events) {
        switch (e.type) {
          case 'pop':
            add({ id: ++fxId, kind: 'beam', x: e.x, y: e.y, bomb: e.kind === 'bomb' });
            add({ id: ++fxId, kind: 'burst', x: e.x, y: e.y, big: e.kind === 'bomb' });
            add({ id: ++fxId, kind: 'points', x: e.x, y: e.y, text: `+${e.points}` });
            feel('happy');
            if (e.kind === 'normal' && g.combo >= 5 && g.combo % 5 === 0 && g.combo % 10 !== 0) say(`🔥 ${g.combo}연속!`);
            break;
          case 'burst':
            add({ id: ++fxId, kind: 'burst', x: e.x, y: e.y, big: true });
            break;
          case 'bomb':
            setFlash((n) => n + 1);
            setShake((n) => n + 1);
            say(e.count ? `💥 펑! ${e.count}개 한꺼번에!` : '💥 펑!');
            feel('cheer');
            break;
          case 'level':
            say(`🚀 ${e.level}단계! 조금 더 빨라져요`);
            feel('cheer');
            break;
          case 'land':
            if (e.hurt) {
              add({ id: ++fxId, kind: 'splash', x: e.x });
              setHurt((n) => n + 1);
              setShake((n) => n + 1);
              feel('oops');
            }
            break;
          case 'wrong':
            setWrong((n) => n + 1);
            feel('think');
            break;
          default: {
            const text = BANNER[e.type];
            if (text) say(text);
          }
        }
      }
    });
    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, []);

  const { w, h } = size;
  const ground = groundOf(h);
  const sky = h - ground;
  const robotSize = Math.round(ground * 1.15);
  const sx = (x: number) => x * w;
  const sy = (y: number) => y * sky;
  const sceneClass = [
    styles.field,
    styles[`sky${Math.min(3, Math.floor((game.level - 1) / 3))}`],
    game.feverMs > 0 && styles.fever,
    game.freezeMs > 0 && styles.frozen,
    game.lives === 1 && game.status === 'playing' && styles.lastLife,
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={sceneClass} style={{ '--ground': `${ground}px` } as CSSProperties} data-field>
      <div className={[styles.scene, shake && (shake % 2 ? styles.shakeA : styles.shakeB)].filter(Boolean).join(' ')}>
        <span className={styles.cloudA} aria-hidden>☁️</span>
        <span className={styles.cloudB} aria-hidden>☁️</span>
        {game.level >= 10 && <span className={styles.stars} aria-hidden />}
        {w > 0 && game.drops.map((d) => <DropView key={d.id} d={d} x={sx(d.x)} y={sy(d.y)} />)}

        <svg className={styles.fxLayer} width={w} height={h} aria-hidden>
          {fx.map((f) =>
            f.kind === 'beam' ? (
              <line key={f.id} className={[styles.beam, f.bomb && styles.beamBomb].filter(Boolean).join(' ')} x1={w / 2} y1={h - ground * 0.95} x2={sx(f.x)} y2={sy(f.y) - 22} />
            ) : null,
          )}
        </svg>
        {fx.map((f) => {
          if (f.kind === 'burst') {
            return (
              <span key={f.id} className={[styles.burst, f.big && styles.burstBig].filter(Boolean).join(' ')} style={{ left: sx(f.x), top: sy(f.y) - 22 }} aria-hidden>
                {SPARKS.map((s, i) => <i key={i} style={s} />)}
                {f.big && <b>💥</b>}
              </span>
            );
          }
          if (f.kind === 'points') {
            return <span key={f.id} className={styles.points} style={{ left: sx(f.x), top: sy(f.y) - 30 }} aria-hidden>{f.text}</span>;
          }
          if (f.kind === 'splash') {
            return <span key={f.id} className={styles.splash} style={{ left: sx(f.x) }} aria-hidden>💦</span>;
          }
          return null;
        })}

        <div className={styles.ground}>
          <div className={styles.launcher}>
            <span className={[styles.inputBox, game.input && styles.inputOn, wrong && (wrong % 2 ? styles.wrongA : styles.wrongB)].filter(Boolean).join(' ')} aria-label={`입력한 수 ${game.input || '없음'}`} data-input>
              {game.input || '?'}
            </span>
            <Robot mood={mood} size={robotSize} />
          </div>
        </div>
      </div>
      {flash > 0 && <span key={`flash${flash}`} className={styles.flash} aria-hidden />}
      {hurt > 0 && <span key={`hurt${hurt}`} className={styles.hurt} aria-hidden />}
      {banner && (
        <p key={banner.id} className={styles.banner} role="status">
          {banner.text}
        </p>
      )}
    </div>
  );
}
