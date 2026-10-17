'use client';

import { useSpeech } from '@/hooks/useSpeech';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

/**
 * Cụm nghe của bài nghe: nút loa lớn ở giữa (bấm = phát, bấm lại = DỪNG), "Nghe chậm" (≈0.75× — đổi thật tốc độ giọng đọc)
 * và "Nghe lại" (luôn phát lại từ đầu ở tốc độ thường). Giọng đọc là Web Speech API của trình duyệt — không có tạm dừng
 * đáng tin trên mọi máy, nên chỉ có Dừng / Phát lại.
 */
export function ListenControls({ text, label = 'Nghe câu hỏi' }: { text: string; label?: string }) {
  const { toggle, speak, isSupported, lacksJapaneseVoice } = useSpeech();
  const isSpeakingNormal = useSpeechPreferenceStore((store) => store.speakingText === text && !store.isSpeakingSlow);
  const isSpeakingSlow = useSpeechPreferenceStore((store) => store.speakingText === text && store.isSpeakingSlow);
  const unavailable = !isSupported || lacksJapaneseVoice;
  return (
    <div className="listen-stage">
      <button type="button" className={`listen-main${isSpeakingNormal ? ' is-speaking' : ''}`} onClick={() => toggle(text)}
        aria-label={isSpeakingNormal ? 'Dừng đọc' : label} aria-pressed={isSpeakingNormal}>
        {isSpeakingNormal ? <StopIcon /> : <SpeakerIcon />}
      </button>
      <div className="listen-side">
        <button type="button" className={`listen-chip${isSpeakingSlow ? ' is-speaking' : ''}`} onClick={() => toggle(text, { slow: true })}
          aria-pressed={isSpeakingSlow} aria-label={isSpeakingSlow ? 'Dừng nghe chậm' : 'Nghe chậm'}>
          🐢 {isSpeakingSlow ? 'Dừng' : 'Nghe chậm'}
        </button>
        <button type="button" className="listen-chip" onClick={() => speak(text)} aria-label="Nghe lại từ đầu">↻ Nghe lại</button>
      </div>
      {unavailable ? <p className="tiny muted">Máy này chưa có giọng đọc tiếng Nhật — vào Cài đặt › Giọng đọc để xem cách thêm.</p> : null}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" fillOpacity=".18" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}
function StopIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" /></svg>;
}
