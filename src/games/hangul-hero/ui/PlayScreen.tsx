import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { formatTime } from '@/shared/format';
import { useAutoPause, useGameClock } from '@/shared/game/hooks';
import { MEDAL_ICON, MEDAL_LABEL } from '@/shared/game/medals';
import { StartOverlay } from '@/shared/game/StartOverlay';
import { useLeaveAsking, useLeaveGuard } from '@/shared/leaveGuard';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { speak } from '@/shared/sound/speak';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { ClockIcon } from '@/shared/ui/icons';
import { Modal } from '@/shared/ui/Modal';
import { Robot } from '@/shared/ui/Robot';
import { BOSS_HP, regionById, REGIONS } from '../data/regions';
import { BOSS_INTRO, BOSS_WIN, ENDING } from '../data/story';
import { jamoSay } from '../engine/hangul';
import { answerOf } from '../engine/questions';
import { bossMedal, currentQuestion, hasProgress, useHangulHero, type Session } from '../store';
import { Cutscene } from './Cutscene';
import { Hero, Imp, type HeroMood, type ImpMood } from './characters';
import { stageLabel } from './labels';
import { AnswerArea, PromptCard } from './QuestionView';
import styles from './HangulHero.module.css';

const pieceLabel = (p: string) => p.slice(2);
const GAME = '/games/hangul-hero';

