import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { callName } from '@/shared/korean';
import { speak, stopSpeaking, useCanSpeakKorean } from '@/shared/sound/speak';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { Modal } from '@/shared/ui/Modal';
import { chapterById, CHAPTERS, TASKS_PER_LESSON } from '../data/chapters';
import { FRIENDS } from '../data/items';
import { native } from '../engine/numbers';
import { CHEERS, explainOf, hintOf, promptOf, revealOf, type Line } from '../engine/prompts';
import { answerOf, hasChoices, resultOf } from '../engine/tasks';
import type { Task } from '../engine/types';
import { currentTask, isChapterOpen, isLessonOpen, MIX, useBunnyMath, type Session } from '../store';
import { Scene } from './Scenes';
import { HOP_MS, Stones } from './Stones';
import { Tori, type ToriMood } from './Tori';
import styles from './Bunny.module.css';

export const GAME = '/games/bunny-math';

/** 수 길이 필요한 문제 */
const usesLine = (t: Task) => t.kind === 'hop' || t.kind === 'land' || t.kind === 'story' || t.kind === 'calc' || (t.kind === 'compare' && !t.item);

/** 맞힌 뒤 다음 문제까지 (설명을 들을 시간) */
function nextDelay(t: Task) {
  if (t.kind === 'land') return t.k * HOP_MS + 1800;
  return explainOf(t) ? 2800 : 1300;
}

