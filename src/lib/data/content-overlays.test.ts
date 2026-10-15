import { describe, expect, it } from 'vitest';
import type { N5Content } from '@/types/content';
import { applyContentOverlays, storagePublicUrl } from './content-overlays';

const base = {
  vocabulary: [
    { id: 1, kana: 'ねこ', kanji: '猫', meaning: 'con mèo', tip: '', lesson: 'Bài 1', day: 1 },
    { id: 2, kana: 'いぬ', kanji: '犬', meaning: 'con chó', tip: '', lesson: 'Bài 1', day: 1 },
  ],
  kanji: [{ id: 5, character: '日', hanViet: 'Nhật', meaning: 'mặt trời', onReading: '', kunReading: '', strokes: 4, words: '', tip: '', day: 3 }],
  radicals: [{ id: 9, radical: '日', nameJp: '', meaning: 'mặt trời', kanjiList: '', tip: '', day: 3 }],
  grammar: [],
  kanjiRadicals: [{ kanjiId: 5, radicalId: 9, position: 0 }],
} as unknown as N5Content;
const url = (path: string) => `https://cdn/${path}`;

describe('applyContentOverlays', () => {
  it('không có lớp phủ → giữ nguyên, không có ảnh', () => {
    const content = applyContentOverlays(base, [], [], url);
    expect(content.vocabulary).toHaveLength(2);
    expect(content.vocabulary[0].image).toBeUndefined();
  });
  it('từ vựng có ảnh → gắn url công khai và alt', () => {
    const content = applyContentOverlays(base, [], [{ content_type: 'vocabulary', content_id: 1, alt_text: 'Mèo', storage_path: '2026/10/a.webp' }], url);
    expect(content.vocabulary[0].image).toEqual({ url: 'https://cdn/2026/10/a.webp', alt: 'Mèo' });
    expect(content.vocabulary[1].image).toBeUndefined();
  });
  it('ẩn mục nháp / chờ duyệt / lưu trữ, giữ mục published', () => {
    const content = applyContentOverlays(base, [
      { content_type: 'vocabulary', content_id: 2, status: 'draft' },
      { content_type: 'vocabulary', content_id: 1, status: 'published' },
      { content_type: 'kanji', content_id: 5, status: 'archived' },
    ], [], url);
    expect(content.vocabulary.map((word) => word.id)).toEqual([1]);
    expect(content.kanji).toHaveLength(0);
    expect(content.kanjiRadicals).toHaveLength(0);
  });
  it('trạng thái của loại khác không ảnh hưởng (vocabulary 5 ≠ kanji 5)', () => {
    const content = applyContentOverlays(base, [{ content_type: 'vocabulary', content_id: 5, status: 'draft' }], [], url);
    expect(content.kanji).toHaveLength(1);
  });
});

describe('storagePublicUrl', () => {
  it('ghép đường dẫn công khai, mã hoá từng đoạn', () => {
    expect(storagePublicUrl('https://x.supabase.co/', 'content-media', '2026/10/a b.png'))
      .toBe('https://x.supabase.co/storage/v1/object/public/content-media/2026/10/a%20b.png');
  });
});
