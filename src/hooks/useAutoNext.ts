'use client';

import { useEffect, useRef } from 'react';
import { create } from 'zustand';

/**
 * "Tự chuyển câu" — MỘT cơ chế cho mọi màn kiểm tra / luyện tập, tách ra từ trò chơi Neko Streak (giữ đúng hành vi):
 *  - BẬT mặc định; tắt thì nhớ trên máy này (localStorage, cùng khoá trò chơi đang dùng → một công tắc cho cả app);
 *  - trả lời ĐÚNG: thấy kết quả AUTO_NEXT_AFTER_CORRECT_MS rồi tự sang câu;
 *  - trả lời SAI: KHÔNG tự chuyển — người học đọc đáp án / giải thích rồi tự bấm;
 *  - chỉ chuyển khi câu trả lời đã được ghi nhận (`isReady`): đang lưu / lưu lỗi thì đứng lại;
 *  - bấm "Câu tiếp" / tắt công tắc / đổi câu → huỷ hẹn giờ.
 */
export const AUTO_NEXT_STORAGE_KEY = 'neko-streak-auto-next';
export const AUTO_NEXT_AFTER_CORRECT_MS = 1000;

interface AutoNextStore {
  isOn: boolean;
  isLoaded: boolean;
  load: () => void;
  toggle: () => void;
}

export const useAutoNextStore = create<AutoNextStore>((set, get) => ({
  isOn: true,
  isLoaded: false,
  load: () => {
    if (get().isLoaded) return;
    let isOn = true;
    try { isOn = localStorage.getItem(AUTO_NEXT_STORAGE_KEY) !== '0'; } catch { /* chế độ riêng tư */ }
    set({ isOn, isLoaded: true });
  },
  toggle: () => {
    const isOn = !get().isOn;
    try { localStorage.setItem(AUTO_NEXT_STORAGE_KEY, isOn ? '1' : '0'); } catch { /* chế độ riêng tư */ }
    set({ isOn });
  },
}));

/** Công tắc đang bật? (đọc localStorage sau khi gắn vào trang — HTML server luôn là "bật"). */
export function useAutoNextPreference(): [boolean, () => void] {
  const isOn = useAutoNextStore((store) => store.isOn);
  const toggle = useAutoNextStore((store) => store.toggle);
  const load = useAutoNextStore((store) => store.load);
  useEffect(() => load(), [load]);
  return [isOn, toggle];
}

/**
 * Có hẹn tự chuyển câu không: đã trả lời, trả lời ĐÚNG, công tắc bật, câu trả lời đã được ghi nhận.
 * Trả lời sai / đang lưu / lưu lỗi / chưa trả lời → không (người học tự bấm).
 */
export function isAutoAdvancePending(input: { answerKey: string | null; isCorrect: boolean | null | undefined; isOn: boolean; isReady: boolean }): boolean {
  return Boolean(input.answerKey) && input.isCorrect === true && input.isOn && input.isReady;
}

/**
 * Hẹn giờ tự sang câu. `answerKey` đổi (câu mới / lần trả lời mới) thì hẹn lại; trả về true khi đang chờ tự chuyển
 * (để nút "Câu tiếp" hiện thanh chạy).
 */
export function useAutoAdvance({ answerKey, isCorrect, isReady = true, onNext, extraDelayMs = 0 }: {
  /** Khoá của lần trả lời đang hiện; null = chưa trả lời. */
  answerKey: string | null;
  isCorrect: boolean | null | undefined;
  /** Câu trả lời đã được ghi nhận (đã lưu xong / không cần lưu). */
  isReady?: boolean;
  onNext: () => void;
  extraDelayMs?: number;
}): boolean {
  const [isOn] = useAutoNextPreference();
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const isPending = isAutoAdvancePending({ answerKey, isCorrect, isOn, isReady });
  useEffect(() => {
    if (!isPending) return;
    const timer = window.setTimeout(() => onNextRef.current(), AUTO_NEXT_AFTER_CORRECT_MS + extraDelayMs);
    return () => window.clearTimeout(timer);
  }, [isPending, answerKey, extraDelayMs]);
  return isPending;
}
