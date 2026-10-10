'use client';

import { useEffect, useRef } from 'react';
import { useSpeech } from '@/hooks/useSpeech';
import { updateSettings } from '@/features/progress/settings-api';
import type { PublicSessionStep, StepAnswerFeedback } from '@/features/learning/session-types';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

const HAS_KANA = /[぀-ヿ]/;

/**
 * Câu tự đọc của một bước, theo thời điểm:
 *  - thẻ GIỚI THIỆU từ mới: đọc ngay khi hiện (nghe cách phát âm khi đang học);
 *  - câu hỏi: KHÔNG đọc trước (đọc "あ" khi đang hỏi "chữ này đọc là gì?" là lộ đáp án) — trả lời xong mới đọc đáp án.
 * Câu chọn câu đúng (mẫu câu dài) không tự đọc; vẫn có nút 🔊.
 */
export function autoplayTextFor(step: PublicSessionStep, feedback: StepAnswerFeedback | null): string | null {
  if (step.type === 'discover') return feedback ? null : step.card.audioText;
  if (!feedback) return null;
  if (step.type === 'surprise') return step.audioText;
  if (step.type === 'recall') {
    if (step.audioText) return step.audioText;
    return feedback.correctAnswer && HAS_KANA.test(feedback.correctAnswer) ? feedback.correctAnswer : step.face;
  }
  return null;
}

/** Tự phát âm trong phiên học theo cài đặt "Tự phát âm thanh". Chuyển bước thì dừng câu đang đọc (không chồng tiếng). */
export function useSessionAutoplay(step: PublicSessionStep | null, feedback: StepAnswerFeedback | null) {
  const { speak, stop } = useSpeech();
  const autoplayAudio = useSpeechPreferenceStore((store) => store.autoplayAudio);
  const text = step ? autoplayTextFor(step, feedback) : null;
  const spokenRef = useRef<string | null>(null);
  const stepKey = step ? `${step.stepIndex}:${feedback ? 'answered' : 'asking'}` : null;

  useEffect(() => {
    if (!autoplayAudio || !text || !stepKey || spokenRef.current === stepKey) return;
    spokenRef.current = stepKey;
    speak(text);
  }, [autoplayAudio, text, stepKey, speak]);

  useEffect(() => () => stop(), [step?.stepIndex, stop]);
}

/** Nút 🔊 / 🔇 trên đầu phiên học — một chạm bật / tắt tự phát âm, lưu vào Cài đặt. */
export function SessionSoundToggle() {
  const autoplayAudio = useSpeechPreferenceStore((store) => store.autoplayAudio);
  const setAutoplayAudio = useSpeechPreferenceStore((store) => store.setAutoplayAudio);
  const { stop } = useSpeech();
  function toggle() {
    const next = !autoplayAudio;
    setAutoplayAudio(next);
    if (!next) stop();
    updateSettings({ autoplayAudio: next }).catch(() => setAutoplayAudio(!next));
  }
  return (
    <button type="button" className="btn ghost sm session-sound" onClick={toggle} aria-pressed={autoplayAudio}
      aria-label={autoplayAudio ? 'Đang tự phát âm — bấm để tắt' : 'Đang tắt tự phát âm — bấm để bật'}
      title={autoplayAudio ? 'Tắt tự phát âm' : 'Bật tự phát âm'}>
      {autoplayAudio ? '🔊' : '🔇'}
    </button>
  );
}

/** Nhắc khi âm thanh không phát được: máy không có giọng tiếng Nhật, hoặc trình duyệt chặn tự phát. */
export function SessionAudioNotice() {
  const { isSupported, lacksJapaneseVoice } = useSpeech();
  const autoplayAudio = useSpeechPreferenceStore((store) => store.autoplayAudio);
  const isAudioBlocked = useSpeechPreferenceStore((store) => store.isAudioBlocked);
  if (!autoplayAudio) return null;
  if (!isSupported || lacksJapaneseVoice) {
    return (
      <p className="tiny session-audio-note" role="status">
        🔈 Máy này chưa có giọng đọc tiếng Nhật nên chưa phát âm được. Trên iPhone/iPad: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → thêm Tiếng Nhật.
      </p>
    );
  }
  if (isAudioBlocked) {
    return <p className="tiny session-audio-note" role="status">🔈 Trình duyệt đang chặn tự phát âm. Chạm vào màn hình một lần để nghe nhé.</p>;
  }
  return null;
}
