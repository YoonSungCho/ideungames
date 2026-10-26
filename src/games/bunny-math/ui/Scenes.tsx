import { useEffect, useState, type CSSProperties } from 'react';
import { FRIENDS, ITEMS, type ItemId } from '../data/items';
import { answerOf } from '../engine/tasks';
import type { Spot, Task } from '../engine/types';
import type { BunnyEvent, Session } from '../store';
import { useBunnyMath } from '../store';
import styles from './Bunny.module.css';

type Of<K extends Task['kind']> = Extract<Task, { kind: K }>;

/** 누르면 바로 반응 (손가락이 조금 밀려도 화면 끌기로 바뀌지 않게) */
const press = (fn: () => void) => ({
  onPointerDown: (e: React.PointerEvent) => {
    e.preventDefault();
    fn();
  },
  onClick: (e: React.MouseEvent) => e.detail === 0 && fn(),
});

/** 주사위 무늬 (3×3 칸 번호) */
const DICE: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function Thing({ item, badge, state, label, onTap, style, bump }: { item: ItemId; badge?: number; state?: 'on' | 'last' | 'new' | 'gone' | 'ghost'; label: string; onTap?: () => void; style?: CSSProperties; bump?: boolean }) {
  const cls = [styles.thing, state && styles[`thing_${state}`], bump && styles.bump].filter(Boolean).join(' ');
  const inner = (
    <>
      <span className={styles.thingEmoji}>{ITEMS[item].emoji}</span>
      {badge !== undefined && <b className={styles.badge}>{badge}</b>}
    </>
  );
  return onTap ? (
    <button className={cls} style={style} aria-label={label} {...press(onTap)}>
      {inner}
    </button>
  ) : (
    <span className={cls} style={style} aria-label={label} role="img">
      {inner}
    </span>
  );
}

/** 같은 물건을 다시 누르면 살짝 흔들기 (하나는 한 번만 센다) */
function useBump(event: BunnyEvent | null) {
  const [bump, setBump] = useState<number | null>(null);
  useEffect(() => {
    if (event?.kind !== 'bump' || event.value === undefined) return;
    setBump(event.value);
    const t = setTimeout(() => setBump(null), 400);
    return () => clearTimeout(t);
  }, [event]);
  return bump;
}

/** 물건 늘어놓기: 한 줄 · 흩어짐 · 주사위 · 10칸 상자 */
function Layout({ n, layout, spots, render }: { n: number; layout: Of<'count'>['layout']; spots: Spot[]; render: (i: number, style?: CSSProperties) => React.ReactNode }) {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (layout === 'scatter') {
    const size = n <= 4 ? 30 : n <= 9 ? 21 : 16;
    return (
      <div className={styles.scatter} style={{ ['--s' as string]: size }}>
        {idx.map((i) => render(i, { left: `${spots[i][0] * 100}%`, top: `${spots[i][1] * 100}%` }))}
      </div>
    );
  }
  if (layout === 'dice') {
    return (
      <div className={styles.dice}>
        {Array.from({ length: 9 }, (_, cell) => {
          const k = DICE[n].indexOf(cell);
          return <span key={cell} className={styles.diceCell}>{k >= 0 && render(k)}</span>;
        })}
      </div>
    );
  }
  if (layout === 'frame') {
    const frames = Math.max(1, Math.ceil(n / 10));
    return (
      <div className={styles.frames} data-frames={frames}>
        {Array.from({ length: frames }, (_, f) => (
          <div key={f} className={styles.frame}>
            {Array.from({ length: 10 }, (_, c) => {
              const i = f * 10 + c;
              return <span key={c} className={styles.frameCell}>{i < n && render(i)}</span>;
            })}
          </div>
        ))}
      </div>
    );
  }
  const rows = Math.ceil(n / 5);
  return (
    <div className={styles.rows} style={{ ['--cols' as string]: Math.min(n, 5), ['--rows' as string]: rows }}>
      {idx.map((i) => render(i))}
    </div>
  );
}

