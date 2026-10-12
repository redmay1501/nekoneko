import { NekoButton } from '@/components/common/NekoButton';
import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { toContentKey } from '@/features/learning/knowledge-types';
import { focusSessionHref } from '@/features/learning/session-modes';
import type { VocabularyContent } from '@/types/content';
import { firstMeaning } from '@/lib/utils/text';

/** Ngày ôn nhiều từ (bài 1–10…): hiện sẵn chừng này, còn lại mở thêm khi muốn — trang không dài lê thê. */
const VISIBLE_WORDS = 12;

function WordChip({ word }: { word: VocabularyContent }) {
  return (
    <KnowledgeChipButton contentKey={toContentKey('vocabulary', word.id)} className="review-word" label={`${word.kanji || word.kana} — ${firstMeaning(word.meaning)}`}>
      <b className="jp">{word.kanji || word.kana}</b>
      <span>{firstMeaning(word.meaning)}</span>
    </KnowledgeChipButton>
  );
}

/**
 * "Từ vựng cần ôn — N từ": một nhóm kiến thức để ôn (không phải đoạn văn). Mỗi từ một thẻ gọn (mặt chữ + nghĩa ngắn),
 * bấm để xem chi tiết và nghe; nút "Ôn N từ" mở phiên học theo lựa chọn với đúng các từ này (ghi trí nhớ thật).
 */
export function DayReviewVocabulary({ words }: { words: VocabularyContent[] }) {
  const keys = words.map((word) => toContentKey('vocabulary', word.id));
  return (
    <section className="card tight mt-3 review-vocabulary" aria-label="Từ vựng cần ôn">
      <div className="between" style={{ gap: 10, flexWrap: 'wrap' }}>
        <b>📚 Từ vựng cần ôn — {words.length} từ</b>
        <NekoButton href={focusSessionHref(keys)} variant="review" catPose="none" className="neko-btn-compact">Ôn {words.length} từ</NekoButton>
      </div>
      <div className="review-words mt-2.5">
        {words.slice(0, VISIBLE_WORDS).map((word) => <WordChip key={word.id} word={word} />)}
      </div>
      {words.length > VISIBLE_WORDS ? (
        <details className="mt-2">
          <summary className="sm link">Xem thêm {words.length - VISIBLE_WORDS} từ</summary>
          <div className="review-words mt-2">{words.slice(VISIBLE_WORDS).map((word) => <WordChip key={word.id} word={word} />)}</div>
        </details>
      ) : null}
    </section>
  );
}
