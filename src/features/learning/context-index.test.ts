import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { createInitialMemoryRecord, toMemoryView } from '@/features/memory/memory-engine';
import type { MemoryView } from '@/features/memory/memory-types';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { type ContentKey, toContentKey } from './knowledge-types';
import { buildDiscoverCard } from './knowledge-presenter';
import { getContextIndex, kanaExampleWords, pickContextExample, realSentenceBlank, searchStem } from './context-index';

const NOW = new Date('2026-10-05T08:00:00.000Z');
const seed = loadSeedContent();
const catalog = buildKnowledgeCatalog({
  ...seed,
  exampleSentences: [
    { id: 1, jp: '私は先生です。', vi: 'Tôi là giáo viên.', viId: 11, owner: 'a', viOwner: 'b' },
    { id: 2, jp: '私は朝ごはんを食べます。', vi: 'Tôi ăn sáng.', viId: 12, owner: 'a', viOwner: 'b' },
    { id: 3, jp: 'パンを食べた。', vi: 'Tôi đã ăn bánh mì.', viId: 13, owner: 'a', viOwner: 'b' },
  ],
});
const key = (type: 'vocabulary' | 'kanji' | 'hiragana', id: number) => toContentKey(type, id);
const item = (contentKey: ContentKey) => catalog.byKey.get(contentKey)!;

function learned(...keys: ContentKey[]): Map<ContentKey, MemoryView> {
  return new Map(keys.map((contentKey) => {
    const known = item(contentKey);
    const record = { ...createInitialMemoryRecord(known.type, known.id, NOW), encounterCount: 2, memoryScore: 60 };
    return [contentKey, toMemoryView(contentKey, known.type, record, NOW)];
  }));
}

describe('searchStem', () => {
  it('lấy phần gốc khớp mọi cách chia', () => {
    expect(searchStem('食べます')).toBe('食べ');
    expect(searchStem('べんきょうします')).toBe('べんきょう');
    expect(searchStem('〜じん')).toBe('じん');
    expect(searchStem('大きい')).toBe('大き');
    expect(searchStem('いい')).toBe('いい');
    expect(searchStem('しんせつ[な]')).toBe('しんせつ');
  });
});

describe('context index', () => {
  it('gắn câu với từ vựng và kanji có trong câu', () => {
    const index = getContextIndex(catalog);
    const eatIds = index.sentencesFor(key('vocabulary', 71)).map((sentence) => sentence.id);
    expect(eatIds).toEqual(expect.arrayContaining(['tatoeba-2', 'tatoeba-3']));
    expect(eatIds).not.toContain('tatoeba-1');
    expect(eatIds.some((id) => id.startsWith('grammar-'))).toBe(true); // câu mẫu ngữ pháp cũng là ngữ cảnh
    expect(index.sentencesFor(key('vocabulary', 3)).map((sentence) => sentence.id)).toContain('tatoeba-1');
  });

  it('ưu tiên câu có nhiều thứ đã học và báo "Bạn đã từng gặp"', () => {
    const eat = item(key('vocabulary', 71));
    const withoutMemory = pickContextExample(catalog, eat, new Map());
    expect(withoutMemory?.jp).toBe('パンを食べた。'); // chưa biết gì → câu ít thứ lạ nhất
    expect(withoutMemory?.knownFaces).toEqual([]);

    const withMemory = pickContextExample(catalog, eat, learned(key('vocabulary', 1), key('vocabulary', 49)));
    expect(withMemory?.jp).toBe('私は朝ごはんを食べます。');
    expect(withMemory?.knownFaces).toEqual(expect.arrayContaining(['私', '朝']));
  });

  it('không có câu → null, thẻ vẫn dựng được', () => {
    const empty = buildKnowledgeCatalog({ ...seed, exampleSentences: [], grammar: seed.grammar.map((pattern) => ({ ...pattern, exampleJp: '' })) });
    const book = empty.byKey.get(key('vocabulary', 15))!;
    expect(pickContextExample(empty, book, new Map())).toBeNull();
    expect(buildDiscoverCard(book, empty, 17).example).toBeNull();
  });

  it('chữ cái có vài từ ví dụ bắt đầu bằng chữ đó', () => {
    const a = catalog.items.find((candidate) => candidate.type === 'hiragana' && candidate.face === 'あ')!;
    const words = kanaExampleWords(catalog, a);
    expect(words.length).toBeGreaterThan(0);
    expect(buildDiscoverCard(a, catalog, 1).exampleWords).toEqual(words);
  });

  it('câu thật để Dùng thử: đục đúng chỗ từ, phương án nhiễu cùng kiểu chữ', () => {
    const blank = realSentenceBlank(catalog, item(key('vocabulary', 71)))!;
    expect(blank.sentenceJp).toBe('パンを＿＿た。');
    expect(blank.answer).toBe('食べ');
    expect(blank.distractorPool.length).toBeGreaterThan(3);
    expect(blank.distractorPool.every((stem) => /[一-鿿]/.test(stem))).toBe(true);
    expect(blank.distractorPool).not.toContain('食べ');
  });
});
