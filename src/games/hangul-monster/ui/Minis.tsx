import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { formatTime } from '@/shared/format';
import { playSound } from '@/shared/sound/sfx';
import { Button } from '@/shared/ui/Button';
import { MAX_LIVES, newGame as newRain, step as rainStep, typeDigit as rainType, backspace as rainBack, submit as rainSubmit, type Game as RainGame } from '../../number-rain/engine/game';
import type { Face } from '../../number-rain/engine/questions';
import { generateSet } from '../../quick-math/engine/generate';
import { OP_SYMBOL, type Problem } from '../../quick-math/engine/types';
import { generatePuzzle, SPECS } from '../../sudoku/engine';
import { npcById, type Npc } from '../data/world';
import { createRng } from '../engine/rng';
import { useHangulMonster } from '../store';
import styles from './Minis.module.css';

const rng = createRng();

function Frame({ title, children, onQuit }: { title: string; children: React.ReactNode; onQuit: () => void }) {
  return (
    <div className={styles.mini} role="dialog" aria-label={title}>
      <header className={styles.head}>
        <h2>{title}</h2>
        <button className={styles.quit} onClick={onQuit}>그만하기</button>
      </header>
      {children}
    </div>
  );
}

function Pad({ max, onDigit, onBack, onOk, showOk = true, zero = true }: { max: number; onDigit: (d: number) => void; onBack?: () => void; onOk?: () => void; showOk?: boolean; zero?: boolean }) {
  const digits = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className={[styles.pad, max <= 4 && styles.pad4].filter(Boolean).join(' ')} role="group" aria-label="숫자 패드">
      {digits.map((d) => <button key={d} className={styles.key} onClick={() => onDigit(d)} aria-label={`${d}`}>{d}</button>)}
      {zero && <button className={styles.key} onClick={() => onDigit(0)} aria-label="0">0</button>}
      {onBack && <button className={[styles.key, styles.keyFn].join(' ')} onClick={onBack} aria-label="지우기">⌫</button>}
      {showOk && onOk && <button className={[styles.key, styles.keyOk].join(' ')} onClick={onOk} aria-label="확인">✔</button>}
    </div>
  );
}

/* ───────── 🧩 스도쿠 상자 ───────── */
function SudokuBox({ npc }: { npc: Npc }) {
  const { finishMini, closeMini } = useHangulMonster.getState();
  const { size, difficulty } = npc.puzzle!;
  const puzzle = useMemo(() => generatePuzzle(difficulty, { spec: SPECS[size] }), [size, difficulty]);
  const [values, setValues] = useState(puzzle.givens);
  const firstEmpty = (v: number[], from = 0) => {
    for (let k = 0; k < v.length; k++) {
      const i = (from + k) % v.length;
      if (!v[i]) return i;
    }
    return null;
  };
  const [sel, setSel] = useState<number | null>(() => firstEmpty(puzzle.givens));
  const [bad, setBad] = useState<{ i: number; key: number } | null>(null);
  const done = values.every(Boolean);
  const box = Math.sqrt(size);

  const place = (n: number) => {
    if (sel === null || done || puzzle.givens[sel]) return;
    if (puzzle.solution[sel] !== n) {
      playSound('wrong');
      setBad({ i: sel, key: Date.now() });
      return;
    }
    const v = values.map((x, i) => (i === sel ? n : x));
    setValues(v);
    playSound(v.every(Boolean) ? 'win' : 'place');
    setSel(firstEmpty(v, sel + 1));
  };

  return (
    <Frame title={size === 9 ? '🧩 큰 스도쿠 상자' : '🧩 스도쿠 상자'} onQuit={closeMini}>
      <p className={styles.help}>가로줄·세로줄·굵은 칸 안에 1~{size}가 한 번씩! 칸을 누르고 숫자를 골라 봐.</p>
      <div className={styles.sudoku} style={{ '--n': size } as CSSProperties} role="grid" aria-label="스도쿠 판">
        {values.map((v, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          return (
            <button
              key={`${i}-${bad?.i === i ? bad.key : 0}`}
              role="gridcell"
              className={[
                styles.cell,
                puzzle.givens[i] ? styles.given : '',
                sel === i && styles.sel,
                bad?.i === i && styles.bad,
                c % box === box - 1 && c < size - 1 && styles.boxR,
                r % box === box - 1 && r < size - 1 && styles.boxB,
              ].filter(Boolean).join(' ')}
              onClick={() => !puzzle.givens[i] && !done && setSel(i)}
              aria-label={`${r + 1}행 ${c + 1}열 ${v || '빈칸'}`}
              data-answer={puzzle.solution[i]}
            >
              {v || ''}
            </button>
          );
        })}
      </div>
      {done ? (
        <div className={styles.result}>
          <p>🎉 다 풀었다! 상자가 열린다!</p>
          <Button size="lg" onClick={() => finishMini({ won: true })}>🎁 선물 받기</Button>
        </div>
      ) : (
        <Pad max={size} zero={false} showOk={false} onDigit={place} />
      )}
    </Frame>
  );
}

