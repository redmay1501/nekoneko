'use client';

import { useAutoNextPreference } from '@/hooks/useAutoNext';

/** Công tắc "⏩ Tự chuyển câu" dùng chung (trò chơi + mọi màn kiểm tra). Một trạng thái cho cả app, nhớ trên máy này. */
export function AutoNextToggle({ className = '' }: { className?: string }) {
  const [isOn, toggle] = useAutoNextPreference();
  return (
    <button type="button" className={`streak-auto${isOn ? ' is-on' : ''} ${className}`.trim()} role="switch" aria-checked={isOn} onClick={toggle}
      title="Trả lời đúng: tự sang câu tiếp sau 1 giây · trả lời sai: dừng lại để bạn xem đáp án">
      <span className="streak-auto-knob" aria-hidden="true" /> ⏩ Tự chuyển câu
    </button>
  );
}
