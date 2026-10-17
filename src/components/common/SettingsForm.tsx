'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { LearnerSettings } from '@/lib/data/data-source';
import { DAILY_GOAL_OPTIONS, DEFAULT_REMINDER_TIME } from '@/features/progress/settings-options';
import { type SettingsPatch, updateSettings } from '@/features/progress/settings-api';
import { useSpeechPreferenceStore } from '@/stores/speech-preference-store';
import { SegmentedChoice } from './SegmentedChoice';
import { ToggleRow } from './ToggleRow';
import { VoiceSetting } from './VoiceSetting';

/** SC-38 · Cài đặt — lưu ngay khi bấm, hiển thị lỗi thân thiện nếu không lưu được. */
export function SettingsForm({ initialSettings }: { initialSettings: LearnerSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const setVoiceGender = useSpeechPreferenceStore((store) => store.setVoiceGender);
  const setAutoplayAudio = useSpeechPreferenceStore((store) => store.setAutoplayAudio);
  /** Lần lưu mới nhất — chỉ kết quả của lần này được hiện ra (bấm đổi liên tiếp, phản hồi về lệch thứ tự không đè lựa chọn mới). */
  const latestRequest = useRef(0);
  const mutation = useMutation({
    mutationFn: updateSettings,
    // Lạc quan: lựa chọn / công tắc đổi NGAY khi bấm; lỗi thì trả về như trước lần bấm đó.
    onMutate: (patch: SettingsPatch) => {
      const previous = settings;
      const requestId = ++latestRequest.current;
      const { reminderEnabled, ...rest } = patch;
      setSettings((current) => ({
        ...current,
        ...rest,
        ...(reminderEnabled === undefined ? {} : { reminderTime: reminderEnabled ? DEFAULT_REMINDER_TIME : null }),
      }));
      return { previous, requestId };
    },
    onError: (_error, _patch, context) => {
      if (context && context.requestId === latestRequest.current) setSettings(context.previous);
    },
    onSuccess: (saved, _patch, context) => {
      if (context?.requestId !== latestRequest.current) return; // đã có lần bấm mới hơn
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
        <ToggleRow title="Nhắc học mỗi ngày" description={reminderLabel} isOn={Boolean(settings.reminderTime)} 
          onToggle={() => save({ reminderEnabled: !settings.reminderTime })} />
        <ToggleRow title="Tự phát âm thanh" description="Đọc từ mới và đáp án trong phiên học, khi mở thẻ kiến thức" isOn={settings.autoplayAudio} 
          onToggle={() => save({ autoplayAudio: !settings.autoplayAudio })} />
        <ToggleRow title="Hiện cách đọc phía trên chữ Hán" description="Với chữ bạn chưa thuộc" isOn={settings.showFurigana} 
          onToggle={() => save({ showFurigana: !settings.showFurigana })} />
        <ToggleRow title="Chế độ nhẹ nhàng" description="Không đếm chuỗi ngày, không nhắc nhiều" isOn={settings.gentleMode} 
          onToggle={() => save({ gentleMode: !settings.gentleMode })} />
      </div>
      <div className="card tight mt-3.5">
        <div className="between"><b className="sm">Mục tiêu mỗi ngày</b><SaveStatus isPending={mutation.isPending} /></div>
        <div className="mt-2">
          <SegmentedChoice label="Mục tiêu mỗi ngày" value={settings.dailyMinutes}
            options={DAILY_GOAL_OPTIONS.map((option) => ({ value: option.minutes, label: option.label }))}
            onChange={(dailyMinutes) => save({ dailyMinutes })} />
        </div>
        <p className="tiny muted mt-2">Đây là bài ngắn mỗi ngày. Học thêm bao nhiêu là tuỳ bạn.</p>
      </div>
      <VoiceSetting voiceGender={settings.voiceGender} onChange={(voiceGender) => save({ voiceGender })} />
      {mutation.isError ? <p className="sm center mt-3" role="alert">{mutation.error.message}</p> : null}
    </>
  );
}

/** "Đang lưu…" nhỏ cạnh tiêu đề — không khoá lựa chọn trong lúc lưu. */
function SaveStatus({ isPending }: { isPending: boolean }) {
  return <span className="tiny muted" role="status" aria-live="polite">{isPending ? 'Đang lưu…' : ''}</span>;
}
