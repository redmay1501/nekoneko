import 'server-only';
import { cache } from 'react';
import { isSupabaseConfigured } from '@/config/env';
import { decideDemoAccess } from '@/features/admin/admin-access';
import { DEMO_LEARNER } from '@/config/demo';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentLearner } from './current-learner';

/**
 * Người đang đăng nhập có vai trò admin không — CHỈ để quyết định hiện mục "Quản trị nội dung" trong menu.
 * Đọc app_roles bằng phiên của chính người dùng (RLS: chỉ đọc được dòng của mình), không cần service role.
 * Bảo vệ thật nằm ở admin-guard.ts (mọi trang /admin và API /api/admin/* tự kiểm tra lại ở server).
 */
export const isCurrentUserAdmin = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return decideDemoAccess(process.env.NODE_ENV, DEMO_LEARNER.userId).kind === 'admin';
  const learner = await getCurrentLearner();
  if (!learner) return false;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('app_roles').select('role').eq('user_id', learner.userId).eq('role', 'admin').maybeSingle();
  return !error && Boolean(data);
});
