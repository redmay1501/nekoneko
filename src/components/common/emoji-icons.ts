/**
 * Bảng icon 3D thay cho emoji trong giao diện.
 *
 * Nguồn: Microsoft Fluent Emoji — 3D (giấy phép MIT) · https://github.com/microsoft/fluentui-emoji
 * File đã tải sẵn vào public/icons/3d/<slug>.png bằng `npm run icons:fetch` — app không gọi trang ngoài khi chạy.
 * Thêm icon: thêm một dòng ở đây (đường dẫn trong thư mục assets/ của kho Fluent) rồi chạy lại script.
 */
export interface EmojiIconSource {
  slug: string;
  /** Đường dẫn trong thư mục assets/ của kho Fluent Emoji. */
  fluentPath: string;
}

/** Khoá là emoji đã bỏ ký tự biến thể U+FE0F (xem normalizeEmoji). */
export const EMOJI_ICONS: Record<string, EmojiIconSource> = {
  '🌸': { slug: 'cherry-blossom', fluentPath: 'Cherry blossom/3D/cherry_blossom_3d.png' },
  '🌱': { slug: 'seedling', fluentPath: 'Seedling/3D/seedling_3d.png' },
  '🧠': { slug: 'brain', fluentPath: 'Brain/3D/brain_3d.png' },
  '🔊': { slug: 'speaker', fluentPath: 'Speaker high volume/3D/speaker_high_volume_3d.png' },
  '🏆': { slug: 'trophy', fluentPath: 'Trophy/3D/trophy_3d.png' },
  '💬': { slug: 'speech-balloon', fluentPath: 'Speech balloon/3D/speech_balloon_3d.png' },
  '✨': { slug: 'sparkles', fluentPath: 'Sparkles/3D/sparkles_3d.png' },
  '🔤': { slug: 'latin-letters', fluentPath: 'Input latin letters/3D/input_latin_letters_3d.png' },
  '🎧': { slug: 'headphone', fluentPath: 'Headphone/3D/headphone_3d.png' },
  '🍂': { slug: 'fallen-leaf', fluentPath: 'Fallen leaf/3D/fallen_leaf_3d.png' },
  '✍': { slug: 'writing-hand', fluentPath: 'Writing hand/Default/3D/writing_hand_3d_default.png' },
  '🫧': { slug: 'bubbles', fluentPath: 'Bubbles/3D/bubbles_3d.png' },
  '🧩': { slug: 'puzzle', fluentPath: 'Puzzle piece/3D/puzzle_piece_3d.png' },
  '🗣': { slug: 'microphone', fluentPath: 'Microphone/3D/microphone_3d.png' },
  '📘': { slug: 'blue-book', fluentPath: 'Blue book/3D/blue_book_3d.png' },
  '📖': { slug: 'open-book', fluentPath: 'Open book/3D/open_book_3d.png' },
  '📄': { slug: 'page', fluentPath: 'Page facing up/3D/page_facing_up_3d.png' },
  '⏱': { slug: 'stopwatch', fluentPath: 'Stopwatch/3D/stopwatch_3d.png' },
  '🗺': { slug: 'world-map', fluentPath: 'World map/3D/world_map_3d.png' },
  '🔗': { slug: 'link', fluentPath: 'Link/3D/link_3d.png' },
  '📐': { slug: 'ruler', fluentPath: 'Triangular ruler/3D/triangular_ruler_3d.png' },
  '📊': { slug: 'bar-chart', fluentPath: 'Bar chart/3D/bar_chart_3d.png' },
  '💡': { slug: 'light-bulb', fluentPath: 'Light bulb/3D/light_bulb_3d.png' },
  '👤': { slug: 'student', fluentPath: 'Student/Default/3D/student_3d_default.png' },
  '🏠': { slug: 'house', fluentPath: 'House/3D/house_3d.png' },
  '🎉': { slug: 'party-popper', fluentPath: 'Party popper/3D/party_popper_3d.png' },
  '🌿': { slug: 'herb', fluentPath: 'Herb/3D/herb_3d.png' },
  '🌳': { slug: 'tree', fluentPath: 'Deciduous tree/3D/deciduous_tree_3d.png' },
  '🌊': { slug: 'water-wave', fluentPath: 'Water wave/3D/water_wave_3d.png' },
  '⚡': { slug: 'high-voltage', fluentPath: 'High voltage/3D/high_voltage_3d.png' },
  '⚙': { slug: 'gear', fluentPath: 'Gear/3D/gear_3d.png' },
  '🪄': { slug: 'magic-wand', fluentPath: 'Magic wand/3D/magic_wand_3d.png' },
  '🧱': { slug: 'brick', fluentPath: 'Brick/3D/brick_3d.png' },
  '🔥': { slug: 'fire', fluentPath: 'Fire/3D/fire_3d.png' },
  '🔍': { slug: 'magnifier', fluentPath: 'Magnifying glass tilted left/3D/magnifying_glass_tilted_left_3d.png' },
  '🔄': { slug: 'arrows-cycle', fluentPath: 'Counterclockwise arrows button/3D/counterclockwise_arrows_button_3d.png' },
  '📚': { slug: 'books', fluentPath: 'Books/3D/books_3d.png' },
  '📅': { slug: 'calendar', fluentPath: 'Calendar/3D/calendar_3d.png' },
  '👩': { slug: 'woman', fluentPath: 'Woman/Default/3D/woman_3d_default.png' },
  '👨': { slug: 'man', fluentPath: 'Man/Default/3D/man_3d_default.png' },
  '🏯': { slug: 'castle', fluentPath: 'Japanese castle/3D/japanese_castle_3d.png' },
  '✏': { slug: 'pencil', fluentPath: 'Pencil/3D/pencil_3d.png' },
  '🍵': { slug: 'tea', fluentPath: 'Teacup without handle/3D/teacup_without_handle_3d.png' },
  '🎌': { slug: 'flags', fluentPath: 'Crossed flags/3D/crossed_flags_3d.png' },
  '🎲': { slug: 'game-die', fluentPath: 'Game die/3D/game_die_3d.png' },
  '🧭': { slug: 'compass', fluentPath: 'Compass/3D/compass_3d.png' },
  '🎯': { slug: 'bullseye', fluentPath: 'Bullseye/3D/bullseye_3d.png' },
  '✅': { slug: 'check', fluentPath: 'Check mark button/3D/check_mark_button_3d.png' },
  '📦': { slug: 'package', fluentPath: 'Package/3D/package_3d.png' },
};