/** 세기: 하나씩 눌러 번호를 붙인다. 다 세면 마지막 번호가 반짝 (마지막에 센 수 = 모두) */
function CountScene({ t, s }: { t: Of<'count'>; s: Session }) {
  const tapItem = useBunnyMath((st) => st.tapItem);
  const bump = useBump(useBunnyMath((st) => st.event));
  // 한눈에 보기 문제도 눌러서 세어 볼 수 있다 (화면에서만 표시)
  const [help, setHelp] = useState<number[]>([]);
  useEffect(() => setHelp([]), [t.id]);
  const marks = t.tap ? s.marks : help;
  const name = ITEMS[t.item].name;
  const tap = (i: number) => {
    if (t.tap) return tapItem(i);
    if (!help.includes(i)) setHelp([...help, i]);
  };
  return (
    <div className={styles.field}>
      <Layout
        n={t.n}
        layout={t.layout}
        spots={t.spots}
        render={(i, style) => {
          const k = marks.indexOf(i);
          const last = k >= 0 && k === marks.length - 1 && marks.length === t.n;
          return (
            <Thing
              key={i}
              item={t.item}
              style={style}
              badge={k >= 0 ? k + 1 : undefined}
              state={last && s.phase === 'answer' ? 'last' : k >= 0 ? 'on' : undefined}
              bump={bump === i}
              label={k >= 0 ? `${name} ${k + 1}` : `${name}, 아직 안 셈`}
              onTap={s.solved ? undefined : () => tap(i)}
            />
          );
        }}
      />
    </div>
  );
}

