import 'server-only';
import { isSupabaseConfigured } from '@/config/env';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { LearningDataSource } from './data-source';
import { getDemoDataSource } from './demo-data-source';
import { SupabaseDataSource } from './supabase-data-source';

/** Chọn nơi lưu trữ theo cấu hình. Domain service không cần biết đang dùng loại nào. */
export async function getLearningDataSource(): Promise<LearningDataSource> {
  if (!isSupabaseConfigured()) return getDemoDataSource();
  return new SupabaseDataSource(await createServerSupabaseClient(), createAdminSupabaseClient);
}
