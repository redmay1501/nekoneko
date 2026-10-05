/**
 * Lấy câu ví dụ tiếng Nhật – tiếng Việt từ Tatoeba (https://tatoeba.org) cho từ vựng & kanji N5.
 *
 *   npx tsx scripts/fetch-examples.ts
 *
 * Ra: content/seed/examples.json (commit vào repo, rồi `npm run seed:content` để đưa vào Supabase).
 * Giấy phép: câu Tatoeba là CC BY 2.0 FR — mỗi câu giữ mã câu + người đóng góp để ghi nguồn (màn Cài đặt).
 *
 * Lọc cho người học N5: câu ngắn, CHỈ dùng kanji trong 103 kanji N5, có bản dịch tiếng Việt đã được duyệt.
 * Chạy lại được bất cứ lúc nào (kết quả tất định theo dữ liệu Tatoeba lúc chạy).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { searchStem } from '../src/features/learning/context-index';
import type { N5Content } from '../src/types/content';

const API = 'https://api.tatoeba.org/unstable/sentences';
const OUT = join(process.cwd(), 'content', 'seed', 'examples.json');
// Đọc thẳng file nội dung (không qua loadSeedContent — hàm đó lại cần chính examples.json do script này tạo).
const CONTENT = join(process.cwd(), 'content', 'seed', 'n5-content.json');
const MAX_SENTENCE_LENGTH = 24;
const EXAMPLES_PER_ITEM = 2;
const REQUEST_GAP_MS = 250;
const PARALLEL_REQUESTS = 3;
const KANJI = /[一-鿿々]/g;

interface TatoebaTranslation {
  id: number;
  text: string;
  lang: string;
  owner: string | null;
  is_unapproved: boolean;
  /** false = bản dịch gián tiếp (đi vòng qua ngôn ngữ khác) — hay lệch nghĩa, không dùng. */
  is_direct?: boolean;
}

interface TatoebaSentence {
  id: number;
  text: string;
  owner: string | null;
  is_unapproved: boolean;
  translations: TatoebaTranslation[] | TatoebaTranslation[][];
}

export interface ExampleSentenceSeed {
  id: number;
  jp: string;
  vi: string;
  /** Mã câu tiếng Việt trên Tatoeba (ghi nguồn bản dịch). */
  viId: number;
  owner: string | null;
  viOwner: string | null;
}

/** Từ khoá tìm = cùng phần gốc mà ứng dụng dùng để khớp câu (context-index.ts), để câu lấy về chắc chắn khớp được. */
const searchTerm = searchStem;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function search(term: string): Promise<TatoebaSentence[]> {
  const url = `${API}?lang=jpn&q=${encodeURIComponent(term)}&trans:lang=vie&sort=words&limit=40`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return ((await response.json()) as { data: TatoebaSentence[] }).data ?? [];
    } catch {
      // mạng chập chờn → thử lại
    }
    await sleep(1000 * attempt);
  }
  return [];
}

async function main() {
  const content = JSON.parse(readFileSync(CONTENT, 'utf8')) as N5Content;
  const n5Kanji = new Set(content.kanji.map((kanji) => kanji.character));
  const isN5Sentence = (text: string) => text.length <= MAX_SENTENCE_LENGTH && !/[A-Za-z0-9Ａ-Ｚａ-ｚ０-９]/.test(text)
    && (text.match(KANJI) ?? []).every((character) => n5Kanji.has(character));

  const terms = new Set<string>();
  for (const word of content.vocabulary) terms.add(searchTerm(word.kanji || word.kana));
  for (const kanji of content.kanji) terms.add(kanji.character);

  const sentences = new Map<number, ExampleSentenceSeed>();
  let done = 0;
  const queue = [...terms].filter((term) => term.length >= 2 || /[一-鿿]/.test(term));
  const worker = async () => { for (let term = queue.shift(); term !== undefined; term = queue.shift()) await fetchTerm(term); };
  async function fetchTerm(term: string) {
    const found = (await search(term))
      .filter((sentence) => !sentence.is_unapproved && sentence.text.includes(term) && isN5Sentence(sentence.text))
      .flatMap((sentence) => {
        // Chỉ bản dịch TRỰC TIẾP (nhóm đầu): bản dịch gián tiếp đi vòng qua ngôn ngữ khác, hay lệch nghĩa hẳn.
        const vi = sentence.translations.flat()
          .find((translation) => translation.lang === 'vie' && translation.is_direct === true && !translation.is_unapproved);
        return vi ? [{ id: sentence.id, jp: sentence.text, vi: vi.text, viId: vi.id, owner: sentence.owner, viOwner: vi.owner }] : [];
      })
      .sort((left, right) => left.jp.length - right.jp.length)
      .slice(0, EXAMPLES_PER_ITEM);
    for (const example of found) sentences.set(example.id, example);
    done++;
    if (done % 50 === 0) console.log(`… ${done}/${terms.size} từ khoá, ${sentences.size} câu`);
    await sleep(REQUEST_GAP_MS);
  }
  await Promise.all(Array.from({ length: PARALLEL_REQUESTS }, worker));

  const result = [...sentences.values()].sort((left, right) => left.id - right.id);
  writeFileSync(OUT, `${JSON.stringify({
    _note: 'Câu ví dụ từ Tatoeba (https://tatoeba.org), giấy phép CC BY 2.0 FR. Sinh bằng scripts/fetch-examples.ts.',
    sentences: result,
  }, null, 1)}\n`);
  console.log(`✓ ${result.length} câu ví dụ → ${OUT}`);
}

main().catch((error: unknown) => {
  console.error('✗ Lấy câu ví dụ thất bại', error);
  process.exit(1);
});
