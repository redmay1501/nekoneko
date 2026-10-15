/**
 * Cấp hoặc gỡ quyền admin cho MỘT tài khoản đã có (bảng app_roles, role 'admin').
 *
 *   npm run admin:grant -- <email>            cấp quyền
 *   npm run admin:grant -- <email> --revoke   gỡ quyền
 *
 * - Email đưa vào lúc chạy — không viết cứng trong mã.
 * - Chỉ chạy ở máy dev (cần SUPABASE_SERVICE_ROLE_KEY); người dùng không tự cấp quyền được vì app_roles không có policy ghi.
 * - Không in khoá hay token.
 */
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv, requireEnv } from './load-env';

async function main() {
  loadLocalEnv();
  const [email, flag] = process.argv.slice(2);
  if (!email || !email.includes('@')) {
    console.error('Cách dùng: npm run admin:grant -- <email> [--revoke]');
    process.exit(1);
  }
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const wanted = email.trim().toLowerCase();
  let userId: string | null = null;
  for (let page = 1; page <= 50 && !userId; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`đọc danh sách tài khoản: ${error.message}`);
    userId = data.users.find((user) => user.email?.toLowerCase() === wanted)?.id ?? null;
    if (data.users.length < 200) break;
  }
  if (!userId) {
    console.error(`✗ Không có tài khoản nào với email ${wanted}. Người đó cần đăng ký trước.`);
    process.exit(1);
  }

  const result = flag === '--revoke'
    ? await supabase.from('app_roles').delete().eq('user_id', userId).eq('role', 'admin')
    : await supabase.from('app_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
  if (result.error) throw new Error(`ghi app_roles: ${result.error.message}`);

  const { data: roles } = await supabase.from('app_roles').select('role').eq('user_id', userId);
  console.log(`✓ ${wanted}: vai trò hiện tại = ${(roles ?? []).map((row) => row.role).join(', ') || '(không có)'}`);
}

main().catch((error: unknown) => {
  console.error('✗ Không cập nhật được quyền admin', error instanceof Error ? error.message : error);
  process.exit(1);
});
