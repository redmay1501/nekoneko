'use client';

import { useEffect, useRef } from 'react';

/** Đang gõ chữ (ô nhập, vùng soạn thảo) → Enter thuộc về ô đó, không phải "câu tiếp". */
function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

/** Khay / hộp thoại khác đang mở phía trên (khay chi tiết, bảng chọn…) → Enter không được điều khiển màn phía sau. */
function isOverlayOpen(): boolean {
  return Boolean(document.querySelector('.sheet.on, [role="dialog"][aria-modal="true"]:not(.sheet)'));
}

/**
 * Enter = bấm nút chính ("Câu tiếp theo", "Xem kết quả", "Chơi lại") — CHỈ khi `isEnabled` (đã trả lời xong).
 * Chưa chọn đáp án thì Enter không bỏ qua câu. Bỏ qua khi:
 *  - đang gõ trong ô nhập; đang chọn chữ bằng bộ gõ tiếng Nhật (isComposing / keyCode 229);
 *  - giữ phím (repeat) hoặc có phím bổ trợ; đang mở khay / hộp thoại khác.
 * Mỗi lần bật chỉ chạy MỘT lần (không bấm hai lần khi phím nảy) — tắt rồi bật lại mới chạy tiếp.
 * Listener chỉ gắn khi đang bật và được gỡ khi tắt / rời màn hình.
 */
export function useEnterToContinue(isEnabled: boolean, action: () => void) {
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!isEnabled) return;
    let hasFired = false;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || hasFired) return;
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.isComposing || event.keyCode === 229) return;
      if (isTypingTarget(event.target) || isOverlayOpen()) return;
      // Đang đứng trên một nút / liên kết khác → để trình duyệt bấm đúng nút đó.
      if (event.target instanceof HTMLElement && event.target.closest('button, a[href]') && event.target !== document.body) return;
      event.preventDefault();
      hasFired = true;
      actionRef.current();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);
}
