import { useState } from 'react';
import { useNavigate } from 'react-router';
import { callName } from '@/shared/korean';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Modal } from '@/shared/ui/Modal';
import { CHAPTERS, LESSON_COUNT, chapterById } from '../data/chapters';
import { FRIENDS } from '../data/items';
import { ENDING, PROLOGUE } from '../data/story';
import { chapterStars, clearedLessons, hasProgress, isChapterDone, isChapterOpen, MIX, nextLesson, totalStars, useBunnyMath } from '../store';
import { Cutscene } from './Cutscene';
import { GAME } from './PlayScreen';
import { Tori } from './Tori';
import styles from './Bunny.module.css';

/** 섞어 놀기는 단계를 이만큼 깨면 열린다 */
const MIX_AFTER = 3;

function NameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = useBunnyMath((s) => s.player);
  const setPlayer = useBunnyMath((s) => s.setPlayer);
  const [name, setName] = useState(player);
  return (
    <Modal open={open} onClose={onClose} labelledBy="bunny-name">
      <form
        className={styles.nameForm}
        onSubmit={(e) => {
          e.preventDefault();
          setPlayer(name);
          onClose();
        }}
      >
        <h2 id="bunny-name">누가 놀까?</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={8} aria-label="이름" autoFocus />
        <Button size="lg" type="submit">
          좋아!
        </Button>
      </form>
    </Modal>
  );
}

