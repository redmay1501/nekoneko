import rawSeedContent from '@content/seed/n5-content.json';
import rawExamples from '@content/seed/examples.json';
import rawKanjiRadicals from '@content/seed/kanji-radicals.json';
import rawGrammarNotes from '@content/seed/grammar-notes.json';
import type { N5Content } from '@/types/content';
import { type KanjiRadicalSource, withKanjiRadicals } from './kanji-radicals';
import { type GrammarNotesSource, withGrammarNotes } from './grammar-notes';

/**
 * Nội dung N5 dạng seed (sinh từ file Excel lộ trình bằng scripts/convert-roadmap.py).
 *
 * Dùng ở ba nơi — và CHỈ ba nơi:
 *  1. Chế độ demo (không có Supabase) — làm nguồn nội dung.
 *  2. scripts/seed-content.ts — để đưa vào Supabase.
 *  3. Unit test.
 * Khi chạy với Supabase, app đọc nội dung từ database, không đọc file này.
 */
export function loadSeedContent(): N5Content {
  // Câu ví dụ (Tatoeba), thành phần bộ thủ và ghi chú ngữ pháp nằm file riêng — không sinh từ Excel lộ trình.
  const raw = rawSeedContent as unknown as Omit<N5Content, 'exampleSentences' | 'kanjiRadicals'>;
  const base = withGrammarNotes({ ...raw, exampleSentences: rawExamples.sentences }, rawGrammarNotes as GrammarNotesSource);
  return withKanjiRadicals(base, rawKanjiRadicals as KanjiRadicalSource);
}
