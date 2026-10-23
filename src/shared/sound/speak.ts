import { useEffect, useState } from 'react';
import { useSettings } from '../settings/store';

/**
 * 기기의 한국어 음성(TTS)으로 읽어 준다. 소리 설정이 꺼져 있거나 지원하지 않으면 조용히 넘어간다.
 * 아이용으로 조금 느리고 밝게.
 */
let koVoice: SpeechSynthesisVoice | null | undefined;

function voice() {
  if (koVoice !== undefined && koVoice !== null) return koVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  koVoice = voices.find((v) => v.lang === 'ko-KR') ?? voices.find((v) => v.lang.startsWith('ko')) ?? null;
  return koVoice;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    koVoice = undefined;
  });
}

/** 한국어로 소리 내어 읽을 수 있는가 (음성 있음 + 소리 켜짐). 음성 목록은 늦게 오기도 해서 훅으로 따라간다 */
export function useCanSpeakKorean() {
  const sound = useSettings((s) => s.sound);
  const [ready, setReady] = useState(() => canSpeak() && !!voice());
  useEffect(() => {
    if (!canSpeak()) return;
    const update = () => {
      koVoice = undefined;
      setReady(!!voice());
    };
    update();
    window.speechSynthesis.addEventListener?.('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', update);
  }, []);
  return sound && ready;
}

export function canSpeak() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (!useSettings.getState().sound || !canSpeak()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    const v = voice();
    if (v) u.voice = v;
    u.rate = opts.rate ?? 0.9;
    u.pitch = opts.pitch ?? 1.1;
    synth.speak(u);
  } catch {
    // 일부 브라우저는 사용자 동작 없이 말하기를 막는다 — 무시
  }
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
