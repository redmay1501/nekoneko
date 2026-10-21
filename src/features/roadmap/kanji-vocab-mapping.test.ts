import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { kanjiRows } from '@/features/learning/knowledge-library';
import { outsideCurriculumKanji } from '@/features/learning/kanji-context';
import { unmetKnowledgeOfDay } from '@/features/learning/session-engine';
import { toContentKey } from '@/features/learning/knowledge-types';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildDayPlan } from './day-plan';

/** Kanji ↔ từ vựng theo ngày (docs/KANJI_VOCAB_MAPPING_AUDIT.md). */
const content = loadSeedContent();
const catalog = buildKnowledgeCatalog(content);
const position = { currentDay: 18, isJourneyComplete: false };
const plan = (day: number) => buildDayPlan(catalog, day, position);
const charsOf = (day: number) => plan(day).knowledge.kanji.map((kanji) => kanji.character);
const HAN = /[一-鿿]/g;

describe('Kanji của ngày = Kanji giáo trình trong từ của ngày, học lần đầu', () => {
  it('mọi Kanji giáo trình nằm trong từ của một ngày đều đã học tới ngày đó (không chữ nào bị bỏ sót hay gán ngày sau)', () => {
    const curriculum = new Map(content.kanji.map((kanji) => [kanji.character, kanji.day!]));
    for (const word of content.vocabulary) {
      for (const character of word.kanji.match(HAN) ?? []) {
        if (!curriculum.has(character)) continue;
        expect({ word: word.kanji, character, ok: curriculum.get(character)! <= word.day! })
          .toEqual({ word: word.kanji, character, ok: true });
      }
    }
  });

  it('một Kanji nằm trong nhiều từ cùng ngày (生 trong 先生, 学生) chỉ là MỘT mục học, ngữ cảnh gồm cả hai từ', () => {
    const day = plan(18);
    expect(charsOf(18).filter((character) => character === '生')).toHaveLength(1);
    const sei = day.knowledge.kanji.find((kanji) => kanji.character === '生')!;
    expect(day.kanjiContext[sei.id].today.map(({ word }) => word.kanji)).toEqual(['先生', '学生']);
    expect(catalog.items.filter((item) => item.type === 'kanji' && item.face === '生')).toHaveLength(1);
  });

  it('Kanji đã học ở ngày trước (学 ngày 18) không thành mục mới ở ngày sau (大学 ngày 19) — chỉ là "đã gặp trong"', () => {
    expect(charsOf(19)).not.toContain('学');
    const dai = plan(19).knowledge.kanji.find((kanji) => kanji.character === '大')!;
    expect(dai).toBeTruthy();
    const gaku = content.kanji.find((kanji) => kanji.character === '学')!;
    expect(gaku.day).toBe(18);
  });

  it('Kanji thuộc ngày khác không lọt vào ngày này (本 học ngày 20, không ở ngày 18)', () => {
    expect(charsOf(18)).not.toContain('本');
    expect(charsOf(20)).toContain('本');
  });

  it('bộ lọc theo bài: Kanji xếp đúng bài của từ chứa nó', () => {
    const rows = kanjiRows(catalog, new Map());
    expect(rows.find((row) => row.face === '先')?.group).toBe('Bài 1');
    expect(rows.find((row) => row.face === '本')?.group).toBe('Bài 2');
    // NekoNeko v2: 川 nay có từ N5 chứa nó (Bài 14) — không còn chữ nào thuộc nhóm "Kanji N5 bổ sung".
    expect(rows.find((row) => row.face === '川')?.group).toBe('Bài 14');
    expect(rows.some((row) => row.group === 'Kanji N5 bổ sung')).toBe(false);
  });
});

describe('chữ Hán ngoài danh sách Kanji của giáo trình (dữ liệu nguồn không có)', () => {
  it('私（わたし）bài 1: không có bản ghi Kanji → không thành mục học Kanji, nhưng trang ngày báo rõ', () => {
    expect(content.kanji.some((kanji) => kanji.character === '私')).toBe(false);
    expect(content.vocabulary.find((word) => word.kanji === '私')?.day).toBe(18);
    expect(charsOf(18)).not.toContain('私');
    const outside = plan(18).outsideKanji.map((entry) => entry.character);
    expect(outside).toContain('私');
    expect(outside.every((character) => !content.kanji.some((kanji) => kanji.character === character))).toBe(true);
  });

  it('không có dữ liệu Kanji → mọi chữ Hán đều "ngoài danh sách"; từ không có chữ Hán → rỗng', () => {
    const words = content.vocabulary.filter((word) => word.day === 18);
    expect(outsideCurriculumKanji(words, []).length).toBeGreaterThan(5);
    expect(outsideCurriculumKanji(content.vocabulary.filter((word) => !word.kanji), content.kanji)).toEqual([]);
  });
});

describe('tiến độ có sẵn', () => {
  it('Kanji đã gặp (có trí nhớ) không bị hỏi lại như kiến thức mới; chữ chưa gặp vẫn còn — không tạo mục trùng', () => {
    const sen = content.kanji.find((kanji) => kanji.character === '先')!;
    const key = toContentKey('kanji', sen.id);
    const views = new Map<string, MemoryView>([[key, { contentKey: key, encounterCount: 2, isLearned: true } as unknown as MemoryView]]);
    const unmet = unmetKnowledgeOfDay(catalog, views as never, 18).filter((item) => item.type === 'kanji').map((item) => item.face);
    expect(unmet).not.toContain('先');
    expect(unmet).toContain('生');
    expect(new Set(unmet).size).toBe(unmet.length);
  });
});
