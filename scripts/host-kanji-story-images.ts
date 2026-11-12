/**
 * Sao ảnh minh hoạ của câu chuyện Kanji về Supabase Storage của app — để app không phụ thuộc CDN Pixabay / Wikimedia
 * (ảnh bị gỡ hay đổi URL thì bài học vẫn có ảnh). Chạy lại vẫn an toàn.
 *
 *   npx tsx scripts/host-kanji-story-images.ts --dry-run          # chỉ tải + chuyển WebP vào thư mục tạm, không đụng Supabase
 *   npx tsx scripts/host-kanji-story-images.ts --dry-run --limit 3
 *   npx tsx scripts/host-kanji-story-images.ts                    # tải lên + ghi image_hosted_url
 *   npx tsx scripts/host-kanji-story-images.ts --force            # làm lại cả dòng đã có bản sao
 *
 * Cần trước: migration 20261112000001_kanji_stories.sql, `npm run seed:content`, `npm run admin:storage` (bucket content-media).
 *
 * - Đọc các dòng kanji_stories đang có trong database (không đọc file repo) → chỉ sao ảnh của bản đang dùng.
 * - Ảnh: KHÔNG cắt, không đổi nội dung — chỉ thu cạnh dài về tối đa 1200px và chuyển WebP (bucket giới hạn 2 MB).
 * - Lưu ở content-media/kanji-stories/<kanjiId>-<locale>-v<version>.webp.
 * - Chỉ ghi cột image_hosted_url. image_url (URL gốc), nguồn, tác giả, giấy phép giữ nguyên — vẫn ghi công như cũ.
 * - Ảnh nào tải lỗi thì bỏ qua (app vẫn dùng URL gốc) và in ra cuối cùng; có lỗi → thoát mã 1.
 * - Bỏ: xoá cột (update kanji_stories set image_hosted_url = null) — app tự quay về URL gốc.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { loadSeedKanjiStories } from '../src/lib/data/kanji-stories';
import type { KanjiStoryRow } from '../src/lib/supabase/database-rows';
import { loadLocalEnv, requireEnv } from './load-env';

const BUCKET = 'content-media';
const FOLDER = 'kanji-stories';
const MAX_EDGE = 1200;
const MAX_BYTES = 2 * 1024 * 1024;
/** Wikimedia chặn yêu cầu không có User-Agent riêng — dùng tên chung, không chứa thông tin cá nhân. */
const USER_AGENT = 'NekoNekoContentBot/1.0 (educational image mirroring)';

type StoryImageRow = Pick<KanjiStoryRow, 'kanji_id' | 'locale' | 'version' | 'image_url' | 'image_hosted_url'>;

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const objectPath = (row: StoryImageRow) => `${FOLDER}/${row.kanji_id}-${row.locale}-v${row.version}.webp`;

async function toWebp(url: string): Promise<Buffer> {
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT }, redirect: 'follow' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const original = Buffer.from(await response.arrayBuffer());
  for (const quality of [82, 72, 60]) {
    const webp = await sharp(original).rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality }).toBuffer();
    if (webp.length <= MAX_BYTES) return webp;
  }
  throw new Error(`ảnh vẫn lớn hơn ${MAX_BYTES} byte sau khi nén`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  const limit = Number(argValue('--limit') ?? Infinity);

  let rows: StoryImageRow[];
  let supabase: ReturnType<typeof createClient> | null = null;
  if (dryRun) {
    rows = loadSeedKanjiStories().map((story) => ({
      kanji_id: story.kanjiId, locale: story.locale, version: story.version, image_url: story.image?.url ?? null, image_hosted_url: null,
    }));
  } else {
    loadLocalEnv();
    supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.from('kanji_stories').select('kanji_id, locale, version, image_url, image_hosted_url')
      .order('kanji_id').order('locale').order('version');
    if (error) throw new Error(`đọc kanji_stories: ${error.message} (đã chạy migration + npm run seed:content chưa?)`);
    rows = (data ?? []) as StoryImageRow[];
  }

  const todo = rows.filter((row) => row.image_url && (force || !row.image_hosted_url)).slice(0, limit);
  const outDir = join(tmpdir(), 'neko-kanji-story-images');
  if (dryRun) mkdirSync(outDir, { recursive: true });
  console.log(`${dryRun ? '[thử] ' : ''}${todo.length} ảnh cần sao · ${rows.length - todo.length} bỏ qua (không có ảnh / đã có bản sao)`);

  const failures: string[] = [];
  let totalBytes = 0;
  for (const row of todo) {
    const label = `kanji ${row.kanji_id} (${row.locale} v${row.version})`;
    try {
      const webp = await toWebp(row.image_url!);
      totalBytes += webp.length;
      if (dryRun || !supabase) {
        writeFileSync(join(outDir, objectPath(row).replace(`${FOLDER}/`, '')), webp);
      } else {
        const upload = await supabase.storage.from(BUCKET).upload(objectPath(row), webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
        if (upload.error) throw new Error(`tải lên: ${upload.error.message}`);
        const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(objectPath(row)).data.publicUrl;
        const update = await supabase.from('kanji_stories').update({ image_hosted_url: publicUrl } as never)
          .eq('kanji_id', row.kanji_id).eq('locale', row.locale).eq('version', row.version);
        if (update.error) throw new Error(`ghi image_hosted_url: ${update.error.message}`);
      }
      console.log(`  ✓ ${label} · ${(webp.length / 1024).toFixed(0)} KB`);
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : String(error)} — ${row.image_url}`);
      console.log(`  ✗ ${label}`);
    }
  }

  console.log(`\n${todo.length - failures.length}/${todo.length} ảnh xong · tổng ${(totalBytes / 1024 / 1024).toFixed(1)} MB${dryRun ? ` · đã lưu thử ở ${outDir}` : ''}`);
  if (!dryRun && todo.length - failures.length > 0) console.log('Nhớ xoá cache nội dung (deploy lại hoặc đợi cache neko-neko-n5-content-v3 hết hạn) để app thấy URL mới.');
  if (failures.length) {
    console.log(`\n✗ ${failures.length} ảnh lỗi (app vẫn dùng URL gốc cho các ảnh này):\n${failures.map((line) => `  - ${line}`).join('\n')}`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error('✗', error instanceof Error ? error.message : error);
  process.exit(1);
});
