/**
 * Đưa logo + bộ icon mèo Neko Neko (ảnh gốc 1024px tạo bằng Recraft, ở design/icons-moi/recraft-assets/)
 * vào app: cắt viền trong suốt, thu nhỏ, chuyển WebP cho nhẹ.
 *
 *   npx tsx scripts/import-brand-assets.ts
 *
 * Ra:  public/brand/logo.webp · public/brand/login-bg-*.webp · public/brand/login-touch-*.webp · public/icons/neko/<slug>.webp · src/app/icon.png · src/app/apple-icon.png
 * Ảnh nào dùng cho vị trí nào: bảng NEKO_ICON_SOURCES dưới đây (khoá slug khớp NEKO_ICONS trong emoji-icons.ts).
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = join(process.cwd(), 'design', 'icons-moi', 'recraft-assets');
const ICON_DIR = join(process.cwd(), 'public', 'icons', 'neko');
const BRAND_DIR = join(process.cwd(), 'public', 'brand');
const APP_DIR = join(process.cwd(), 'src', 'app');

/** Đủ nét cho icon hiển thị tới ~96px trên màn hình 2x. */
const ICON_PIXELS = 192;
const LOGO_WIDTH = 720;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
/**
 * Mọi icon có CÙNG DIỆN TÍCH hình (không phải cùng cạnh dài) thì mắt mới thấy to bằng nhau: ảnh rộng
 * (mèo + nhà) mà ép cạnh dài = 192 sẽ trông bé hơn hẳn ảnh vuông. Diện tích chuẩn = ảnh rộng nhất (~1.7:1)
 * khi chạm hết chiều ngang ô — nên mọi ảnh đều vừa ô, ảnh vuông thu lại một chút cho cân.
 */
const ICON_TARGET_AREA = ICON_PIXELS * ICON_PIXELS * 0.6;

/** Điểm mờ hơn ngưỡng này (quầng sáng, lấp lánh nhạt) không tính vào khung hình — không làm icon "phồng" giả. */
const SOLID_ALPHA = 64;

/** Khung bao phần hình ĐỦ ĐẬM (alpha ≥ SOLID_ALPHA) — thay cho trim() vốn tính cả quầng sáng gần trong suốt. */
async function solidBoundingBox(file: string): Promise<{ left: number; top: number; width: number; height: number }> {
  const { data, info } = await sharp(file).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] < SOLID_ALPHA) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < 0) return { left: 0, top: 0, width: info.width, height: info.height };
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/**
 * Bù thị giác cho ảnh mà con mèo chỉ chiếm một phần nhỏ của khung (vật đi kèm nằm xa, vòng mũi tên to…):
 * cùng diện tích khung nhưng con mèo trông bé hơn. Chỉnh bằng mắt trên bảng so sánh; vẫn không vượt quá ô.
 */
const OPTICAL_BOOST: Record<string, number> = {
  practice: 1.2, // mèo nhỏ + bong bóng thoại ở xa
  review: 1.12, // vòng mũi tên bao quanh
};

