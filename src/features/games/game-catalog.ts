/**
 * Danh sách trò chơi trong mục "Trò chơi" (/tro-choi). Thêm trò mới = thêm một dòng ở đây + trang /tro-choi/<id>.
 * Trò chơi KHÔNG đổi điểm trí nhớ (xem match-game.ts) — chỉ để ôn vui, có kỷ lục.
 */
export interface GameEntry {
  id: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  /** Các loại kiến thức chơi được. */
  kinds: string;
}

export const GAMES: readonly GameEntry[] = [
  {
    id: 'neko-streak',
    href: '/tro-choi/neko-streak',
    icon: '🐾',
    title: 'Neko Streak — Mèo nhớ siêu đỉnh!',
    description: 'Trả lời đúng liên tiếp, phá kỷ lục của chính mình! Câu hỏi chỉ lấy từ những gì bạn đã học tới ngày hiện tại.',
    kinds: 'Chữ cái · Bộ thủ · Kanji · Từ vựng · Ngữ pháp',
  },
  {
    id: 'ghep-the',
    href: '/tro-choi/ghep-the',
    icon: '🃏',
    title: 'Ghép thẻ',
    description: 'Lật ô vuông, ghép chữ Nhật với nghĩa. Tính giờ, phá kỷ lục, nhắm 100% không sai.',
    kinds: 'Từ vựng · Kanji · Hiragana · Katakana',
  },
];

export const GAMES_HOME = '/tro-choi';