function useKeyboard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const s = useHangulHero.getState();
      const q = s.session && currentQuestion(s.session);
      const n = Number(e.key);
      if (q?.kind === 'choice' && n >= 1 && n <= q.options.length) s.choose(q.options[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

function StatusRow({ session, live }: { session: Session; live: boolean }) {
  const pause = useHangulHero((s) => s.pause);
  const boss = session.stage === 'boss';
  return (
    <div className={styles.status}>
      {boss ? (
        <div className={styles.hpWrap} aria-label={`보스 체력 ${session.hp}`}>
          <span className={styles.hpLabel}>👹</span>
          <div className={styles.hpBar}>
            <span style={{ width: `${(session.hp / BOSS_HP) * 100}%` }} />
          </div>
        </div>
      ) : (
        <div className={styles.dots} aria-label={`${session.index + 1}번째 문제 / ${session.questions.length}`}>
          {session.questions.map((q, i) => (
            <span key={q.id} className={i < session.index || (i === session.index && session.solved) ? styles.dotDone : i === session.index ? styles.dotNow : undefined} />
          ))}
        </div>
      )}
      <span className={styles.stat} aria-label="걸린 시간">
        <ClockIcon width={16} height={16} /> <b>{formatTime(session.elapsedMs)}</b>
        {live && (
          <button className={styles.pauseBtn} onClick={pause} aria-label="잠깐 멈추기">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        )}
      </span>
    </div>
  );
}

/** 보스전 무대: 마왕과 용사, 맞히면 붓에서 빛이 날아간다 */
function BossStage({ session }: { session: Session }) {
  const event = useHangulHero((s) => s.event);
  const region = regionById(session.regionId)!;
  const [heroMood, setHeroMood] = useState<HeroMood>('idle');
  const [impMood, setImpMood] = useState<ImpMood>('normal');
  useEffect(() => {
    if (!event) return;
    if (event.kind === 'hit') {
      setHeroMood('attack');
      setImpMood('hit');
    } else if (event.kind === 'wrong' || event.kind === 'reveal') {
      setImpMood('laugh');
    }
    const t = setTimeout(() => {
      setHeroMood('idle');
      setImpMood('normal');
    }, 700);
    return () => clearTimeout(t);
  }, [event]);
  const imps = region.villain === 'both' ? (['dwijuk', 'bakjuk'] as const) : ([region.villain === 'bakjuk' ? 'bakjuk' : 'dwijuk'] as const);
  return (
    <div className={styles.arena}>
      <Hero mood={heroMood} size={84} />
      {event?.kind === 'hit' && (
        <span className={styles.beam} key={event.key} aria-hidden>
          ✨
        </span>
      )}
      <div className={styles.arenaImps}>
        {event?.kind === 'hit' && (
          <span className={styles.damage} key={`d${event.key}`}>
            -{session.lastHit}
          </span>
        )}
        {imps.map((w) => (
          <Imp key={w} who={w} mood={impMood} size={imps.length > 1 ? 72 : 96} />
        ))}
      </div>
    </div>
  );
}

function StageResult({ session, onNext, onRetry, onRegion }: { session: Session; onNext?: () => void; onRetry: () => void; onRegion: () => void }) {
  const name = useSettings((s) => s.playerName);
  const stars = session.stars ?? 0;
  return (
    <>
      <Confetti />
      <Modal open labelledBy="stage-result">
        <div className={styles.result}>
          <Robot mood="cheer" size={84} />
          <h2 id="stage-result">{callName(name)}, {stageLabel(session.stage)} 성공!</h2>
          <div className={styles.resultStars} aria-label={`별 ${stars}개`}>
            {[1, 2, 3].map((k) => (
              <span key={k} className={k <= stars ? styles.starOn : styles.starOff} style={{ animationDelay: `${k * 0.15}s` }}>★</span>
            ))}
          </div>
          {session.newPieces.length > 0 && (
            <div className={styles.newPieces}>
              <p>새로 찾은 한글 조각</p>
              <div>
                {session.newPieces.slice(0, 12).map((p) => (
                  <button key={p} onClick={() => speak(p.startsWith('w:') ? pieceLabel(p) : jamoSay(pieceLabel(p)))}>{pieceLabel(p)}</button>
                ))}
              </div>
            </div>
          )}
          <div className={styles.resultActions}>
            {onNext && <Button size="lg" onClick={onNext}>다음 단계 ▶</Button>}
            <Button variant="secondary" onClick={onRetry}>다시 하기</Button>
            <Button variant="ghost" onClick={onRegion}>지역으로</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function BossResult({ session, onRetry, onMap }: { session: Session; onRetry: () => void; onMap: () => void }) {
  const name = useSettings((s) => s.playerName);
  const region = regionById(session.regionId)!;
  const idx = REGIONS.findIndex((r) => r.id === region.id);
  const nextRegion = REGIONS[idx + 1];
  const medal = bossMedal(session.elapsedMs);
  const improved = session.prevBest !== undefined && Math.floor(session.elapsedMs / 1000) < Math.floor(session.prevBest / 1000);
  return (
    <>
      <Confetti />
      <Modal open labelledBy="boss-result">
        <div className={styles.result}>
          <div className={styles.resultMedal}>{medal ? MEDAL_ICON[medal] : '🏅'}</div>
          <h2 id="boss-result">{region.name}을 되찾았어!</h2>
          <p className={styles.resultSub}>
            {formatTime(session.elapsedMs)} 만에 물리쳤어요{medal && <> · {MEDAL_LABEL[medal]} 메달</>}
          </p>
          {improved && <p className={styles.banner}>🏆 최고 기록 갱신!</p>}
          {session.prevBest === undefined && <p className={styles.banner}>🎉 {callName(name)}, 대단해!</p>}
          {nextRegion && <p className={styles.unlock}>새 지역이 열렸어요: {nextRegion.emoji} {nextRegion.name}</p>}
          <div className={styles.resultActions}>
            <Button size="lg" onClick={onMap}>🗺 지도로</Button>
            <Button variant="secondary" onClick={onRetry}>다시 도전</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function PlayScreen() {
  const { regionId = '' } = useParams();
  const session = useHangulHero((s) => s.session);
  const paused = useHangulHero((s) => s.paused);
  const event = useHangulHero((s) => s.event);
  const endingSeen = useHangulHero((s) => s.endingSeen);
  const { start, next, startStage, markSeen } = useHangulHero.getState();
  const navigate = useNavigate();
  const [bossIntroDone, setBossIntroDone] = useState(false);
  const [winStoryDone, setWinStoryDone] = useState(false);

  const valid = !!session && session.regionId === regionId;
  const live = valid && session!.status === 'playing' && !paused;
  const asking = useLeaveAsking();
  const noop = useCallback(() => {}, []);
  // 단계 진행 중엔 지역 화면으로 가는 것도 확인 (그만하기여도 이어하기 가능)
  useLeaveGuard(valid && hasProgress(session), noop, true);
  useAutoPause(useHangulHero.getState().pause, false);
  useGameClock(live && !asking, useHangulHero.getState().tick);
  useKeyboard(live && !asking);

  // 맞히면 정답을 읽어 주고 잠시 뒤 다음 문제로
  useEffect(() => {
    if (!event || !valid) return;
    if (event.kind === 'correct' || event.kind === 'hit') {
      const q = currentQuestion(session!);
      speak(q.kind === 'choice' && q.optionSay?.[q.answer] ? q.optionSay[q.answer] : answerOf(q));
      const t = setTimeout(next, event.kind === 'hit' ? 900 : 750);
      return () => clearTimeout(t);
    }
    if (event.kind === 'reveal') {
      const q = currentQuestion(session!);
      speak(`정답은 ${q.kind === 'choice' && q.optionSay?.[q.answer] ? q.optionSay[q.answer] : answerOf(q)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  if (!valid) return <Navigate to={`${GAME}/${regionId}`} replace />;
  const s = session!;
  const region = regionById(regionId)!;
  const boss = s.stage === 'boss';
  const q = currentQuestion(s);
  const veiled = s.status === 'ready' || (s.status === 'playing' && paused);

  // 보스전 시작 전 이야기
  if (boss && s.status === 'ready' && !bossIntroDone) {
    return <Cutscene lines={BOSS_INTRO[regionId]} title="보스 등장" onDone={() => setBossIntroDone(true)} />;
  }
  // 보스를 물리친 뒤 이야기 (마지막 지역은 엔딩)
  if (boss && s.status === 'done' && !winStoryDone) {
    const lines = regionId === 'sky' ? ENDING : BOSS_WIN[regionId];
    return (
      <Cutscene
        lines={lines}
        title={regionId === 'sky' ? '엔딩' : '승리'}
        onDone={() => {
          if (regionId === 'sky' && !endingSeen) markSeen('ending');
          setWinStoryDone(true);
        }}
      />
    );
  }

  const stageIdx = s.stage === 'boss' ? 3 : s.stage;
  const nextStage = stageIdx < 2 ? ((stageIdx + 1) as 1 | 2) : stageIdx === 2 ? 'boss' : null;

  return (
    <div className={[styles.play, veiled && styles.veiled, boss && styles.bossPlay].filter(Boolean).join(' ')} style={{ ['--rc' as string]: region.color }}>
      <HeaderSlot>
        <span className={styles.regionChip}>
          {region.emoji} {region.name} · {stageLabel(s.stage)}
        </span>
      </HeaderSlot>
      <div className={styles.side}>
        <StatusRow session={s} live={live} />
      </div>
      <div className={styles.stage} data-stage>
        {/* 보스전: 마왕과 용사가 문제 위에서 싸운다 (가로 화면에선 넓은 왼쪽에) */}
        {boss && <BossStage session={s} />}
        <PromptCard q={q} live={live} revealed={s.tries >= 2 && !s.solved ? (q.kind === 'build' ? q.result : q.kind === 'order' ? '위에 적힌 순서' : q.answer) : undefined} />
        {veiled && (
          <StartOverlay
            ready={s.status === 'ready'}
            title={`${region.emoji} ${region.name} · ${stageLabel(s.stage)}`}
            onStart={start}
            readyHint={boss ? '빨리 맞힐수록 더 세게 공격해요!' : '문제를 듣고 맞혀 봐!'}
            pausedHint="다시 시작하면 문제가 보여요"
          />
        )}
      </div>
      <div className={styles.answers}>
        <AnswerArea />
      </div>

      {s.status === 'done' && !boss && (
        <StageResult
          session={s}
          onNext={nextStage !== null ? () => startStage(regionId, nextStage) : undefined}
          onRetry={() => startStage(regionId, s.stage)}
          onRegion={() => navigate(`${GAME}/${regionId}`)}
        />
      )}
      {s.status === 'done' && boss && (
        <BossResult
          session={s}
          onRetry={() => {
            setBossIntroDone(true);
            setWinStoryDone(false);
            startStage(regionId, 'boss');
          }}
          onMap={() => navigate(GAME)}
        />
      )}
    </div>
  );
}
