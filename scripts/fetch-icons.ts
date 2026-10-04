/**
 * Tải icon 3D (Microsoft Fluent Emoji, MIT) và emoji động (Google Noto Animated Emoji, CC BY 4.0) vào public/icons.
 *
 *   npm run icons:fetch
 *
 * Chạy lại khi thêm icon vào src/components/common/emoji-icons.ts. File tải về được commit vào repo,
 * nên app không phụ thuộc trang ngoài khi chạy. Trên macOS, ảnh 3D được thu về 128px (đủ nét cho màn hình 2x).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ANIMATED_EMOJI, EMOJI_ICONS } from '../src/components/common/emoji-icons';

const FLUENT_BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/';
const NOTO_ANIMATED_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest/';
const ICON_PIXELS = 128;
const OUT_3D = join(process.cwd(), 'public', 'icons', '3d');
const OUT_ANIMATED = join(process.cwd(), 'public', 'icons', 'animated');

async function download(url: string, file: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
}

function shrink(file: string): void {
  try {
    execFileSync('sips', ['-Z', String(ICON_PIXELS), file], { stdio: 'ignore' });
  } catch {
    // Không có sips (không phải macOS) → giữ ảnh gốc 256px, vẫn dùng được.
  }
}

async function main() {
  mkdirSync(OUT_3D, { recursive: true });
  mkdirSync(OUT_ANIMATED, { recursive: true });
  for (const { slug, fluentPath } of Object.values(EMOJI_ICONS)) {
    const file = join(OUT_3D, `${slug}.png`);
    if (existsSync(file)) continue;
    await download(FLUENT_BASE + fluentPath.split('/').map(encodeURIComponent).join('/'), file);
    shrink(file);
    console.log(`✓ 3D ${slug}`);
  }
  for (const [slug, codepoint] of Object.entries(ANIMATED_EMOJI)) {
    const file = join(OUT_ANIMATED, `${slug}.webp`);
    if (existsSync(file)) continue;
    await download(`${NOTO_ANIMATED_BASE}${codepoint}/512.webp`, file);
    console.log(`✓ động ${slug}`);
  }
  console.log('Xong — icon nằm ở public/icons/');
}

main().catch((error: unknown) => {
  console.error('✗ Tải icon thất bại', error);
  process.exit(1);
});
