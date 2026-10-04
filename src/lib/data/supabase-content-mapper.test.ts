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
    }).toEqual({ days: 90, tasks: 486, kana: 104, radicals: 45, kanji: 103, grammar: 112, vocabulary: 350, lessons: 25, jlpt: 94 });
  });
});