/* ───────── ☔ 숫자 비 ───────── */
const RAIN_MS = 45_000;

function FaceView({ f }: { f: Face }) {
  if (f.t === 'count') return <span className={styles.rCount}>{f.emoji.repeat(f.n)}</span>;
  if (f.t === 'lines') return <span className={styles.rLines}><span>{f.lines[0]}</span><span>{f.lines[1]}</span></span>;
  return <span>{f.text}</span>;
}

function MiniRain({ npc }: { npc: Npc }) {
  const { finishMini, closeMini } = useHangulMonster.getState();
  const { mode, goal } = npc.rain!;
  const [started, setStarted] = useState(false);
  const [g, setG] = useState<RainGame>(() => ({ ...newRain(mode, 'slow'), status: 'playing' }));
  const gRef = useRef(g);
  gRef.current = g;
  const over = g.status === 'done' || g.elapsedMs >= RAIN_MS;

  useEffect(() => {
    if (!started || over) return;
    let last = performance.now();
    let id = 0;
    const loop = (t: number) => {
      const dt = Math.min(100, Math.max(0, t - last));
      last = t;
      const r = rainStep(gRef.current, dt, rng);
      if (r.events.some((e) => e.type === 'land' && e.hurt)) playSound('splash');
      setG(r.game);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [started, over]);

  const apply = useCallback((r: { game: RainGame; events: { type: string }[] }) => {
    for (const e of r.events) {
      if (e.type === 'pop') playSound('pop');
      if (e.type === 'bomb') playSound('boom');
      if (e.type === 'wrong') playSound('wrong');
    }
    setG(r.game);
  }, []);
  const digit = (d: number) => !over && started && apply(rainType(gRef.current, d));

  return (
    <Frame title={`☔ ${npc.name}의 숫자 비`} onQuit={closeMini}>
      <div className={styles.rainBar}>
        <span aria-label={`목숨 ${g.lives}개`}>{'❤️'.repeat(g.lives)}{'🤍'.repeat(MAX_LIVES - g.lives)}</span>
        <b aria-label={`점수 ${g.score}점`}>⭐ {g.score} / {goal}</b>
        <span>⏱ {formatTime(Math.max(0, RAIN_MS - g.elapsedMs))}</span>
      </div>
      <div className={styles.rainField} data-rain>
        {g.drops.map((d) => (
          <div
            key={d.id}
            className={[styles.drop, d.kind === 'bomb' && styles.bomb].filter(Boolean).join(' ')}
            style={{ left: `${d.x * 100}%`, top: `calc(${d.y} * (100% - 34px))` }}
            data-answer={d.q.answer}
            role="img"
            aria-label={`물방울 ${d.q.answer}`}
          >
            <FaceView f={d.q.face} />
          </div>
        ))}
        <div className={styles.ground}>{g.input || '?'}</div>
        {!started && (
          <div className={styles.cover}>
            <p>땅에 닿기 전에 답을 눌러 펑! {goal}개가 목표!</p>
            <Button size="lg" onClick={() => setStarted(true)} autoFocus>▶ 시작</Button>
          </div>
        )}
        {over && (
          <div className={styles.cover}>
            <p>{g.score >= goal ? '🎉 목표 성공!' : '☔ 비가 그쳤다!'} {g.score}개 터뜨렸어!</p>
            <Button size="lg" onClick={() => finishMini({ won: true, score: g.score })}>🎁 코인 받기</Button>
          </div>
        )}
      </div>
      <Pad max={9} onDigit={digit} onBack={() => setG(rainBack(gRef.current))} onOk={() => apply(rainSubmit(gRef.current))} />
    </Frame>
  );
}

/* ───────── ⚡ 빠른 계산 ───────── */
const QUIZ_N = 10;

const showProblem = (p: Problem) => {
  const parts = [p.a, OP_SYMBOL[p.op], p.b, '=', p.result].map(String);
  const at = p.blank === 'result' ? 4 : p.blank === 'a' ? 0 : 2;
  parts[at] = '□';
  return parts.join(' ');
};

function MiniQuiz({ npc }: { npc: Npc }) {
  const { finishMini, closeMini } = useHangulMonster.getState();
  const { ops, difficulty } = npc.quiz!;
  const problems = useMemo(() => generateSet(rng, { ops, difficulty, dans: [] }, QUIZ_N), [ops, difficulty]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(0);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [ms, setMs] = useState(0);
  const done = idx >= QUIZ_N;

  useEffect(() => {
    if (startAt === null || done) return;
    const t = setInterval(() => setMs(performance.now() - startAt), 200);
    return () => clearInterval(t);
  }, [startAt, done]);

  const p = problems[Math.min(idx, QUIZ_N - 1)];
  const check = (v: string) => {
    if (Number(v) === p.answer) {
      playSound('place');
      setInput('');
      if (idx + 1 >= QUIZ_N) setMs(performance.now() - startAt!);
      setIdx(idx + 1);
    } else {
      playSound('wrong');
      setInput('');
      setShake((n) => n + 1);
    }
  };
  const digit = (d: number) => {
    if (startAt === null || done) return;
    const v = input + d;
    if (v.length >= String(p.answer).length) check(v);
    else setInput(v);
  };

  return (
    <Frame title={`⚡ ${npc.name}의 빠른 계산`} onQuit={closeMini}>
      <div className={styles.rainBar}>
        <b>📝 {Math.min(idx + 1, QUIZ_N)} / {QUIZ_N}</b>
        <span aria-label="걸린 시간">⏱ {formatTime(ms)}</span>
      </div>
      <div className={styles.quizStage}>
        {startAt === null ? (
          <div className={styles.cover}>
            <p>{QUIZ_N}문제를 빨리 풀수록 코인이 많아!</p>
            <Button size="lg" onClick={() => setStartAt(performance.now())} autoFocus>▶ 시작</Button>
          </div>
        ) : done ? (
          <div className={styles.cover}>
            <p>🎉 {formatTime(ms)} 만에 다 풀었어!</p>
            <Button size="lg" onClick={() => finishMini({ won: true, ms })}>🎁 코인 받기</Button>
          </div>
        ) : (
          <p key={`${idx}-${shake}`} className={[styles.problem, shake && styles.shake].filter(Boolean).join(' ')} role="status" data-answer={p.answer}>
            {showProblem(p).replace('□', input || '□')}
          </p>
        )}
      </div>
      <Pad max={9} onDigit={digit} onBack={() => setInput(input.slice(0, -1))} onOk={() => input && check(input)} />
    </Frame>
  );
}

export function MiniGame() {
  const id = useHangulMonster((s) => s.mini);
  const npc = id ? npcById(id) : undefined;
  if (!npc) return null;
  if (npc.kind === 'puzzle') return <SudokuBox key={id} npc={npc} />;
  if (npc.kind === 'rain') return <MiniRain key={id} npc={npc} />;
  if (npc.kind === 'quiz') return <MiniQuiz key={id} npc={npc} />;
  return null;
}
