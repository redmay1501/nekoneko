import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildNotebooks, DEFAULT_REPEATS, fillRepeats, findNotebookPage, gridColumns, isGhostCell, KANJI_PER_PAGE, REPEAT_OPTIONS } from './notebook';

const content = loadSeedContent();
const notebooks = buildNotebooks(content);
const byId = Object.fromEntries(notebooks.map((notebook) => [notebook.id, notebook]));

describe('buildNotebooks', () => {
  it('có đủ bốn sổ: Hiragana, Katakana, Kanji, Bộ thủ', () => {
    expect(notebooks.map((notebook) => notebook.id)).toEqual(['hiragana', 'katakana', 'kanji', 'bo-thu']);
  });

  it('Hiragana trang 1 là hàng あ: あいうえお đúng thứ tự, mỗi chữ một dòng', () => {
    const page = byId.hiragana.pages[0];
    expect(page.title).toBe('Hàng あ行');
    expect(page.rows.map((row) => row.glyph)).toEqual(['あ', 'い', 'う', 'え', 'お']);
    expect(page.rows.map((row) => row.label)).toEqual(['a', 'i', 'u', 'e', 'o']);
  });

  it('hàng か, わ行 có ん; Katakana dùng chữ cứng và nhãn ア行', () => {
    expect(byId.hiragana.pages[1].rows.map((row) => row.glyph).join('')).toBe('かきくけこ');
    expect(byId.hiragana.pages.find((page) => page.title.includes('わ'))?.rows.map((row) => row.glyph).join('')).toBe('わをん');
    expect(byId.katakana.pages[0].title).toBe('Hàng ア行');
    expect(byId.katakana.pages[0].rows.map((row) => row.glyph).join('')).toBe('アイウエオ');
  });

  it('mọi chữ kana trong dữ liệu đều có đúng một chỗ trong sổ (không thêm, không thiếu)', () => {
    const glyphs = byId.hiragana.pages.flatMap((page) => page.rows.map((row) => row.glyph));
    expect(glyphs.sort()).toEqual(content.kana.map((item) => item.hiragana).sort());
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it('Kanji: đủ mọi chữ, mỗi trang tối đa KANJI_PER_PAGE, có âm Hán Việt và nghĩa từ dữ liệu', () => {
    const rows = byId.kanji.pages.flatMap((page) => page.rows);
    expect(rows).toHaveLength(content.kanji.length);
    expect(byId.kanji.pages.every((page) => page.rows.length <= KANJI_PER_PAGE)).toBe(true);
    const source = content.kanji.find((item) => item.character === rows[0].glyph)!;
    expect(rows[0]).toMatchObject({ label: source.hanViet, meaning: source.meaning });
  });

  it('thứ tự nét chỉ báo "có" khi chữ nằm trong dữ liệu KanjiVG', () => {
    expect(byId.hiragana.pages[0].rows[0]).toMatchObject({ hasStrokeOrder: true, strokeCount: 3 });
    for (const row of byId['bo-thu'].pages.flatMap((page) => page.rows)) {
      if (!row.hasStrokeOrder) expect(row.strokeCount).toBeNull();
    }
  });

  it('mã trang ổn định, tìm lại được', () => {
    expect(byId.hiragana.pages[2].id).toBe('hiragana-3');
    expect(findNotebookPage(notebooks, 'kanji-1')?.notebookId).toBe('kanji');
    expect(findNotebookPage(notebooks, 'kanji-999')).toBeUndefined();
  });

  it('mỗi sổ ≤ 40 trang (giới hạn bản ghi của kho tiến độ)', () => {
    expect(notebooks.every((notebook) => notebook.pages.length <= 40)).toBe(true);
  });
});

describe('isGhostCell — số ô có chữ mờ theo cấu hình', () => {
  it.each(REPEAT_OPTIONS)('%i ô: đồ hết = tất cả, tự viết = 0, nửa = nửa đầu', (repeats) => {
    const count = (mode: 'all' | 'half' | 'none') => Array.from({ length: repeats }, (_, index) => isGhostCell(index, repeats, mode)).filter(Boolean).length;
    expect(count('all')).toBe(repeats);
    expect(count('none')).toBe(0);
    expect(count('half')).toBe(Math.ceil(repeats / 2));
    expect(isGhostCell(0, repeats, 'half')).toBe(true);
  });
  it('mặc định: đầy khung', () => expect(DEFAULT_REPEATS).toBe('auto'));
});

describe('Đầy khung — số cột và số ô theo bề rộng', () => {
  it('số cột theo bề rộng, cỡ ô và khe hở; tối thiểu 4 cột', () => {
    expect(gridColumns(970, 64, 6)).toBe(13);
    expect(gridColumns(970, 84, 6)).toBe(10);
    expect(gridColumns(330, 64, 6)).toBe(4);
    expect(gridColumns(0, 64, 6)).toBe(4);
  });
  it('khung rộng (PC / iPad) → kín đúng 2 hàng: ô mẫu 2×2 + ô luyện', () => {
    const { rows, repeats } = fillRepeats(13);
    expect(rows).toBe(2);
    expect(repeats + 4).toBe(2 * 13);
    expect(fillRepeats(9)).toEqual({ rows: 2, repeats: 14 });
  });
  it('điện thoại (ít cột) → 3 hàng để đủ ô luyện', () => {
    expect(fillRepeats(4)).toEqual({ rows: 3, repeats: 8 });
    expect(fillRepeats(5)).toEqual({ rows: 3, repeats: 11 });
  });
});
