import 'server-only';
import { cache } from 'react';
import { DEMO_LEARNER } from '@/config/demo';
import { isSupabaseConfigured } from '@/config/env';
import { UnauthenticatedError } from '@/lib/api/errors';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface CurrentLearner {
  userId: string;
  email: string | null;
  isDemo: boolean;
}

/**
 * Người học đang dùng app.
 *  - Chế độ demo: luôn là người học mẫu.
 *  - Supabase: người đã đăng nhập. Không tin cookie suông: getClaims kiểm chữ ký JWT bằng khoá công khai của
 *    dự án (không cần gọi mạng); dự án dùng khoá đối xứng cũ thì thư viện tự quay về getUser (gọi Supabase Auth).
 * Kết quả được cache trong phạm vi một request.
 */
export const getCurrentLearner = cache(async (): Promise<CurrentLearner | null> => {
  if (!isSupabaseConfigured()) return { userId: DEMO_LEARNER.userId, email: null, isDemo: true };
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return claims?.sub ? { userId: claims.sub, email: typeof claims.email === 'string' ? claims.email : null, isDemo: false } : null;
});

export async function requireCurrentLearner(): Promise<CurrentLearner> {
  const learner = await getCurrentLearner();
  if (!learner) throw new UnauthenticatedError();
  return learner;
}
