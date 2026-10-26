import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { CHAPTERS, chapterById } from '../data/chapters';
import { FRIENDS } from '../data/items';
import { CHAPTER_DONE, CHAPTER_INTRO } from '../data/story';
import { chapterStars, hasProgress, isChapterDone, isChapterOpen, isLessonOpen, lessonKey, MIX, useBunnyMath } from '../store';
import { Cutscene } from './Cutscene';
import { GAME } from './PlayScreen';
import styles from './Bunny.module.css';

/** 단원 화면: 친구 소개 → 단계 4개. 다 깨면 친구가 잔치에 오기로 한다 */
export function ChapterScreen() {
  const { chapterId = '' } = useParams();
  const st = useBunnyMath();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<number | null>(null);
  const chapter = chapterById(chapterId);
  const index = CHAPTERS.findIndex((c) => c.id === chapterId);
  if (!chapter || !isChapterOpen(st, index)) return <Navigate to={GAME} replace />;

  const f = FRIENDS[chapter.friend];
  const done = isChapterDone(st.stars, chapter.id);
  const seen = (id: string) => st.seen.includes(id);
  if (!seen(`intro:${chapter.id}`)) return <Cutscene lines={CHAPTER_INTRO[chapter.id]} title={chapter.name} onDone={() => st.markSeen(`intro:${chapter.id}`)} />;
  if (done && !seen(`done:${chapter.id}`)) return <Cutscene lines={CHAPTER_DONE[chapter.id]} title={`${f.name} 초대`} onDone={() => st.markSeen(`done:${chapter.id}`)} />;

  const resume = hasProgress(st.session) && st.session!.key.startsWith(`${chapter.id}:`) ? st.session! : null;
  const go = (lesson: number) => {
    st.startLesson(chapter.id, lesson);
    navigate(`${GAME}/${chapter.id}/play`);
  };
  const choose = (lesson: number) => {
    if (!hasProgress(st.session)) return go(lesson);
    // 하던 단계를 누르면 이어서, 다른 단계면 묻는다
    if (st.session!.key === lessonKey(chapter.id, lesson)) return navigate(`${GAME}/${chapter.id}/play`);
    setConfirm(lesson);
  };
  const nextChapter = CHAPTERS[index + 1];
  const busyName = st.session && hasProgress(st.session) ? (st.session.key === MIX ? '섞어 놀기' : (() => {
    const [cid, li] = st.session!.key.split(':');
    return chapterById(cid)!.lessons[Number(li)].title;
  })()) : '';

  return (
    <div className={styles.chapterPage} style={{ ['--cc' as string]: chapter.color }}>
      <header className={[styles.banner, done && styles.bannerDone].filter(Boolean).join(' ')}>
        <span className={styles.bannerFriend} aria-hidden>
          {f.emoji}
        </span>
        <div>
          <h2>
            {chapter.emoji} {chapter.name}
          </h2>
          <p>{done ? `${f.call}도 잔치에 온대요! 별을 더 모아 볼까?` : `배울 것: ${chapter.learn}`}</p>
        </div>
        <span className={styles.bannerStars} aria-label={`별 ${chapterStars(st.stars, chapter.id)}개`}>
          ⭐ {chapterStars(st.stars, chapter.id)}/{chapter.lessons.length * 3}
        </span>
      </header>

      {resume && (
        <Button size="lg" className={styles.bigGo} onClick={() => navigate(`${GAME}/${chapter.id}/play`)}>
          ▶ 하던 놀이 이어하기 <small>{chapter.lessons[Number(resume.key.split(':')[1])].title}</small>
        </Button>
      )}

      <div className={styles.lessons}>
        {chapter.lessons.map((l, i) => {
          const open = isLessonOpen(st, chapter.id, i);
          const got = st.stars[lessonKey(chapter.id, i)] ?? 0;
          const isNext = open && got === 0;
          return (
            <button
              key={i}
              className={[styles.lessonBtn, !open && styles.locked, isNext && styles.nextLesson].filter(Boolean).join(' ')}
              disabled={!open}
              onClick={() => choose(i)}
              aria-label={`${i + 1}단계 ${l.title}${open ? `, 별 ${got}개` : ', 잠김'}`}
            >
              <span className={styles.lessonIcon} aria-hidden>
                {open ? l.icon : '🔒'}
              </span>
              <span className={styles.lessonText}>
                <b>
                  {i + 1}. {l.title}
                </b>
                <small>{l.desc}</small>
              </span>
              <span className={styles.lessonStars} aria-hidden>
                {[1, 2, 3].map((k) => (
                  <span key={k} className={k <= got ? styles.starOn : styles.starOff}>
                    ★
                  </span>
                ))}
              </span>
              {isNext && <span className={styles.goTag}>여기부터!</span>}
            </button>
          );
        })}
      </div>
      {done && nextChapter && (
        <Button variant="secondary" className={styles.nextChapter} onClick={() => navigate(`${GAME}/${nextChapter.id}`)}>
          {nextChapter.emoji} 다음 곳: {nextChapter.name} ▶
        </Button>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title="다른 놀이를 시작할까?"
        message={`하던 놀이(${busyName})는 처음부터 다시 해야 해요.`}
        cancelLabel="하던 거 할래"
        confirmLabel="새로 시작"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          go(confirm!);
          setConfirm(null);
        }}
      />
    </div>
  );
}