/** 바구니 담기: 밭에서 누르면 바구니로, 바구니에서 누르면 다시 밭으로 */
function MakeScene({ t, s }: { t: Of<'make'>; s: Session }) {
  const { tapItem, untapItem } = useBunnyMath.getState();
  const name = ITEMS[t.item].name;
  const reveal = s.tries >= 2;
  return (
    <div className={styles.makeScene}>
      <div className={styles.goal} aria-label={`목표 ${t.n}개`}>
        <b>{t.n}</b>
        <span className={styles.goalDots} aria-hidden>
          {Array.from({ length: t.n }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      </div>
      <div className={styles.field}>
        <div className={styles.scatter} style={{ ['--s' as string]: t.field <= 6 ? 24 : t.field <= 9 ? 20 : 16 }}>
          {t.spots.map((sp, i) =>
            s.marks.includes(i) ? (
              <span key={i} className={[styles.thing, styles.thing_ghost].join(' ')} style={{ left: `${sp[0] * 100}%`, top: `${sp[1] * 100}%` }} aria-hidden />
            ) : (
              <Thing key={i} item={t.item} label={`밭에 있는 ${name}`} style={{ left: `${sp[0] * 100}%`, top: `${sp[1] * 100}%` }} onTap={s.solved ? undefined : () => tapItem(i)} />
            ),
          )}
        </div>
      </div>
      <div className={styles.basket} role="group" aria-label={`바구니, ${s.marks.length}개`}>
        <span className={styles.basketIcon} aria-hidden>
          🧺
        </span>
        <div className={styles.basketGrid}>
          {s.marks.map((m, k) => (
            <Thing key={m} item={t.item} badge={k + 1} state="on" label={`바구니의 ${name} ${k + 1}`} onTap={s.solved ? undefined : () => untapItem(m)} />
          ))}
          {reveal && Array.from({ length: Math.max(0, t.n - s.marks.length) }, (_, k) => <span key={`slot${k}`} className={styles.slot} aria-hidden />)}
        </div>
      </div>
    </div>
  );
}

/** 누가 더 많을까 (접시 둘) / 어느 수가 더 클까 (숫자 카드 둘) */
function CompareScene({ t, s }: { t: Of<'compare'>; s: Session }) {
  const choose = useBunnyMath((st) => st.choose);
  const event = useBunnyMath((st) => st.event);
  const reveal = s.tries >= 2 && !s.solved;
  const answer = answerOf(t);
  const sides = [t.a, t.b];
  if (!t.item) {
    return (
      <div className={styles.compareNums}>
        {sides.map((n, side) => (
          <button
            key={side}
            className={[styles.numCard, reveal && side === answer && styles.correctGlow, s.solved && side === answer && styles.picked, event?.kind === 'wrong' && event.value === side && styles.shake].filter(Boolean).join(' ')}
            {...press(() => choose(side))}
            aria-label={`수 ${n}`}
            data-side={side}
            data-correct={(reveal && side === answer) || undefined}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }
  const name = ITEMS[t.item].name;
  return (
    <div className={styles.plates}>
      {sides.map((n, side) => {
        const f = FRIENDS[t.who[side]];
        return (
          <button
            key={side}
            className={[styles.plate, t.spread === side && styles.spread, reveal && side === answer && styles.correctGlow, s.solved && side === answer && styles.picked, event?.kind === 'wrong' && event.value === side && styles.shake].filter(Boolean).join(' ')}
            {...press(() => choose(side))}
            aria-label={`${f.call}의 ${name}`}
            data-side={side}
            data-correct={(reveal && side === answer) || undefined}
          >
            <span className={styles.plateWho}>
              {f.emoji} <small>{f.call}</small>
            </span>
            <span className={styles.plateItems} style={{ ['--cols' as string]: Math.min(5, n) }}>
              {Array.from({ length: n }, (_, i) => (
                <span key={i} className={styles.plateItem}>
                  {ITEMS[t.item!].emoji}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 이야기: 더하기는 친구의 선물을 눌러 바구니에 넣고, 빼기는 바구니에서 친구에게 준다.
 * 하나 옮길 때마다 아래 수 길에서 토리도 한 칸 — 물건 수와 토리 자리가 늘 같다.
 */
function StoryScene({ t, s }: { t: Of<'story'>; s: Session }) {
  const tapItem = useBunnyMath((st) => st.tapItem);
  const name = ITEMS[t.item].name;
  const f = FRIENDS[t.who];
  const plus = t.op === '+';
  const basket = plus ? [...Array.from({ length: t.a }, (_, i) => ({ key: `a${i}`, isNew: false })), ...s.marks.map((m) => ({ key: `g${m}`, isNew: true }))] : Array.from({ length: t.a }, (_, i) => ({ key: `a${i}`, i }));
  const giftsLeft = plus ? Array.from({ length: t.b }, (_, i) => i).filter((i) => !s.marks.includes(i)) : [];
  const can = s.phase === 'act' && !s.solved;
  return (
    <div className={styles.storyScene}>
      <div className={styles.friendBox} role="group" aria-label={plus ? `${f.call}의 선물` : `${f.call}에게 준 것`}>
        <span className={styles.friendFace} aria-hidden>
          {f.emoji}
        </span>
        <div className={styles.friendItems}>
          {plus
            ? giftsLeft.map((i) => <Thing key={i} item={t.item} state="new" label={`선물 ${name}`} onTap={can ? () => tapItem(i) : undefined} />)
            : s.marks.map((m) => <Thing key={m} item={t.item} label={`준 ${name}`} state="gone" />)}
          {plus && giftsLeft.length === 0 && <span className={styles.thanks}>고마워!</span>}
          {!plus && s.marks.length === 0 && <span className={styles.thanks}>{t.b}개 줄래?</span>}
        </div>
      </div>
      <div className={styles.basket} role="group" aria-label={`토리 바구니, ${plus ? t.a + s.marks.length : t.a - s.marks.length}개`}>
        <span className={styles.basketIcon} aria-hidden>
          🧺
        </span>
        <div className={styles.basketGrid}>
          {plus
            ? basket.map((b, k) => <Thing key={b.key} item={t.item} badge={s.phase === 'answer' || s.solved ? k + 1 : undefined} state={'isNew' in b && b.isNew ? 'new' : undefined} label={name} />)
            : (basket as { key: string; i: number }[]).map((b) =>
                s.marks.includes(b.i) ? (
                  <span key={b.key} className={[styles.thing, styles.thing_ghost].join(' ')} aria-hidden />
                ) : (
                  <Thing key={b.key} item={t.item} label={`토리의 ${name}`} onTap={can ? () => tapItem(b.i) : undefined} />
                ),
              )}
        </div>
      </div>
    </div>
  );
}

/** 식 / 이야기 글 */
function CalcScene({ t }: { t: Of<'calc'> }) {
  if (t.words) {
    return (
      <div className={styles.wordCard}>
        <span className={styles.wordFace} aria-hidden>
          {FRIENDS[t.words.who].emoji}
          {ITEMS[t.words.item].emoji}
        </span>
      </div>
    );
  }
  const r = t.op === '+' ? t.a + t.b : t.a - t.b;
  return (
    <div className={styles.exprCard} aria-label={t.missing ? `${t.a} 더하기 몇은 ${r}` : `${t.a} ${t.op === '+' ? '더하기' : '빼기'} ${t.b}`}>
      <span>{t.a}</span>
      <span className={styles.op}>{t.op}</span>
      <span className={t.missing ? styles.qBox : undefined}>{t.missing ? '?' : t.b}</span>
      <span className={styles.op}>=</span>
      <span className={t.missing ? undefined : styles.qBox}>{t.missing ? r : '?'}</span>
    </div>
  );
}

/** 10칸 알 상자: 빈칸을 눌러 채운다 */
function TenScene({ t, s }: { t: Of<'ten'>; s: Session }) {
  const tapItem = useBunnyMath((st) => st.tapItem);
  return (
    <div className={styles.field}>
      <div className={styles.frames} data-frames={1}>
        <div className={[styles.frame, styles.eggBox].join(' ')} role="group" aria-label="알 상자">
          {Array.from({ length: 10 }, (_, i) => {
            if (i < t.a) return <span key={i} className={styles.frameCell}><Thing item="egg" label="알" /></span>;
            const k = s.marks.indexOf(i);
            return (
              <span key={i} className={styles.frameCell}>
                {k >= 0 ? (
                  <Thing item="egg" badge={k + 1} state="new" label={`넣은 알 ${k + 1}`} />
                ) : (
                  <button className={styles.emptyCell} {...press(() => !s.solved && tapItem(i))} aria-label="빈칸" />
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 뛰기: 화살표 방향 + 뛸 횟수만큼 발자국 (뛸 때마다 하나씩 켜진다) — 글을 못 읽어도 보인다 */
function HopScene({ t, s }: { t: Of<'hop' | 'land'>; s: Session }) {
  const done = t.kind === 'hop' ? s.path.length - 1 : s.solved ? t.k : 0;
  return (
    <div className={styles.hopSky}>
      <span className={styles.hopFrom} aria-hidden>
        {t.kind === 'land' && <b>{t.from}</b>}
        <span className={t.dir === 1 ? undefined : styles.flip}>➡️</span>
      </span>
      <span className={styles.paws} aria-label={`${t.dir === 1 ? '앞으로' : '뒤로'} ${t.k}칸${t.kind === 'hop' ? `, ${done}번 뛰었어요` : ''}`}>
        {Array.from({ length: t.k }, (_, i) => (
          <span key={i} className={i < done ? styles.pawOn : undefined}>
            🐾<small>{i + 1}</small>
          </span>
        ))}
      </span>
    </div>
  );
}

/** 문제 종류별 장면 (수 길은 따로) */
export function Scene({ t, s }: { t: Task; s: Session }) {
  switch (t.kind) {
    case 'count':
      return <CountScene t={t} s={s} />;
    case 'make':
      return <MakeScene t={t} s={s} />;
    case 'compare':
      return <CompareScene t={t} s={s} />;
    case 'story':
      return <StoryScene t={t} s={s} />;
    case 'calc':
      return <CalcScene t={t} />;
    case 'ten':
      return <TenScene t={t} s={s} />;
    case 'hop':
    case 'land':
      return <HopScene t={t} s={s} />;
  }
}