function useKeyboard(s: Session | null) {
  useEffect(() => {
    if (!s) return;
    const onKey = (e: KeyboardEvent) => {
      const st = useBunnyMath.getState();
      const ses = st.session;
      if (!ses || ses.solved || ses.done) return;
      const t = currentTask(ses);
      if (e.key === 'ArrowRight') st.hop(1);
      else if (e.key === 'ArrowLeft') st.hop(-1);
      else if (e.key === 'Enter' && t.kind === 'make') st.submit();
      else if (/^[0-9]$/.test(e.key) && hasChoices(t)) {
        const n = Number(e.key);
        const opt = t.options.find((o) => o === n) ?? t.options[n - 1];
        if (opt !== undefined) st.choose(opt);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s]);
}

function Bubble({ who, line, mood, onReplay, cheer }: { who: string; line: Line; mood: ToriMood; onReplay: () => void; cheer?: string }) {
  return (
    <div className={styles.bubbleRow}>
      <span className={styles.speaker} aria-hidden>
        {who === 'tori' ? <Tori mood={mood} size={56} /> : <span className={styles.speakerEmoji}>{FRIENDS[who as keyof typeof FRIENDS].emoji}</span>}
      </span>
      <p className={styles.bubble} aria-live="polite">
        {cheer ? <b className={styles.cheer}>{cheer} </b> : null}
        {line.text}
      </p>
      <button className={styles.replay} onClick={onReplay} aria-label="다시 듣기">
        🔊
      </button>
    </div>
  );
}

function Progress({ s }: { s: Session }) {
  return (
    <div className={styles.progress} aria-label={`${s.index + 1}번째 / ${TASKS_PER_LESSON}`}>
      {Array.from({ length: TASKS_PER_LESSON }, (_, i) => {
        const done = i < s.index || (i === s.index && s.solved);
        return (
          <span key={i} className={[styles.pip, done && styles.pipDone, i === s.index && !s.solved && styles.pipNow].filter(Boolean).join(' ')}>
            {done ? '🥕' : ''}
          </span>
        );
      })}
    </div>
  );
}

/** 숫자 보기 · 뛰기 버튼 · 다 담았어 */
function Answers({ t, s }: { t: Task; s: Session }) {
  const { choose, hop, submit } = useBunnyMath.getState();
  const event = useBunnyMath((st) => st.event);
  const revealed = s.tries >= 2 && !s.solved;
  const hopper = t.kind === 'hop' || t.kind === 'calc';
  return (
    <div className={styles.answers}>
      {hopper && (
        <div className={[styles.hopBtns, t.kind === 'calc' && styles.hopSmall].filter(Boolean).join(' ')}>
          <button className={styles.hopBtn} onClick={() => hop(-1)} disabled={s.solved} aria-label="뒤로 깡충">
            <span aria-hidden>◀</span> 깡충
          </button>
          <button className={styles.hopBtn} onClick={() => hop(1)} disabled={s.solved} aria-label="앞으로 깡충">
            깡충 <span aria-hidden>▶</span>
          </button>
        </div>
      )}
      {t.kind === 'make' && (
        <Button size="lg" className={styles.doneBtn} onClick={submit} disabled={s.solved}>
          🧺 다 담았어!
        </Button>
      )}
      {hasChoices(t) && (
        <div className={styles.options} role="group" aria-label="보기">
          {t.options.map((n) => {
            const isAnswer = n === answerOf(t);
            return (
              <button
                key={n}
                className={[styles.option, revealed && isAnswer && styles.correctGlow, s.solved && isAnswer && styles.picked, (event?.kind === 'wrong' || event?.kind === 'reveal') && event.value === n && !s.solved && styles.shake].filter(Boolean).join(' ')}
                disabled={s.phase !== 'answer' || s.solved}
                onClick={() => choose(n)}
                aria-label={String(n)}
                data-correct={(revealed && isAnswer) || undefined}
              >
                {n}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Result({ s, onNext, onRetry, onBack, chapterName }: { s: Session; onNext?: () => void; onRetry: () => void; onBack: () => void; chapterName?: string }) {
  const player = useBunnyMath((st) => st.player);
  const stars = s.stars ?? 0;
  const chapter = chapterById(s.key.split(':')[0]);
  const friend = chapter && FRIENDS[chapter.friend];
  return (
    <>
      <Confetti />
      <Modal open labelledBy="bunny-result">
        <div className={styles.result}>
          <Tori mood="cheer" size={90} />
          <h2 id="bunny-result">{callName(player)}, 다 했어!</h2>
          <div className={styles.resultStars} aria-label={`별 ${stars}개`}>
            {[1, 2, 3].map((k) => (
              <span key={k} className={k <= stars ? styles.starOn : styles.starOff} style={{ animationDelay: `${k * 0.15}s` }}>
                ★
              </span>
            ))}
          </div>
          <p className={styles.resultSub}>🥕 당근 {s.earned}개를 모았어요</p>
          {s.chapterDone && friend && (
            <p className={styles.unlock}>
              {friend.emoji} {chapter!.friend === 'tori' ? '이제 숲속 친구들을 만나러 가자!' : `${chapterName}도 잔치에 온대요!`}
            </p>
          )}
          <div className={styles.resultActions}>
            {onNext && (
              <Button size="lg" onClick={onNext}>
                {s.chapterDone ? `${friend?.emoji ?? '🎉'} ${chapter?.friend === 'tori' ? '친구들 만나러 가기' : '친구 만나러 가기'}` : '다음 ▶'}
              </Button>
            )}
            <Button variant="secondary" onClick={onRetry}>
              한 번 더
            </Button>
            <Button variant="ghost" onClick={onBack}>
              {s.key === MIX ? '지도로' : '단계 고르기'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function PlayScreen({ mix }: { mix?: boolean }) {
  const { chapterId = '' } = useParams();
  const session = useBunnyMath((s) => s.session);
  const event = useBunnyMath((s) => s.event);
  const stars = useBunnyMath((s) => s.stars);
  const unlockAll = useBunnyMath((s) => s.unlockAll);
  const { next, startLesson, startMix } = useBunnyMath.getState();
  const navigate = useNavigate();
  const canSpeak = useCanSpeakKorean();
  const [cheer, setCheer] = useState<string | undefined>();
  const [line, setLine] = useState<Line | null>(null);
  const [mood, setMood] = useState<ToriMood>('idle');

  const valid = !!session && (mix ? session.key === MIX : session.key.startsWith(`${chapterId}:`));
  const s = valid ? session! : null;
  const t = s && !s.done ? currentTask(s) : null;
  const chapter = mix ? undefined : chapterById(chapterId);
  const lessonIdx = s && !mix ? Number(s.key.split(':')[1]) : 0;
  useKeyboard(s);

  // 새 문제·새 단계마다 문제를 읽어 준다
  const promptKey = t ? `${t.id}:${s!.phase}` : '';
  const prompt = useMemo(() => (t ? promptOf(t, s!.phase) : null), [promptKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!prompt || s?.solved) return;
    setLine(prompt);
    setCheer(undefined);
    setMood('idle');
    speak(prompt.say);
  }, [prompt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), []);

  // 누르기·뛰기·맞힘·틀림에 맞춰 세어 주고 알려 준다
  const lastEvent = useRef(0);
  useEffect(() => {
    if (!event || !s || !t || event.key === lastEvent.current) return;
    lastEvent.current = event.key;
    if (event.kind === 'tap' && event.value !== undefined) speak(native(event.value), { rate: 1 });
    else if (event.kind === 'hop' && event.value !== undefined && t.kind === 'hop') speak(native(event.value), { rate: 1 });
    else if (event.kind === 'hop' && t.kind === 'calc') speak(native(event.value ?? 0), { rate: 1 });
    else if (event.kind === 'wrong') {
      const h = hintOf(t, { count: s.marks.length });
      setLine(h);
      setMood('oops');
      speak(h.say);
    } else if (event.kind === 'reveal') {
      const r = revealOf(t);
      setLine(r);
      setMood('think');
      speak(r.say);
    } else if (event.kind === 'correct') {
      const ex = explainOf(t);
      setCheer(CHEERS[(s.index + s.earned) % CHEERS.length]);
      setMood('cheer');
      if (ex) {
        setLine(ex);
        if (t.kind !== 'land') speak(ex.say);
      } else stopSpeaking();
    }
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

  // 맞히면 잠시 뒤 다음 문제 (저장된 판이 "맞힘" 상태로 열려도 이어서)
  useEffect(() => {
    if (!s?.solved || !t) return;
    const id = setTimeout(next, nextDelay(t));
    return () => clearTimeout(id);
  }, [s?.solved, t?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!valid) return <Navigate to={mix ? GAME : `${GAME}/${chapterId}`} replace />;
  const ses = s!;

  if (ses.done) {
    const nextIdx = lessonIdx + 1;
    const hasNext = !mix && chapter && nextIdx < chapter.lessons.length && isLessonOpen({ stars, unlockAll }, chapter.id, nextIdx);
    const chIdx = CHAPTERS.findIndex((c) => c.id === chapterId);
    return (
      <div className={styles.play}>
        <Result
          s={ses}
          chapterName={chapter ? FRIENDS[chapter.friend].call : undefined}
          onNext={
            ses.chapterDone
              ? () => navigate(`${GAME}/${chapterId}`)
              : hasNext
                ? () => startLesson(chapterId, nextIdx)
                : !mix && CHAPTERS[chIdx + 1] && isChapterOpen({ stars, unlockAll }, chIdx + 1)
                  ? () => navigate(`${GAME}/${CHAPTERS[chIdx + 1].id}`)
                  : undefined
          }
          onRetry={() => (mix ? startMix() : startLesson(chapterId, lessonIdx))}
          onBack={() => navigate(mix ? GAME : `${GAME}/${chapterId}`)}
        />
      </div>
    );
  }

  const task = t!;
  const lesson = chapter?.lessons[lessonIdx];
  const speaker = mix ? 'tori' : chapter!.friend;
  const revealed = ses.tries >= 2 && !ses.solved;
  const shown = line ?? prompt!;
  const hint = !canSpeak && task.kind === 'count' && ses.phase === 'act' ? '눌러서 세어 봐!' : undefined;

  return (
    <div className={[styles.play, usesLine(task) && styles.withLine, styles[`kind_${task.kind}`]].filter(Boolean).join(' ')} style={{ ['--cc' as string]: chapter?.color ?? '#7c5cff' }}>
      <HeaderSlot>
        <span className={styles.lessonChip}>
          {mix ? '🎲 섞어 놀기' : `${chapter!.emoji} ${lesson!.title}`}
        </span>
      </HeaderSlot>
      <div className={styles.side}>
        <Progress s={ses} />
        <Bubble who={speaker} line={shown} mood={mood} cheer={cheer} onReplay={() => speak(shown.say)} />
      </div>
      <div className={styles.stage} data-kind={task.kind} data-task={task.id}>
        <Scene t={task} s={ses} />
        {hint && <p className={styles.softHint}>{hint}</p>}
      </div>
      {usesLine(task) && (
        <div className={styles.lineWrap}>
          <Stones
            view={'view' in task ? task.view : { lo: 0, hi: 10 }}
            path={task.kind === 'compare' ? [] : ses.path}
            mood={mood}
            onStone={task.kind === 'hop' || task.kind === 'land' || task.kind === 'calc' ? useBunnyMath.getState().tapStone : undefined}
            flag={task.kind === 'calc' && task.missing ? resultOf(task) : undefined}
            marks={task.kind === 'compare' ? [{ n: task.a, label: '▼' }, { n: task.b, label: '▼' }] : undefined}
            glow={revealed && (task.kind === 'hop' || task.kind === 'land') ? answerOf(task) : undefined}
            guide={task.kind === 'land' && ses.tries >= 1 && !ses.solved ? { from: task.from, k: task.k, dir: task.dir } : undefined}
            onHopShown={task.kind === 'land' ? (n) => speak(native(n), { rate: 1 }) : undefined}
          />
        </div>
      )}
      <Answers t={task} s={ses} />
    </div>
  );
}