/**
 * Emoji ĐỘNG cho vài khoảnh khắc ăn mừng — Google Noto Animated Emoji (giấy phép CC BY 4.0, cần ghi nguồn;
 * dòng ghi nguồn ở màn Cài đặt) · https://googlefonts.github.io/noto-emoji-animation/
 * File public/icons/animated/<slug>.webp — chỉ tải khi khoảnh khắc đó xuất hiện.
 */
export const ANIMATED_EMOJI = {
  'party-popper': '1f389',
  sparkles: '2728',
} as const;
export type AnimatedEmojiName = keyof typeof ANIMATED_EMOJI;

export function normalizeEmoji(emoji: string): string {
  return emoji.replace(/\uFE0F/g, '');
}

/**
 * Icon mèo Neko Neko — bộ icon riêng của app (ảnh tạo bằng Recraft, gốc ở design/icons-moi/recraft-assets/,
 * xử lý bằng scripts/import-brand-assets.ts → public/icons/neko/<slug>.webp).
 * Dùng bằng khoá "neko:<slug>" ở chỗ đặt emoji, ví dụ icon: 'neko:home'. Chỉ dùng cho icon từ ~24px trở lên:
 * ảnh nhiều chi tiết, nhỏ hơn sẽ khó nhìn — chip và chữ nhỏ vẫn dùng icon 3D ở trên.
 */
export const NEKO_ICONS = [
  'home', 'roadmap', 'study', 'memory', 'garden', 'achievements', 'profile', 'settings',
  'hiragana', 'katakana', 'radical', 'kanji', 'vocabulary', 'listening', 'speaking', 'reading', 'review', 'recall',
  'practice', 'progress', 'writing',
] as const;
export type NekoIconName = (typeof NEKO_ICONS)[number];
const NEKO_PREFIX = 'neko:';

export function emojiIconSrc(emoji: string): string | null {
  if (emoji.startsWith(NEKO_PREFIX)) {
    const slug = emoji.slice(NEKO_PREFIX.length);
    return (NEKO_ICONS as readonly string[]).includes(slug) ? `/icons/neko/${slug}.webp` : null;
  }
  const icon = EMOJI_ICONS[normalizeEmoji(emoji)];
  return icon ? `/icons/3d/${icon.slug}.png` : null;
}
