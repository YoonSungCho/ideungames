import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { formatTime } from '@/shared/format';
import { MEDAL_ICON } from '@/shared/game/medals';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { regionById, REGIONS } from '../data/regions';
import { REGION_INTRO } from '../data/story';
import { bossMedal, hasProgress, isRegionOpen, isStageOpen, regionProgress, useHangulHero, type StageId } from '../store';
import { Cutscene } from './Cutscene';
import { Imp } from './characters';
import { stageLabel } from './labels';
import styles from './HangulHero.module.css';

/** 지역 화면: 1·2·3단계 + 보스. 처음 오면 지역 이야기. */
export function RegionScreen() {
  const { regionId = '' } = useParams();
  const region = regionById(regionId);
  const progress = useHangulHero((s) => s.progress);
  const session = useHangulHero((s) => s.session);
  const book = useHangulHero((s) => s.bossBooks[regionId]);
  const { startStage, markSeen, start } = useHangulHero.getState();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<StageId | null>(null);

  const index = REGIONS.findIndex((r) => r.id === regionId);
  if (!region || !isRegionOpen(progress, index)) return <Navigate to=".." replace />;
  const p = regionProgress(progress, regionId);
  const resumable = hasProgress(session) && session!.regionId === regionId ? session! : null;
  const villain = region.villain === 'bakjuk' ? 'bakjuk' : 'dwijuk';

  const go = (stage: StageId) => {
    startStage(regionId, stage);
    navigate('play');
  };
  const choose = (stage: StageId) => (hasProgress(session) ? setConfirm(stage) : go(stage));

  return (
    <div className={styles.regionPage} style={{ ['--rc' as string]: region.color }}>
      {!p.introSeen && <Cutscene lines={REGION_INTRO[regionId]} title={region.name} onDone={() => markSeen({ intro: regionId })} />}
      <header className={[styles.regionBanner, p.bossCleared && styles.freed].filter(Boolean).join(' ')}>
        <span className={styles.regionEmoji}>{region.emoji}</span>
        <div>
          <h2>{region.name}</h2>
          <p>{p.bossCleared ? '되찾았어요! 별을 더 모아 볼까?' : `배울 것: ${region.learn}`}</p>
        </div>
        <span className={styles.bannerImp} aria-hidden>
          {region.villain === 'both' ? (
            <>
              <Imp who="dwijuk" mood={p.bossCleared ? 'sad' : 'laugh'} size={56} />
              <Imp who="bakjuk" mood={p.bossCleared ? 'sad' : 'laugh'} size={56} />
            </>
          ) : (
            <Imp who={villain} mood={p.bossCleared ? 'sad' : 'laugh'} size={70} />
          )}
        </span>
      </header>

      {resumable && (
        <Button
          size="lg"
          className={styles.resume}
          onClick={() => {
            start();
            navigate('play');
          }}
        >
          ▶ 하던 단계 이어하기 <small>({stageLabel(resumable.stage)})</small>
        </Button>
      )}

      <div className={styles.stages}>
        {([0, 1, 2] as const).map((st) => {
          const open = isStageOpen(p, st);
          const isNext = open && p.stars[st] === 0;
          return (
            <button key={st} className={[styles.stageBtn, !open && styles.locked, isNext && styles.nextStage].filter(Boolean).join(' ')} disabled={!open} onClick={() => choose(st)} aria-label={`${st + 1}단계${open ? `, 별 ${p.stars[st]}개` : ', 잠김'}`}>
              <span className={styles.stageNum}>{open ? `${st + 1}단계` : '🔒'}</span>
              {isNext && <span className={styles.goTag}>여기부터!</span>}
              <span className={styles.stageStars}>
                {[1, 2, 3].map((k) => (
                  <span key={k} className={k <= p.stars[st] ? styles.starOn : styles.starOff}>★</span>
                ))}
              </span>
            </button>
          );
        })}
        <button
          className={[styles.stageBtn, styles.bossBtn, !isStageOpen(p, 'boss') && styles.locked, isStageOpen(p, 'boss') && !p.bossCleared && styles.nextStage].filter(Boolean).join(' ')}
          disabled={!isStageOpen(p, 'boss')}
          onClick={() => choose('boss')}
          aria-label={`보스전${isStageOpen(p, 'boss') ? '' : ', 잠김'}`}
        >
          <span className={styles.stageNum}>{isStageOpen(p, 'boss') ? '👹' : '🔒'}</span>
          <span className={styles.bossLabel}>
            {p.bossCleared ? '보스 물리침' : '보스전'}
            {book?.best !== undefined && (
              <small>
                {bossMedal(book.best) ? MEDAL_ICON[bossMedal(book.best)!] : '🏆'} {formatTime(book.best)}
              </small>
            )}
          </span>
        </button>
      </div>
      <p className={styles.regionHint}>{isStageOpen(p, 'boss') ? '보스를 빨리 물리칠수록 좋은 메달!' : '3단계를 깨면 보스가 나타나요'}</p>

      <ConfirmDialog
        open={confirm !== null}
        title="새 단계를 시작할까?"
        message={session ? `하던 ${regionById(session.regionId)?.name} ${stageLabel(session.stage)}는 취소돼요.` : undefined}
        cancelLabel="그냥 둘래"
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
