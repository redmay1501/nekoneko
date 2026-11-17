import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { hasKanji, readingRomaji } from '@/lib/utils/romaji';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { readingLookup, readingsFor } from './reading-lookup';

const catalog = buildKnowledgeCatalog(loadSeedContent());

describe('readingLookup', () => {
  const lookup = readingLookup(catalog);

  it('từ vựng, Kanji và câu ví dụ ngữ pháp có Kanji đều tra được cách đọc kana', () => {
    const word = catalog.content.vocabulary.find((entry) => entry.kanji && hasKanji(entry.kanji))!;
    expect(lookup.get(word.kanji!)).toBe(word.kana);
    const kanji = catalog.items.find((item) => item.type === 'kanji' && item.reading)!;
    expect(lookup.get(kanji.face)).toBe(kanji.reading);
    const pattern = catalog.content.grammar.find((entry) => hasKanji(entry.exampleJp) && entry.exampleReading)!;
    expect(lookup.get(pattern.exampleJp)).toBe(pattern.exampleReading);
  });

  it('cách đọc không bao giờ còn Kanji; chữ không có Kanji thì không có mục', () => {
    for (const [text, reading] of lookup) {
      expect(hasKanji(text)).toBe(true);
      expect(hasKanji(reading)).toBe(false);
    }
    expect(readingsFor(['すし', 'Nghĩa tiếng Việt'], lookup)).toBeUndefined();
  });
});

describe('readingRomaji', () => {
  it('từ đơn và câu có khoảng trắng', () => {
    expect(readingRomaji('がっこう')).toBe('gakkō');
    expect(readingRomaji('わたし は がくせい です。')).toBe('watashi wa gakusei desu.');
  });
});
