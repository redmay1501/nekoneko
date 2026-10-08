import { describe, expect, it } from 'vitest';
import { loadSeedContent } from './seed-content';
import { CONTENT_TABLES, contentFromRows, rowsFromContent } from './supabase-content-mapper';

describe('supabase-content-mapper', () => {
  it('ghi rồi đọc lại cho ra đúng nội dung ban đầu (không mất trường nào)', () => {
    const { ...content } = loadSeedContent() as ReturnType<typeof loadSeedContent> & { meta?: unknown };
    delete (content as { meta?: unknown }).meta;
    expect(contentFromRows(rowsFromContent(content))).toEqual(content);
  });

  it('mọi nhóm nội dung đều có bảng tương ứng', () => {
    const rows = rowsFromContent(loadSeedContent());
    expect(CONTENT_TABLES.map((table) => table.key).sort()).toEqual(Object.keys(rows).sort());
  });

  it('số lượng nội dung khớp file lộ trình', () => {
    const content = loadSeedContent();
    expect({
      days: content.journeyDays.length, tasks: content.dayTasks.length, kana: content.kana.length,
      radicals: content.radicals.length, kanji: content.kanji.length, grammar: content.grammar.length,
      vocabulary: content.vocabulary.length, lessons: content.lessons.length, jlpt: content.jlptGrammar.length,
    }).toEqual({ days: 90, tasks: 484, kana: 104, radicals: 71, kanji: 103, grammar: 112, vocabulary: 755, lessons: 25, jlpt: 94 });
    // 45 bộ của lộ trình + 26 bộ tham khảo (không xếp ngày) để mọi kanji N5 đều có bộ chính.
    expect(content.radicals.filter((radical) => radical.day === null)).toHaveLength(26);
  });

  it('mọi kanji N5 đều có bộ chính; đọc lại từ database giữ đúng liên kết và thứ tự bài', () => {
    const content = loadSeedContent();
    const withMain = new Set(content.kanjiRadicals.filter((link) => link.position === 0).map((link) => link.kanjiId));
    expect(content.kanji.every((kanji) => withMain.has(kanji.id))).toBe(true);
    const rows = rowsFromContent(content);
    // Database trả bài theo khoá chữ: "Bài 1", "Bài 10", "Bài 11"… → app phải sắp lại theo số bài.
    const shuffled = { ...rows, lessons: [...rows.lessons].sort((left, right) => left.id.localeCompare(right.id)) };
    const roundTrip = contentFromRows(shuffled);
    expect(roundTrip.lessons.map((lesson) => lesson.id)).toEqual(content.lessons.map((lesson) => lesson.id));
    expect(roundTrip.kanjiRadicals).toEqual(content.kanjiRadicals);
  });
});
