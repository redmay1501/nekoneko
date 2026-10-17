'use client';

import { useSpeech } from '@/hooks/useSpeech';
import type { VoiceGender } from '@/lib/speech/japanese-voices';
import { EmojiIcon } from './EmojiIcon';
import { SegmentedChoice } from './SegmentedChoice';

const VOICE_OPTIONS: { gender: VoiceGender; emoji: string; label: string }[] = [
  { gender: 'female', emoji: '👩', label: 'Giọng nữ' },
  { gender: 'male', emoji: '👨', label: 'Giọng nam' },
];
const SAMPLE_TEXT = 'こんにちは。わたしは のこです。';
const GENDER_LABEL: Record<VoiceGender, string> = { female: 'nữ', male: 'nam' };

interface VoiceSettingProps {
  voiceGender: VoiceGender;
  onChange: (voiceGender: VoiceGender) => void;
}

/**
 * Cài đặt giọng đọc tiếng Nhật: chọn nam/nữ, nghe thử, và nói rõ máy đang dùng giọng nào.
 * Giọng là của máy người học (Web Speech API) — máy thiếu giọng thì hướng dẫn cách thêm.
 */
export function VoiceSetting({ voiceGender, onChange }: VoiceSettingProps) {
  const { speak, isSupported, voiceChoice, hasVoiceList } = useSpeech();

  return (
    <div className="card tight mt-3.5">
      <div className="between">
        <b className="sm">Giọng đọc tiếng Nhật</b>
        <button type="button" className="btn ghost sm" onClick={() => speak(SAMPLE_TEXT)} disabled={!isSupported}><EmojiIcon emoji="🔊" size={18} /> Nghe thử</button>
      </div>
      <div className="mt-2">
        <SegmentedChoice label="Giọng đọc tiếng Nhật" value={voiceGender} onChange={onChange}
          options={VOICE_OPTIONS.map((option) => ({ value: option.gender, label: <><EmojiIcon emoji={option.emoji} size={18} /> {option.label}</> }))} />
      </div>
      <VoiceStatus isSupported={isSupported} hasVoiceList={hasVoiceList} voiceGender={voiceGender}
        voiceName={voiceChoice?.voice.name ?? null} matchesPreference={voiceChoice?.matchesPreference ?? false} />
    </div>
  );
}

interface VoiceStatusProps {
  isSupported: boolean;
  hasVoiceList: boolean;
  voiceGender: VoiceGender;
  voiceName: string | null;
  matchesPreference: boolean;
}

function VoiceStatus({ isSupported, hasVoiceList, voiceGender, voiceName, matchesPreference }: VoiceStatusProps) {
  if (!isSupported) return <p className="tiny muted mt-2">Trình duyệt này chưa hỗ trợ phát âm. Bạn thử Chrome, Edge hoặc Safari nhé.</p>;
  if (!hasVoiceList) return <p className="tiny muted mt-2">Đang tìm giọng đọc trên máy…</p>;
  if (!voiceName) {
    return (
      <div className="tiny mt-2" role="status">
        <b>Máy này chưa có giọng tiếng Nhật.</b> <AddVoiceHint />
      </div>
    );
  }
  return (
    <div className="tiny mt-2" role="status">
      <span className="muted">Đang dùng: <b>{voiceName}</b></span>
      {matchesPreference ? null : (
        <p className="mt-1">Máy này chưa có giọng {GENDER_LABEL[voiceGender]} tiếng Nhật nên đang dùng giọng khác. <AddVoiceHint /></p>
      )}
    </div>
  );
}

/** Nơi thêm giọng tiếng Nhật trên các hệ điều hành phổ biến. */
function AddVoiceHint() {
  return (
    <span className="muted">
      Cách thêm: <b>Edge</b> có sẵn giọng Microsoft Natural (Nanami nữ, Keita nam) · <b>Mac/iPhone</b>: Cài đặt → Trợ năng →
      Nội dung được đọc → Giọng nói → Tiếng Nhật (Kyoko nữ, Otoya nam) · <b>Windows</b>: Cài đặt → Thời gian &amp; ngôn ngữ →
      Giọng nói → Thêm giọng → Tiếng Nhật. Thêm xong, tải lại trang.
    </span>
  );
}
