import { describe, expect, it } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildKnowledgeCatalog } from './knowledge-catalog';
import { firstSpokenReading, speechTextFor } from './speech-text';

const catalog = buildKnowledgeCatalog(loadSeedContent());
const LATIN_LETTERS = /[A-Za-z]/;
const NOTATION = /[()（）・/／\-〜～~]/;

describe('speechTextFor — chữ được đọc thành tiếng', () => {
  it('chữ cái đọc chính mặt chữ, không đọc romaji', () => {
    const a = catalog.items.find((item) => item.type === 'hiragana' && item.face === 'あ');
    expect(a && speechTextFor(a)).toBe('あ');
  });

  it('không kiến thức nào đọc ra chữ Latin hay ký hiệu chú thích', () => {
    for (const item of catalog.items.filter((entry) => entry.type !== 'grammar')) {
      const text = speechTextFor(item);
      expect(text, item.key).not.toBe('');
      expect(LATIN_LETTERS.test(text), `${item.key}: ${text}`).toBe(false);
      expect(NOTATION.test(text), `${item.key}: ${text}`).toBe(false);
    }
  });

  it('lấy cách đọc đầu tiên và bỏ ký hiệu okurigana', () => {
    expect(firstSpokenReading('ひと(つ)・ひと')).toBe('ひとつ');
    expect(firstSpokenReading('ひと / にんべん')).toBe('ひと');
    expect(firstSpokenReading('-か')).toBe('か');
    expect(firstSpokenReading('')).toBe('');
  });
});
