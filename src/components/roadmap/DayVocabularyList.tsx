import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { toContentKey } from '@/features/learning/knowledge-types';
import type { VocabularyContent } from '@/types/content';
import { firstMeaning } from '@/lib/utils/text';
import { vocabularyRomaji } from '@/lib/utils/romaji';

/**
 * Cách đọc dưới mặt chữ: từ có chữ Hán → kana + romaji (事務所 · じむしょ · jimusho);
 * từ chỉ viết bằng kana → chỉ romaji (あちら · achira), không lặp lại kana lần nữa.
 */
function WordReading({ word }: { word: VocabularyContent }) {
  return (
    <span className="day-vocab-reading">
      {word.kanji ? <><span className="jp">{word.kana}</span> · </> : null}
      <span className="romaji">{vocabularyRomaji(word)}</span>
    </span>
  );
}

/**
 * Từ vựng của ngày: mỗi từ một dòng gọn (mặt chữ · cách đọc · nghĩa ngắn). Bấm → khay chi tiết dùng chung với
 * trang Từ vựng (nghe phát âm, ví dụ trong câu, Kanji trong từ, mẹo nhớ nếu có) — không làm bản nghèo nàn riêng.
 */
export function DayVocabularyList({ words, title = 'Từ vựng' }: { words: VocabularyContent[]; title?: string }) {
  return (
    <div className="stack mt-2.5" style={{ gap: 6 }}>
      <span className="tiny muted">{title} · {words.length} từ — bấm để xem chi tiết và nghe</span>
      {words.map((word) => (
        <KnowledgeChipButton key={word.id} contentKey={toContentKey('vocabulary', word.id)} className="list-row" style={{ padding: '9px 12px' }}
          label={`${word.kanji || word.kana} — ${firstMeaning(word.meaning)}`}>
          <span className="mid">
            <b className="jp" style={{ fontSize: 15 }}>{word.kanji || word.kana}</b>
            <WordReading word={word} />
            <span>{firstMeaning(word.meaning)}</span>
          </span>
          <span className="end"><span className="tiny muted" aria-hidden="true">›</span></span>
        </KnowledgeChipButton>
      ))}
    </div>
  );
}
