'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LearnerSettings } from '@/lib/data/data-source';
import { DAILY_GOAL_OPTIONS, DEFAULT_REMINDER_TIME } from '@/features/progress/settings-options';
import { type SettingsPatch, updateSettings } from '@/features/progress/settings-api';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';
import { ToggleRow } from './ToggleRow';
import { VoiceSetting } from './VoiceSetting';

/** SC-38 · Cài đặt — lưu ngay khi bấm, hiển thị lỗi thân thiện nếu không lưu được. */
export function SettingsForm({ initialSettings }: { initialSettings: LearnerSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const setVoiceGender = useSpeechPreferenceStore((store) => store.setVoiceGender);
  const setAutoplayAudio = useSpeechPreferenceStore((store) => store.setAutoplayAudio);
  const mutation = useMutation({
    mutationFn: updateSettings,
    // Lạc quan: chấm radio / công tắc đổi NGAY khi bấm (trước đây chờ server → tưởng bấm không ăn); lỗi thì trả về như cũ.
    onMutate: (patch: SettingsPatch) => {
      const previous = settings;
      const { reminderEnabled, ...rest } = patch;
      setSettings((current) => ({
        ...current,
        ...rest,
        ...(reminderEnabled === undefined ? {} : { reminderTime: reminderEnabled ? DEFAULT_REMINDER_TIME : null }),
      }));
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context) setSettings(context.previous);
    },
    onSuccess: (saved) => {
      setSettings(saved);
      // Mọi nút 🔊 trong app đọc bằng giọng mới ngay, không cần tải lại trang.
      setVoiceGender(saved.voiceGender);
      setAutoplayAudio(saved.autoplayAudio);
      // Phút trên khung và trang chủ lấy từ server — cache 30 giây cần làm mới sau khi lưu.
      router.refresh();
    },
  });
  const save = (patch: SettingsPatch) => mutation.mutate(patch);
  const reminderLabel = settings.reminderTime ? `${settings.reminderTime.slice(0, 5)} mỗi tối` : 'Đang tắt';

  return (
    <>
      <div className="stack mt-3.5">
        <ToggleRow title="Nhắc học mỗi ngày" description={reminderLabel} isOn={Boolean(settings.reminderTime)} isDisabled={mutation.isPending}
          onToggle={() => save({ reminderEnabled: !settings.reminderTime })} />
        <ToggleRow title="Tự phát âm thanh" description="Đọc từ mới và đáp án trong phiên học, khi mở thẻ kiến thức" isOn={settings.autoplayAudio} isDisabled={mutation.isPending}
          onToggle={() => save({ autoplayAudio: !settings.autoplayAudio })} />
        <ToggleRow title="Hiện cách đọc phía trên chữ Hán" description="Với chữ bạn chưa thuộc" isOn={settings.showFurigana} isDisabled={mutation.isPending}
          onToggle={() => save({ showFurigana: !settings.showFurigana })} />
        <ToggleRow title="Chế độ nhẹ nhàng" description="Không đếm chuỗi ngày, không nhắc nhiều" isOn={settings.gentleMode} isDisabled={mutation.isPending}
          onToggle={() => save({ gentleMode: !settings.gentleMode })} />
      </div>
      <div className="card tight mt-3.5">
        <fieldset className="radio-group" disabled={mutation.isPending} aria-busy={mutation.isPending}>
          <legend className="sm">Mục tiêu mỗi ngày</legend>
          {DAILY_GOAL_OPTIONS.map((option) => (
            <label key={option.minutes}>
              <input type="radio" name="daily-goal" checked={settings.dailyMinutes === option.minutes}
                onChange={() => save({ dailyMinutes: option.minutes })} />
              {option.label}
            </label>
          ))}
        </fieldset>
        <p className="tiny muted mt-2">Đây là bài ngắn mỗi ngày. Học thêm bao nhiêu là tuỳ bạn.</p>
      </div>
      <VoiceSetting voiceGender={settings.voiceGender} isDisabled={mutation.isPending} onChange={(voiceGender) => save({ voiceGender })} />
      {mutation.isError ? <p className="sm center mt-3" role="alert">{mutation.error.message}</p> : null}
    </>
  );
}
