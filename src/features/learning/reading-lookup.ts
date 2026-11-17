import { hasKanji } from '@/lib/utils/romaji';
import { searchStem } from './context-index';
import type { KnowledgeCatalog } from './knowledge-catalog';

/**
 * Bảng tra cách đọc kana cho chữ có Kanji trong kho kiến thức: từ vựng (kể cả phần gốc dùng trong câu điền chỗ trống),
 * Kanji (âm Kun, không có thì On), câu ví dụ ngữ pháp. Dùng để đáp án Kanji của bài luyện / kiểm tra hiện kèm kana + romaji.
 */
const cache = new WeakMap<KnowledgeCatalog, ReadonlyMap<string, string>>();

const clean = (raw: string) => raw.split(/[／/・、]/)[0].replace(/\[[^\]]*\]/g, '').replace(/[〜～\s()（）]/g, '');

export function readingLookup(catalog: KnowledgeCatalog): ReadonlyMap<string, string> {
  const cached = cache.get(catalog);
  if (cached) return cached;
  const map = new Map<string, string>();
  const add = (text: string | null | undefined, reading: string | null | undefined) => {
    const key = text?.trim();
    const kana = reading?.trim();
    if (!key || !kana || map.has(key) || !hasKanji(key) || hasKanji(kana) || key === kana) return;
    map.set(key, kana);
  };
  for (const item of catalog.items) {
    if (item.type === 'vocabulary') {
      const { kanji, kana } = item.content;
      add(item.face, kana);
      if (!kanji) continue;
      // Phần gốc (câu điền chỗ trống dùng 食べ thay vì 食べる): bỏ đúng phần đuôi kana tương ứng.
      const fullKanji = clean(kanji);
      const fullKana = clean(kana);
      const stem = searchStem(kanji);
      const tail = fullKanji.slice(stem.length);
      if (stem && stem !== fullKanji && fullKanji.startsWith(stem) && fullKana.endsWith(tail)) add(stem, fullKana.slice(0, fullKana.length - tail.length));
      add(fullKanji, fullKana);
    } else if (item.type === 'kanji') {
      add(item.face, item.reading);
    } else if (item.type === 'grammar') {
      add(item.content.exampleJp, item.content.exampleReading);
      add(item.content.example2Jp, item.content.example2Reading);
    }
  }
  cache.set(catalog, map);
  return map;
}

/** Cách đọc của những chữ có Kanji trong danh sách (chỉ những chữ tra được). Không có gì → undefined. */
export function readingsFor(texts: ReadonlyArray<string | null | undefined>, lookup: ReadonlyMap<string, string>): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const text of texts) {
    const reading = text ? lookup.get(text.trim()) : undefined;
    if (text && reading) out[text] = reading;
  }
  return Object.keys(out).length ? out : undefined;
}
