'use client';

import { createContext, type ReactNode, useContext } from 'react';

/**
 * Người dùng có vai trò admin không (server đã kiểm tra ở layout) — chỉ để hiện lối vào /admin trong điều hướng.
 * Bảo vệ thật nằm ở server: mọi trang /admin và API /api/admin/* tự kiểm tra lại quyền.
 */
const AdminFlagContext = createContext(false);

export function AdminFlagProvider({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  return <AdminFlagContext.Provider value={isAdmin}>{children}</AdminFlagContext.Provider>;
}

export function useIsAdmin(): boolean {
  return useContext(AdminFlagContext);
}