function visuallyEqualSize(width: number, height: number, boost: number): { width: number; height: number } {
  const scale = Math.min(ICON_PIXELS / Math.max(width, height), Math.sqrt(ICON_TARGET_AREA / (width * height)) * boost);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
const CREAM = { r: 255, g: 253, b: 248, alpha: 1 };

export const NEKO_ICON_SOURCES: Record<string, string> = {
  home: 'icon--the-chubby--14.png', // mèo + nhà Nhật + hoa anh đào
  roadmap: 'icon--the-chubby--12.png', // mèo trên đường, torii, Phú Sĩ
  study: 'icon--the-chubby-o-7.png', // sách + bóng đèn + bút
  memory: 'icon--the-chubby-o-6.png', // bông hoa hình bộ não
  garden: 'icon--the-chubby-o-5.png', // tưới cây
  achievements: 'single-icon--soft--1.png', // cúp
  profile: 'icon--a-simple-frien.png', // mặt mèo tròn
  settings: 'icon--the-chubby-o-4.png', // bánh răng
  hiragana: 'icon--the-chubby-o-3.png', // あ
  katakana: 'icon--the-chubby-o-2.png', // フ
  radical: 'icon--the-chubby-o-1.png', // mảnh ghép
  kanji: 'icon--the-chubby--10.png', // 日
  vocabulary: 'single-icon--soft-pa.png', // đọc sách xanh
  listening: 'icon--the-chubby-o-9.png', // tai nghe
  speaking: 'a-single-standalone-.png', // bong bóng thoại
  reading: 'icon--the-chubby-ora.png', // sách + bong bóng thoại
  review: 'icon--the-chubby--13.png', // hoa + mũi tên vòng
  recall: 'icon--the-chubby-o-8.png', // kính lúp
  practice: 'a-single-standalon-1.png', // mèo cam + bong bóng thoại
  progress: 'single-icon--soft--2.png', // mèo ngồi cạnh nhà
  writing: 'icon--the-chubby--11.png', // bảng chữ 日 (luyện viết chữ)
};

async function main() {
  mkdirSync(ICON_DIR, { recursive: true });
  mkdirSync(BRAND_DIR, { recursive: true });

  for (const [slug, file] of Object.entries(NEKO_ICON_SOURCES)) {
    const box = await solidBoundingBox(join(SOURCE_DIR, file));
    const { width, height } = visuallyEqualSize(box.width, box.height, OPTICAL_BOOST[slug] ?? 1);
    await sharp(join(SOURCE_DIR, file))
      .extract(box)
      .resize(width, height)
      .extend({
        top: Math.floor((ICON_PIXELS - height) / 2), bottom: Math.ceil((ICON_PIXELS - height) / 2),
        left: Math.floor((ICON_PIXELS - width) / 2), right: Math.ceil((ICON_PIXELS - width) / 2),
        background: TRANSPARENT,
      })
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(join(ICON_DIR, `${slug}.webp`));
    console.log(`✓ icon ${slug} (${width}×${height})`);
  }

  const logo = await sharp(join(SOURCE_DIR, 'logo.PNG')).trim().toBuffer();
  await sharp(logo).resize({ width: LOGO_WIDTH }).webp({ quality: 88, alphaQuality: 90 }).toFile(join(BRAND_DIR, 'logo.webp'));
  console.log('✓ logo');

  // Nền trang đăng nhập — tranh có sẵn khung thẻ trống bên phải, form được đặt khớp vào khung đó (globals.css .login-*).
  // login2 = cùng bố cục với login1 nhưng 5120px — đủ nét cho màn hình Retina (bản 2560).
  for (const width of [2560, 1920, 1100]) {
    await sharp(join(SOURCE_DIR, 'login2.JPEG')).resize({ width }).webp({ quality: 80 })
      .toFile(join(BRAND_DIR, `login-bg-${width}.webp`));
  }
  // Nền iPad / điện thoại (bố cục thẻ ở giữa): tranh 16:9 KHÔNG có khung thẻ vẽ sẵn — nhìn xuyên qua thẻ trong suốt.
  for (const width of [2560, 1600, 1000]) {
    await sharp(join(SOURCE_DIR, 'ipad-mobile.JPEG')).resize({ width }).webp({ quality: 80 })
      .toFile(join(BRAND_DIR, `login-touch-${width}.webp`));
  }
  console.log('✓ nền đăng nhập');

  // Biểu tượng tab trình duyệt / màn hình chính điện thoại: mặt mèo tròn (logo quá chi tiết ở cỡ nhỏ).
  const face = await sharp(join(SOURCE_DIR, NEKO_ICON_SOURCES.profile)).trim().toBuffer();
  await sharp(face).resize(128, 128, { fit: 'contain', background: TRANSPARENT }).png({ compressionLevel: 9 }).toFile(join(APP_DIR, 'icon.png'));
  await sharp(face).resize(156, 156, { fit: 'contain', background: CREAM })
    .extend({ top: 12, bottom: 12, left: 12, right: 12, background: CREAM }).flatten({ background: CREAM })
    .png().toFile(join(APP_DIR, 'apple-icon.png'));
  console.log('✓ favicon + apple-icon');
}

main().catch((error: unknown) => {
  console.error('✗ Xử lý ảnh thất bại', error);
  process.exit(1);
});
