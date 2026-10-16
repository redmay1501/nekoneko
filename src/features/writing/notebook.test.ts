import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildNotebooks, DEFAULT_REPEATS, fillRepeats, findNotebookPage, gridColumns, isGhostCell, KANJI_PER_PAGE, REPEAT_OPTIONS, ghostCopies, wordLines, writingFormOf } from './notebook';
import { notebookRecordKey } from './notebook-progress';

const content = loadSeedContent();
const notebooks = buildNotebooks(content);
const byId = Object.fromEntries(notebooks.map((notebook) => [notebook.id, notebook]));

describe('buildNotebooks', () => {
  it('có đủ năm sổ: Hiragana, Katakana, Kanji, Bộ thủ, Từ vựng', () => {
    expect(notebooks.map((notebook) => notebook.id)).toEqual(['hiragana', 'katakana', 'kanji', 'bo-thu', 'tu-vung']);
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

  it('sổ chữ ≤ 40 trang (giới hạn bản ghi của kho tiến độ; sổ Từ vựng chia tiền tố riêng)', () => {
    expect(notebooks.filter((notebook) => notebook.id !== 'tu-vung').every((notebook) => notebook.pages.length <= 40)).toBe(true);
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

describe('Sổ Từ vựng', () => {
  const vocab = byId['tu-vung'];
  it('có sổ, đủ mọi từ viết được, mỗi trang tối đa 5 từ, theo bài', () => {
    expect(vocab).toBeDefined();
    const rows = vocab.pages.flatMap((page) => page.rows);
    expect(rows.length).toBe(content.vocabulary.filter((word) => writingFormOf(word.kana).length).length);
    expect(vocab.pages.every((page) => page.rows.length <= 5)).toBe(true);
    expect(vocab.pages.every((page) => /^(Bài \d+|Chào hỏi)/.test(page.subtitle))).toBe(true);
  });
  it('mỗi chữ một ô: 先生 → kana せ・ん・せ・い, chữ Kanji 先・生', () => {
    const row = vocab.pages.flatMap((page) => page.rows).find((item) => item.word?.kanji?.join('') === '先生')!;
    expect(row.word).toMatchObject({ kana: ['せ', 'ん', 'せ', 'い'], kanji: ['先', '生'] });
  });
  it('làm sạch ký hiệu phụ trong dữ liệu', () => {
    expect(writingFormOf('だれ / どなた')).toEqual([...'だれ']);
    expect(writingFormOf('しんせつ[な]')).toEqual([...'しんせつ']);
    expect(writingFormOf('〜さん')).toEqual([...'さん']);
    expect(writingFormOf('ひとつ〜とお')).toEqual([...'ひとつ']);
    expect(writingFormOf('どうぞ よろしく')).toEqual([...'どうぞよろしく']);
    expect(writingFormOf('〜')).toEqual([]);
  });
  it('không có ký tự lạ trong ô viết', () => {
    for (const row of vocab.pages.flatMap((page) => page.rows)) {
      expect([...(row.word!.kana), ...(row.word!.kanji ?? [])].join('')).not.toMatch(/[\s/〜~[\]()]/);
    }
  });
  it('vở kẻ dòng: tự động 2 dòng (máy tính / iPad), 3 dòng (điện thoại); chọn 1–4', () => {
    expect(wordLines({ setting: 'auto', autoRows: 2, ghost: 'half' })).toEqual({ lines: 2, ghostLines: 1 });
    expect(wordLines({ setting: 'auto', autoRows: 3, ghost: 'none' })).toEqual({ lines: 3, ghostLines: 0 });
    expect(wordLines({ setting: 4, autoRows: 2, ghost: 'all' })).toEqual({ lines: 4, ghostLines: 4 });
  });
  it('chữ mờ lặp lại vừa bề dài dòng', () => {
    expect(ghostCopies(14, 2)).toBe(11);
    expect(ghostCopies(14, 9)).toBe(3);
    expect(ghostCopies(3, 9)).toBe(1);
    // mọi bản sao nằm trọn trong dòng: lề 0,2 + n × (chữ + khe) − khe ≤ bề rộng
    for (const [aspect, length] of [[14, 2], [14, 9], [8.4, 4], [4.3, 3]] as const) {
      const copies = ghostCopies(aspect, length);
      expect(0.2 + copies * (length * 0.4 + 0.4) - 0.4).toBeLessThanOrEqual(aspect);
    }
  });
  it('tiến độ: tiền tố chia theo từng 40 trang (≤ 40 bản ghi mỗi loại)', () => {
    expect(notebookRecordKey('tu-vung', 'tu-vung-1')).toBe('viet-tu1:tu-vung-1');
    expect(notebookRecordKey('tu-vung', 'tu-vung-41')).toBe('viet-tu2:tu-vung-41');
    expect(notebookRecordKey('kanji', 'kanji-3')).toBe('viet-kanji:kanji-3');
  });
});
