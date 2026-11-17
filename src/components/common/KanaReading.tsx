import { hasKanji, readingRomaji } from '@/lib/utils/romaji';

/**
 * Cách đọc của một đáp án có Kanji: "がっこう · gakkō". Chữ không có Kanji / không có cách đọc → không hiện gì.
 * Dùng SAU khi người học đã trả lời (luyện tập / kiểm tra), để đáp án Kanji luôn đi kèm kana + romaji.
 */
export function KanaReading({ text, reading, block = false, className = '' }: {
  text: string;
  reading: string | null | undefined;
  /** Xuống dòng riêng (dưới đáp án) thay vì nằm cùng dòng. */
  block?: boolean;
  className?: string;
}) {
  const kana = reading?.trim();
  if (!kana || kana === text.trim() || !hasKanji(text) || hasKanji(kana)) return null;
  const romaji = readingRomaji(kana);
  return (
    <span className={`kana-reading ${block ? 'is-block' : ''} ${className}`.trim()}>
      <span className="jp">{kana}</span>
      {romaji ? <span className="kana-reading-romaji"> · {romaji}</span> : null}
    </span>
  );
}
