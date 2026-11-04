'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { installSpeechUnlock, stopSpeech } from '@/hooks/useSpeech';
import { type VoiceGender, pickJapaneseVoice } from '@/lib/speech/japanese-voices';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';

/**
 * Đưa thiết lập âm thanh đã lưu (user_settings) vào store dùng chung cho mọi nút 🔊 và phần tự phát âm,
 * mở khoá giọng đọc ở lần chạm đầu tiên và dừng giọng đọc khi đổi trang. Hiện thông báo nhỏ khi không phát được âm thanh.
 */
export function SpeechPreferenceSync({ voiceGender, autoplayAudio }: { voiceGender: VoiceGender; autoplayAudio: boolean }) {
  const setVoiceGender = useSpeechPreferenceStore((store) => store.setVoiceGender);
  const setAutoplayAudio = useSpeechPreferenceStore((store) => store.setAutoplayAudio);
  useEffect(() => setVoiceGender(voiceGender), [voiceGender, setVoiceGender]);
  useEffect(() => setAutoplayAudio(autoplayAudio), [autoplayAudio, setAutoplayAudio]);
  // Đổi trang → dừng câu đang đọc dở (không để tiếng của trang cũ đọc tiếp, không chồng tiếng với trang mới).
  const pathname = usePathname();
  useEffect(() => stopSpeech, [pathname]);
  useEffect(() => installSpeechUnlock(() =>
    pickJapaneseVoice(window.speechSynthesis.getVoices(), useSpeechPreferenceStore.getState().voiceGender)?.voice ?? null), []);
  return <SpeechErrorToast />;
}

/**
 * Bấm 🔊 mà không phát được → nói rõ lý do và cách sửa (thay vì im lặng). Tự ẩn sau 9 giây; bấm × để đóng.
 *  - no-voice: máy không có giọng tiếng Nhật (thường gặp: Chrome trên Windows chưa cài giọng Nhật).
 *  - failed: có giọng nhưng không đọc được (giọng online của Chrome bị mạng / tường lửa chặn, dịch vụ lỗi).
 */
function SpeechErrorToast() {
  const speechError = useSpeechPreferenceStore((store) => store.speechError);
  const setSpeechError = useSpeechPreferenceStore((store) => store.setSpeechError);
  useEffect(() => {
    if (!speechError) return;
    const timer = window.setTimeout(() => setSpeechError(null), 9000);
    return () => window.clearTimeout(timer);
  }, [speechError, setSpeechError]);
  if (!speechError) return null;
  const isEdge = typeof navigator !== 'undefined' && /Edg\//.test(navigator.userAgent);
  const isWindows = typeof navigator !== 'undefined' && /Windows/.test(navigator.userAgent);
  return (
    <div className="speech-toast" role="alert">
      <b>🔇 {speechError === 'no-voice' ? 'Máy này chưa có giọng đọc tiếng Nhật' : 'Chưa phát được âm thanh'}</b>
      <p>
        {speechError === 'no-voice'
          ? (isWindows
            ? 'Windows: Cài đặt → Thời gian & ngôn ngữ → Giọng nói → Thêm giọng → Tiếng Nhật, rồi tải lại trang. Hoặc mở NekoNeko bằng Microsoft Edge (có sẵn giọng tiếng Nhật online).'
            : 'Hãy cài giọng đọc tiếng Nhật cho hệ điều hành, hoặc dùng Chrome / Edge / Safari bản mới.')
          : (isEdge
            ? 'Giọng đọc không phản hồi. Kiểm tra loa / âm lượng của máy và kết nối mạng rồi bấm nghe lại.'
            : 'Giọng đọc online của trình duyệt có thể bị mạng chặn. Kiểm tra loa, kết nối mạng; hoặc cài giọng tiếng Nhật cho máy / dùng Microsoft Edge.')}
      </p>
      <Link className="tiny" href="/cai-dat" onClick={() => setSpeechError(null)}>Cài đặt giọng đọc →</Link>
      <button type="button" className="speech-toast-close" onClick={() => setSpeechError(null)} aria-label="Đóng">×</button>
    </div>
  );
}
