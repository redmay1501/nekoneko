import { hasKana, hasKanji, readingRomaji } from '@/lib/utils/romaji';

/** Đáp án là trợ từ đứng riêng: đọc theo trợ từ (は = wa, へ = e, を = o), không theo mặt chữ. */
const PARTICLE_ROMAJI: Record<string, string> = { 'は': 'wa', 'へ': 'e', 'を': 'o' };

/** Có chữ La-tinh / tiếng Việt → không phải chữ Nhật thuần (nghĩa tiếng Việt, romaji) — không phiên âm. */
const LATIN = /[A-Za-zÀ-ỹ]/;

/**
 * Cách đọc của một đáp án tiếng Nhật, hiện SAU khi người học đã trả lời (luyện tập / kiểm tra):
 *  - có Kanji → kana + romaji: "がっこう · gakkō" (cần `reading`; không có thì không hiện gì);
 *  - chỉ có kana (hiragana / katakana) → romaji: "enjinia".
 * Nghĩa tiếng Việt, romaji, câu trộn chữ La-tinh → không hiện gì.
 */
export function KanaReading({ text, reading, block = false, isParticle = false, className = '' }: {
  text: string;
  reading?: string | null;
  /** Xuống dòng riêng (dưới đáp án) thay vì nằm cùng dòng. */
  block?: boolean;
  /** Đáp án là trợ từ (bài trợ từ / điền chỗ trống ngữ pháp): は đọc wa. Mặc định là chữ cái / từ: は đọc ha. */
  isParticle?: boolean;
  className?: string;
}) {
  const source = text.trim();
  if (!source || LATIN.test(source)) return null;
  const classes = `kana-reading ${block ? 'is-block' : ''} ${className}`.trim();
  if (!hasKanji(source)) {
    const romaji = (isParticle ? PARTICLE_ROMAJI[source] : undefined) ?? (hasKana(source) ? readingRomaji(source) : '');
    return romaji ? <span className={classes}><span className="kana-reading-romaji">{romaji}</span></span> : null;
  }
  const kana = reading?.trim();
  if (!kana || kana === source || hasKanji(kana)) return null;
  const romaji = readingRomaji(kana);
  return (
    <span className={classes}>
      <span className="jp">{kana}</span>
      {romaji ? <span className="kana-reading-romaji"> · {romaji}</span> : null}
    </span>
  );
}
