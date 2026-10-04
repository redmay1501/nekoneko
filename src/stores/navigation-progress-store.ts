'use client';

import { create } from 'zustand';

/**
 * Thanh tiến trình chuyển trang. Bấm link được NavigationProgress tự bắt;
 * nơi nào chuyển trang bằng router.push/replace thì gọi startNavigation() trước.
 * Thanh tự tắt khi đường dẫn đổi (NavigationProgress theo dõi).
 */
interface NavigationProgressStore {
  isNavigating: boolean;
  startNavigation: () => void;
  finishNavigation: () => void;
}

export const useNavigationProgressStore = create<NavigationProgressStore>((set) => ({
  isNavigating: false,
  startNavigation: () => set({ isNavigating: true }),
  finishNavigation: () => set({ isNavigating: false }),
}));

export const startNavigation = () => useNavigationProgressStore.getState().startNavigation();