/** 깡충 숲 지도: 보름달 잔치에 올 친구들, 이어서 놀기, 단원 길 */
export function MapScreen() {
  const st = useBunnyMath();
  const navigate = useNavigate();
  const [naming, setNaming] = useState(false);
  const [unlockAsk, setUnlockAsk] = useState(false);
  const seen = (id: string) => st.seen.includes(id);
  const allDone = CHAPTERS.every((c) => isChapterDone(st.stars, c.id));
  const joined = CHAPTERS.filter((c) => isChapterDone(st.stars, c.id)).length;
  const upNext = nextLesson(st);
  const resume = hasProgress(st.session) ? st.session! : null;
  const canMix = clearedLessons(st.stars).length >= MIX_AFTER;

  if (!seen('prologue')) return <Cutscene lines={PROLOGUE} title="처음 이야기" onDone={() => st.markSeen('prologue')} />;
  if (allDone && !seen('ending')) return <Cutscene lines={ENDING} title="보름달 잔치" onDone={() => st.markSeen('ending')} />;

  const goLesson = (chapter: string, lesson: number) => {
    // 처음 가는 곳이면 친구 이야기부터 (단원 화면에서)
    if (!seen(`intro:${chapter}`)) return navigate(`${GAME}/${chapter}`);
    st.startLesson(chapter, lesson);
    navigate(`${GAME}/${chapter}/play`);
  };
  const resumeLabel = resume && (resume.key === MIX ? '🎲 섞어 놀기' : (() => {
    const [cid, li] = resume.key.split(':');
    const c = chapterById(cid)!;
    return `${c.emoji} ${c.lessons[Number(li)].title}`;
  })());

  return (
    <div className={styles.mapPage}>
      <div className={styles.mapTop}>
        <Tori mood="happy" size={64} />
        <div className={styles.mapHello}>
          <button className={styles.nameChip} onClick={() => setNaming(true)} aria-label={`이름 바꾸기, 지금 ${st.player}`}>
            🙋 {st.player} ✏️
          </button>
          <span className={styles.mapStats}>
            <span aria-label={`별 ${totalStars(st.stars)}개`}>⭐ {totalStars(st.stars)}/{LESSON_COUNT * 3}</span>
            <span aria-label={`당근 ${st.carrots}개`}>🥕 {st.carrots}</span>
          </span>
        </div>
      </div>

      <section className={styles.party} aria-label={`잔치에 올 친구 ${joined}/${CHAPTERS.length}`}>
        <p>🌕 보름달 잔치 {allDone ? '— 모두 모였어요!' : `준비 중 · 친구 ${joined}/${CHAPTERS.length}`}</p>
        <div className={styles.partyRow}>
          {CHAPTERS.map((c) => (
            <span key={c.id} className={isChapterDone(st.stars, c.id) ? styles.joined : styles.notYet} title={FRIENDS[c.friend].name}>
              {FRIENDS[c.friend].emoji}
            </span>
          ))}
        </div>
      </section>

      {resume ? (
        <Button size="lg" className={styles.bigGo} onClick={() => navigate(resume.key === MIX ? `${GAME}/mix` : `${GAME}/${resume.key.split(':')[0]}/play`)}>
          ▶ 하던 놀이 이어하기 <small>{resumeLabel}</small>
        </Button>
      ) : (
        upNext && (
          <Button size="lg" className={styles.bigGo} onClick={() => goLesson(upNext.chapter, upNext.lesson)}>
            ▶ {callName(st.player)}, 놀러 가자! <small>{chapterById(upNext.chapter)!.emoji} {chapterById(upNext.chapter)!.lessons[upNext.lesson].title}</small>
          </Button>
        )
      )}

      <ol className={styles.path}>
        {CHAPTERS.map((c, i) => {
          const open = isChapterOpen(st, i);
          const done = isChapterDone(st.stars, c.id);
          const got = chapterStars(st.stars, c.id);
          const f = FRIENDS[c.friend];
          return (
            <li key={c.id} className={[styles.node, i % 2 ? styles.right : styles.left].join(' ')}>
              <button
                className={[styles.island, done && styles.islandDone, !open && styles.locked, open && !done && styles.current].filter(Boolean).join(' ')}
                style={{ ['--cc' as string]: c.color }}
                disabled={!open}
                onClick={() => navigate(`${GAME}/${c.id}`)}
                aria-label={`${i + 1}. ${c.name}${open ? `, 별 ${got}개${done ? ', 다 함' : ''}` : ', 잠김'}`}
              >
                <span className={styles.islandEmoji}>{open ? c.emoji : '🔒'}</span>
                {open && <span className={styles.islandFriend}>{f.emoji}</span>}
              </button>
              <div className={styles.nodeLabel}>
                <b>{c.name}</b>
                <small>{open ? `⭐ ${got}/${c.lessons.length * 3} · ${c.learn}` : '앞 친구를 도와주면 열려요'}</small>
              </div>
            </li>
          );
        })}
      </ol>

      <div className={styles.mapFoot}>
        {canMix && (
          <Button
            variant="secondary"
            onClick={() => {
              if (!resume) st.startMix();
              navigate(`${GAME}/mix`);
            }}
          >
            🎲 섞어 놀기
          </Button>
        )}
        <Button variant="ghost" onClick={() => useBunnyMath.setState({ seen: st.seen.filter((x) => x !== 'prologue') })}>
          📜 처음 이야기
        </Button>
        <Button variant="ghost" onClick={() => (st.unlockAll ? st.setUnlockAll(false) : setUnlockAsk(true))} aria-pressed={st.unlockAll}>
          {st.unlockAll ? '🔒 순서대로 열기' : '🔓 모두 열기 (어른용)'}
        </Button>
      </div>

      <NameDialog key={String(naming)} open={naming} onClose={() => setNaming(false)} />
      <ConfirmDialog
        open={unlockAsk}
        title="모든 곳을 열까요?"
        message="아이 수준에 맞는 곳부터 바로 놀 수 있어요. 순서대로 하면 쉬운 것부터 차근차근 이어져요."
        cancelLabel="순서대로 할래"
        confirmLabel="모두 열기"
        onCancel={() => setUnlockAsk(false)}
        onConfirm={() => {
          st.setUnlockAll(true);
          setUnlockAsk(false);
        }}
      />
    </div>
  );
}
