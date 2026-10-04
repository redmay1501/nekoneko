'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { LearnerSettings } from '@/lib/data/data-source';
import { DAILY_GOAL_OPTIONS } from '@/features/progress/settings-options';
import { type SettingsPatch, updateSettings } from '@/features/progress/settings-api';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';
import { ToggleRow } from './ToggleRow';
import { VoiceSetting } from './VoiceSetting';

/** SC-38 · Cài đặt — lưu ngay khi bấm, hiển thị lỗi thân thiện nếu không lưu được. */
export function SettingsForm({ initialSettings }: { initialSettings: LearnerSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const setVoiceGender = useSpeechPreferenceStore((store) => store.setVoiceGender);
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (saved) => {
      setSettings(saved);
      // Mọi nút 🔊 trong app đọc bằng giọng mới ngay, không cần tải lại trang.
      setVoiceGender(saved.voiceGender);
    },
  });
  const save = (patch: SettingsPatch) => mutation.mutate(patch);
  const reminderLabel = settings.reminderTime ? `${settings.reminderTime.slice(0, 5)} mỗi tối` : 'Đang tắt';

  return (
    <>
      <div className="stack mt-3.5">
        <ToggleRow title="Nhắc học mỗi ngày" description={reminderLabel} isOn={Boolean(settings.reminderTime)} isDisabled={mutation.isPending}
          onToggle={() => save({ reminderEnabled: !settings.reminderTime })} />
        <ToggleRow title="Tự phát âm thanh" description="Khi mở thẻ kiến thức" isOn={settings.autoplayAudio} isDisabled={mutation.isPending}
          onToggle={() => save({ autoplayAudio: !settings.autoplayAudio })} />
        <ToggleRow title="Hiện furigana" description="Trên mọi Kanji chưa thành thạo" isOn={settings.showFurigana} isDisabled={mutation.isPending}
          onToggle={() => save({ showFurigana: !settings.showFurigana })} />
        <ToggleRow title="Chế độ nhẹ nhàng" description="Không đếm chuỗi ngày, không nhắc nhiều" isOn={settings.gentleMode} isDisabled={mutation.isPending}
          onToggle={() => save({ gentleMode: !settings.gentleMode })} />
      </div>
      <div className="card tight mt-3.5">
        <b className="sm">Mục tiêu mỗi ngày</b>
        <div className="row wrap mt-2" style={{ gap: 7 }} role="radiogroup" aria-label="Mục tiêu mỗi ngày">
          {DAILY_GOAL_OPTIONS.map((option) => {
            const isSelected = settings.dailyMinutes === option.minutes;
            return (
              <button key={option.minutes} type="button" role="radio" aria-checked={isSelected} disabled={mutation.isPending}
                className={`chip ${isSelected ? 'pink' : ''}`} onClick={() => save({ dailyMinutes: option.minutes })}>
                {option.label}{isSelected ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
        <p className="tiny muted mt-2">Mức tối thiểu được dẫn dắt. Học thêm bao nhiêu là tuỳ bạn.</p>
      </div>
      <VoiceSetting voiceGender={settings.voiceGender} isDisabled={mutation.isPending} onChange={(voiceGender) => save({ voiceGender })} />
      {mutation.isError ? <p className="sm center mt-3" role="alert">{mutation.error.message}</p> : null}
    </>
  );
}
