import { useSettings, type PlayMode } from '@/shared/settings/store';
import { STORAGE_PREFIX, storageKey } from '@/shared/storage';
import { Button } from '@/shared/ui/Button';
import { Header } from './Header';
import styles from './pages.module.css';

const MODES: { id: PlayMode; title: string; desc: string }[] = [
  { id: 'easy', title: '🌱 쉬운 모드', desc: '시간·실수 표시 없이, 힌트 무제한. 어린 친구에게 추천!' },
  { id: 'challenge', title: '🏆 도전 모드', desc: '타이머, 실수 횟수, 최고 기록. 힌트는 3번까지.' },
];

export function SettingsPage() {
  const { playerName, mode, sound, setPlayerName, setMode, setSound } = useSettings();

  return (
    <div className={styles.page}>
      <Header title="설정" back right={<span className={styles.iconSpacer} />} />
      <main className={styles.settings}>
        <section>
          <h2>플레이어 이름</h2>
          <input
            className={styles.input}
            value={playerName}
            maxLength={10}
            onChange={(e) => setPlayerName(e.target.value)}
            onBlur={(e) => !e.target.value.trim() && setPlayerName('이든')}
          />
        </section>

        <section>
          <h2>게임 모드</h2>
          <div className={styles.modeList}>
            {MODES.map((m) => (
              <button key={m.id} className={[styles.mode, mode === m.id && styles.modeOn].filter(Boolean).join(' ')} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}>
                <b>{m.title}</b>
                <span>{m.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>소리</h2>
          <label className={styles.switchRow}>
            <span>효과음</span>
            <input type="checkbox" className={styles.switch} checked={sound} onChange={(e) => setSound(e.target.checked)} />
          </label>
        </section>

        <section>
          <h2>기록</h2>
          <Button
            variant="secondary"
            onClick={() => {
              if (!confirm('모든 게임 기록과 진행 중인 게임을 지울까요?')) return;
              // 설정은 남기고 게임 데이터(ideun.<gameId>)만 삭제
              Object.keys(localStorage)
                .filter((k) => k.startsWith(`${STORAGE_PREFIX}.`) && k !== storageKey('settings'))
                .forEach((k) => localStorage.removeItem(k));
              location.reload();
            }}
          >
            게임 기록 모두 지우기
          </Button>
        </section>
      </main>
    </div>
  );
}
