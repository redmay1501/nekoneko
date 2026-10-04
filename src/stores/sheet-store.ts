'use client';

import { create } from 'zustand';

/**
 * Khay trượt đang mở — trạng thái dùng chung toàn app (mở từ thanh trên, thanh dưới,
 * bất kỳ thẻ kiến thức nào). Đây là trạng thái duy nhất thật sự cần Zustand.
 */
export type ActiveSheet =
  | { kind: 'none' }
  | { kind: 'modes' }
  | { kind: 'navigation' }
  | { kind: 'knowledge'; contentKey: string }
  | { kind: 'search'; query: string };

interface SheetStore {
  activeSheet: ActiveSheet;
  openModes: () => void;
  openNavigation: () => void;
  openKnowledge: (contentKey: string) => void;
  openSearch: (query: string) => void;
  close: () => void;
}

export const useSheetStore = create<SheetStore>((set) => ({
  activeSheet: { kind: 'none' },
  openModes: () => set({ activeSheet: { kind: 'modes' } }),
  openNavigation: () => set({ activeSheet: { kind: 'navigation' } }),
  openKnowledge: (contentKey) => set({ activeSheet: { kind: 'knowledge', contentKey } }),
  openSearch: (query) => set({ activeSheet: { kind: 'search', query } }),
  close: () => set({ activeSheet: { kind: 'none' } }),
}));
