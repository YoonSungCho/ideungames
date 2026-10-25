import { useState } from 'react';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Confetti } from '@/shared/ui/Confetti';
import { Modal } from '@/shared/ui/Modal';
import { DEX, ELEM_INFO, movesAt, species, STARTERS, move } from '../data/species';
import { BADGES, ITEMS, type ItemId } from '../data/world';
import { maxHp, xpNeed, type Mon } from '../engine/monster';
import { useHangulMonster } from '../store';
import { HpBar, Q_HINT } from './Battle';
import { MonsterArt } from './MonsterArt';
import styles from './HangulMonster.module.css';

/** 박사님 연구소: 첫 친구 고르기 */
export function StarterPick() {
  const pickStarter = useHangulMonster((s) => s.pickStarter);
  return (
    <Modal open labelledBy="starter-title">
      <div className={styles.sheet}>
        <h2 id="starter-title" className={styles.sheetTitle}>첫 친구를 골라 줘!</h2>
        <div className={styles.starters}>
          {STARTERS.map((id) => {
            const sp = species(id);
            const e = ELEM_INFO[sp.elem];
            return (
              <button key={id} className={styles.starter} style={{ '--c': e.color } as React.CSSProperties} onClick={() => pickStarter(id)} aria-label={`${sp.name} 고르기`}>
                <MonsterArt sp={id} size={96} />
                <b>{sp.name}</b>
                <span className={styles.elemTag} style={{ background: e.color }}>{e.icon} {e.name}</span>
                <small>{move(movesAt(id, 5)[0]).name}: {Q_HINT[move(movesAt(id, 5)[0]).q[0]]}</small>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

export function Shop() {
  const coins = useHangulMonster((s) => s.coins);
  const items = useHangulMonster((s) => s.items);
  const buy = useHangulMonster((s) => s.buy);
  const close = useHangulMonster((s) => s.closeOverlay);
  return (
    <Modal open labelledBy="shop-title" onClose={close}>
      <div className={styles.sheet}>
        <h2 id="shop-title" className={styles.sheetTitle}>🏬 상점</h2>
        <p className={styles.coins} aria-label={`코인 ${coins}개`}>🪙 {coins}</p>
        <div className={styles.shopList}>
          {(Object.keys(ITEMS) as ItemId[]).map((id) => (
            <div key={id} className={styles.shopItem}>
              <span className={styles.shopEmoji}>{ITEMS[id].emoji}</span>
              <span>
                <b>{ITEMS[id].name}</b> <small>가진 것 {items[id]}개</small>
                <br />
                <small>{ITEMS[id].about}</small>
              </span>
              <button className={styles.buyBtn} onClick={() => buy(id)} disabled={coins < ITEMS[id].price} aria-label={`${ITEMS[id].name} 사기`}>
                🪙 {ITEMS[id].price}
              </button>
            </div>
          ))}
        </div>
        <Button onClick={close}>다 샀어요</Button>
      </div>
    </Modal>
  );
}

function MonRow({ m, children }: { m: Mon; children?: React.ReactNode }) {
  const sp = species(m.sp);
  return (
    <div className={styles.monRow}>
      <MonsterArt sp={m.sp} size={56} />
      <div className={styles.monRowInfo}>
        <b>{sp.name} <small>Lv.{m.lv}</small> <span className={styles.elemTag} style={{ background: ELEM_INFO[sp.elem].color }}>{ELEM_INFO[sp.elem].icon} {ELEM_INFO[sp.elem].name}</span></b>
        <HpBar m={m} showNumber />
        <small className={styles.xpText}>다음 레벨까지 {xpNeed(m.lv) - m.xp}</small>
      </div>
      <div className={styles.monRowBtns}>{children}</div>
    </div>
  );
}

type Tab = 'party' | 'bag' | 'dex' | 'badge';

/** 🎒 메뉴: 친구들 · 가방 · 도감 · 배지 */
export function MenuSheet() {
  const s = useHangulMonster();
  const [tab, setTab] = useState<Tab>('party');
  const [restart, setRestart] = useState(false);
  const close = s.closeOverlay;
  const TABS: [Tab, string][] = [['party', '🐾 친구들'], ['bag', '🎒 가방'], ['dex', '📖 도감'], ['badge', '🏅 배지']];

  return (
    <Modal open wide labelledBy="menu-title" onClose={close}>
      <div className={styles.sheet}>
        <h2 id="menu-title" className={styles.srOnly}>메뉴</h2>
        <div className={styles.tabs} role="tablist" aria-label="메뉴">
          {TABS.map(([t, label]) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? styles.tabOn : undefined} onClick={() => setTab(t)}>{label}</button>
          ))}
        </div>

        {tab === 'party' && (
          <div className={styles.tabBody}>
            {s.party.map((m, i) => (
              <MonRow key={m.uid} m={m}>
                {i > 0 && <button className={styles.smallBtn} onClick={() => s.makeLead(m.uid)}>맨 앞으로</button>}
                {s.items.potion > 0 && m.hp < maxHp(m) && <button className={styles.smallBtn} onClick={() => s.usePotionOutside('potion', m.uid)}>🧃 회복</button>}
                {s.party.length > 1 && <button className={styles.smallBtn} onClick={() => s.toBox(m.uid)}>보관함</button>}
              </MonRow>
            ))}
            {!s.party.length && <p className={styles.empty}>아직 친구가 없어요. 연구소 🏫에 가 봐!</p>}
            {s.box.length > 0 && (
              <>
                <h3 className={styles.subTitle}>📦 보관함</h3>
                {s.box.map((m) => (
                  <MonRow key={m.uid} m={m}>
                    <button className={styles.smallBtn} onClick={() => s.fromBox(m.uid)} disabled={s.party.length >= 6}>데려오기</button>
                  </MonRow>
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'bag' && (
          <div className={styles.tabBody}>
            <p className={styles.coins}>🪙 {s.coins}</p>
            {(Object.keys(ITEMS) as ItemId[]).map((id) => (
              <div key={id} className={styles.shopItem}>
                <span className={styles.shopEmoji}>{ITEMS[id].emoji}</span>
                <span><b>{ITEMS[id].name} ×{s.items[id]}</b><br /><small>{ITEMS[id].about}</small></span>
              </div>
            ))}
          </div>
        )}

        {tab === 'dex' && (
          <div className={styles.tabBody}>
            <p className={styles.dexCount}>본 몬스터 <b>{DEX.filter((d) => s.seen.includes(d)).length}</b> · 잡은 몬스터 <b>{DEX.filter((d) => s.caught.includes(d)).length}</b> / {DEX.length}</p>
            <div className={styles.dexGrid}>
              {DEX.map((id, i) => {
                const seen = s.seen.includes(id);
                const caught = s.caught.includes(id);
                const sp = species(id);
                return (
                  <div key={id} className={[styles.dexCell, caught && styles.dexCaught].filter(Boolean).join(' ')} aria-label={seen ? `${sp.name}${caught ? ' 잡음' : ' 봄'}` : '아직 못 봄'}>
                    <small>No.{i + 1}</small>
                    <MonsterArt sp={id} size={60} silhouette={!seen} />
                    <b>{seen ? sp.name : '???'}</b>
                    {caught && <small className={styles.dexAbout}>{sp.about}</small>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'badge' && (
          <div className={styles.tabBody}>
            <div className={styles.badgeRow}>
              {BADGES.map((bd, i) => (
                <div key={bd.name} className={[styles.badge, i < s.badges && styles.badgeOn].filter(Boolean).join(' ')} aria-label={i < s.badges ? bd.name : '아직 없는 배지'}>
                  <span>{i < s.badges ? bd.icon : '❔'}</span>
                  <small>{bd.name}</small>
                </div>
              ))}
            </div>
            {s.champion && <p className={styles.champ}>🏆 한글 몬스터 챔피언!</p>}
            <button className={styles.restartBtn} onClick={() => setRestart(true)}>처음부터 다시 하기</button>
          </div>
        )}

        <Button onClick={close}>닫기</Button>
      </div>
      <ConfirmDialog
        open={restart}
        title="처음부터 다시 할까?"
        message="친구들·배지·도감이 모두 사라져요."
        cancelLabel="계속 모험하기"
        confirmLabel="처음부터 하기"
        onCancel={() => setRestart(false)}
        onConfirm={() => {
          setRestart(false);
          s.newGame();
        }}
      />
    </Modal>
  );
}

/** 엔딩: 챔피언 인증서 */
export function Ending() {
  const close = useHangulMonster((s) => s.closeOverlay);
  const caught = useHangulMonster((s) => s.caught);
  const party = useHangulMonster((s) => s.party);
  const player = useSettings((s) => s.playerName);
  return (
    <>
      <Confetti />
      <Modal open labelledBy="ending-title">
        <div className={styles.sheet}>
          <div className={styles.certificate}>
            <h2 id="ending-title">🏆 한글 몬스터 챔피언</h2>
            <p>
              <b>{player}</b> 트레이너는 배지 4개를 모으고 뒤죽박죽단을 물리쳐 한글 나라를 지켰기에 이 인증서를 드립니다.
            </p>
            <div className={styles.certMons}>
              {party.slice(0, 6).map((m) => <MonsterArt key={m.uid} sp={m.sp} size={52} />)}
            </div>
            <p className={styles.certSmall}>모은 몬스터 {DEX.filter((d) => caught.includes(d)).length}/{DEX.length} · {callName(player)}, 최고야! — 한글 박사</p>
          </div>
          <Button size="lg" onClick={close}>계속 모험하기</Button>
        </div>
      </Modal>
    </>
  );
}
