import { useCallback, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useLeaveGuard } from '@/shared/leaveGuard';
import { BATTLE_SONG, FIELD_SONG, music } from '@/shared/sound/music';
import { Button } from '@/shared/ui/Button';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { species, STARTERS } from './data/species';
import { useHangulMonster } from './store';
import { BattleScreen, HpBar } from './ui/Battle';
import { Dialog } from './ui/Dialog';
import { MonsterArt } from './ui/MonsterArt';
import { Ending, MenuSheet, Shop, StarterPick } from './ui/Overlays';
import { World } from './ui/World';
import styles from './ui/HangulMonster.module.css';

function TopBar() {
  const badges = useHangulMonster((s) => s.badges);
  const coins = useHangulMonster((s) => s.coins);
  const musicOn = useHangulMonster((s) => s.music);
  const { openMenu, toggleMusic } = useHangulMonster.getState();
  return (
    <HeaderSlot>
      <button className={styles.menuBtn} onClick={openMenu} aria-label="메뉴: 친구들·가방·도감">🎒 <span>메뉴</span></button>
      <span className={styles.chip} aria-label={`배지 ${badges}개`}>🏅 {badges}</span>
      <span className={styles.chip} aria-label={`코인 ${coins}개`}>🪙 {coins}</span>
      <button className={[styles.musicBtn, musicOn && styles.on].filter(Boolean).join(' ')} onClick={toggleMusic} aria-pressed={musicOn} aria-label="배경 음악">
        {musicOn ? '🎵' : '🔇'}
      </button>
    </HeaderSlot>
  );
}

/** 왼쪽 위: 맨 앞 친구 */
function LeadHud() {
  const lead = useHangulMonster((s) => s.party[0]);
  if (!lead) return null;
  return (
    <div className={styles.leadHud} aria-label={`맨 앞 친구 ${species(lead.sp).name}`}>
      <MonsterArt sp={lead.sp} size={40} />
      <div>
        <b>{species(lead.sp).name} <small>Lv.{lead.lv}</small></b>
        <HpBar m={lead} />
      </div>
    </div>
  );
}

function Title() {
  const newGame = useHangulMonster((s) => s.newGame);
  return (
    <div className={styles.title}>
      <h1 className={styles.logo}>
        한글 <span>몬스터</span>
      </h1>
      <div className={styles.titleMons}>
        {STARTERS.map((id) => <MonsterArt key={id} sp={id} size={96} className={styles.bob} />)}
      </div>
      <p className={styles.titleText}>풀숲을 걸으며 한글 몬스터를 만나고, 한글 문제로 겨루고, 친구로 모아 보자!</p>
      <Button size="lg" onClick={newGame}>▶ 모험 시작</Button>
    </div>
  );
}

function Game() {
  const started = useHangulMonster((s) => s.started);
  const inBattle = useHangulMonster((s) => !!s.battle);
  const overlay = useHangulMonster((s) => s.overlay);
  const musicOn = useHangulMonster((s) => s.music);
  const cancel = useCallback(() => useHangulMonster.getState().cancelBattle(), []);
  // 배틀 중에 나가면 묻는다. "그만하기"면 배틀은 없던 일로
  useLeaveGuard(inBattle, cancel);

  useEffect(() => {
    if (!started || !musicOn) return;
    music.start(inBattle ? BATTLE_SONG : FIELD_SONG);
  }, [started, musicOn, inBattle]);
  useEffect(() => () => music.stop(), []);
  useEffect(() => {
    if (!musicOn) music.stop();
  }, [musicOn]);

  if (!started) return <Title />;
  return (
    <div className={styles.game}>
      <TopBar />
      {inBattle ? (
        <BattleScreen />
      ) : (
        <>
          <World />
          <LeadHud />
        </>
      )}
      <Dialog />
      {overlay === 'starter' && <StarterPick />}
      {overlay === 'shop' && <Shop />}
      {overlay === 'menu' && <MenuSheet />}
      {overlay === 'ending' && <Ending />}
    </div>
  );
}

export default function HangulMonsterGame() {
  return (
    <Routes>
      <Route index element={<Game />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
