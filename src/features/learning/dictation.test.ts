import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import { toMemoryView } from '@/features/memory/memory-engine';
import { compareJapanese } from '@/lib/utils/japanese-text';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { toContentKey } from './knowledge-types';
import { buildDictationPractice } from './skill-practice';

const NOW = new Date('2026-10-06T08:00:00.000Z');
const catalog = buildKnowledgeCatalog(loadSeedContent());
const viewsAt = (day: number) => {
  const records = new Map(generateDemoMemoryRecords(catalog.items, day, NOW).map((record) => [toContentKey(record.contentType, record.contentId), record]));
  return new Map(catalog.items.map((item) => [item.key, toMemoryView(item.key, item.type, records.get(item.key) ?? null, NOW)]));
};

describe('buildDictationPractice', () => {
  it('ngày 3 (chưa có từ / mẫu câu): bài trống — không hỏi thứ chưa học', () => {
    expect(buildDictationPractice(catalog, viewsAt(3), 3, 'd')).toEqual({ words: [], sentences: [] });
  });

  it('ngày 30: chỉ từ đã học, chỉ câu của mẫu đã tới lịch; gõ kana hay chữ Hán đều đúng', () => {
    const views = viewsAt(30);
    const { words, sentences } = buildDictationPractice(catalog, views, 30, 'd');
    expect(words.length).toBeGreaterThan(0);
    expect(words.every((word) => views.get(word.contentKey)?.isLearned)).toBe(true);
    expect(sentences.every((sentence) => (catalog.byKey.get(sentence.contentKey)?.day ?? 99) <= 30)).toBe(true);
    for (const sentence of sentences) {
      const kanaAnswer = sentence.accepted.at(-1)!;
      expect(compareJapanese(kanaAnswer, sentence.accepted, { foldKatakana: true }).isCorrect).toBe(true);
    }
  });
});
