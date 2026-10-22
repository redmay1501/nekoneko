import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { KnowledgeGardenFrame, type KnowledgeGardenCard } from '@/components/learning/KnowledgeGardenFrame';
import { TestPicker } from '@/components/learning/TestPicker';
import { itemsOfType, primaryRadicalGlyph } from '@/features/learning/knowledge-catalog';
import { kanjiContainingRadical, vocabularyContainingKanji } from '@/features/learning/knowledge-relations';
import { countLearnedOfType } from '@/features/learning/knowledge-library';
import { toContentKey } from '@/features/learning/knowledge-types';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildTestGroups } from '@/features/learning/study-actions';
import type { RadicalContent } from '@/types/content';
import { firstMeaning } from '@/lib/utils/text';

function RadicalGrid({ radicals }: { radicals: RadicalContent[] }) {
  return (
    <div className="radical-grid">
      {radicals.map((radical) => (
        <KnowledgeChipButton key={radical.id} contentKey={toContentKey('radical', radical.id)} className="kcard"
          label={`Bộ ${radical.radical} — ${radical.meaning}`}>
          <span className="big">{primaryRadicalGlyph(radical.radical)}</span>
          <b>{firstMeaning(radical.meaning)}</b>
          <span>{radical.nameJp.split(' / ')[0]}</span>
        </KnowledgeChipButton>
      ))}
    </div>
  );
}

/** SC-16 · Bộ thủ — mảnh ghép tạo nên Kanji. Lưới 3 cột; bấm một bộ để mở chi tiết (mẹo nhớ, Kanji chứa bộ này). */
export default async function RadicalsPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const { learned } = countLearnedOfType(catalog, memoryViews, 'radical');
  const radicals = [...catalog.content.radicals].sort((left, right) => (left.day ?? 999) - (right.day ?? 999) || left.id - right.id);
  const gardenCardsOf = (items: RadicalContent[]): KnowledgeGardenCard[] => items.map((item) => {
    const key = toContentKey('radical', item.id);
    const related = kanjiContainingRadical(catalog, item);
    const firstKanji = related[0];
    const firstWord = firstKanji ? vocabularyContainingKanji(catalog, firstKanji)[0] : undefined;
    return {
      contentKey: key, character: primaryRadicalGlyph(item.radical), romaji: item.nameJp,
      row: item.day === null ? 'Bộ tham khảo' : `Ngày ${item.day}`,
      meaning: firstMeaning(item.meaning), tip: item.tip, status: memoryViews.get(key)?.status ?? 'new',
      details: [
        { value: item.radical },
        { value: item.tip || '—' },
      ],
      relatedKanji: related.map((kanji) => ({ character: kanji.character, meaning: firstMeaning(kanji.meaning) })),
      chain: [
        { face: primaryRadicalGlyph(item.radical), caption: `Bộ ${firstMeaning(item.meaning).toLowerCase()}` },
        ...(firstKanji ? [{ face: firstKanji.character, caption: `${firstKanji.hanViet} · ${firstKanji.meaning}` }] : []),
        ...(firstWord ? [{ face: firstWord.kanji || firstWord.kana, caption: firstWord.meaning }] : []),
      ],
    };
  });
  // Trang Bộ thủ có cả 45 bộ theo lộ trình và 26 bộ tham khảo, tổng cộng 71 bộ.
  const testGroups = buildTestGroups('radical', itemsOfType(catalog, 'radical'), memoryViews);
  return (
    <>
      <KnowledgeGardenFrame cards={gardenCardsOf(radicals)} label="bộ thủ" title="Bộ thủ" count={`${learned}/${radicals.length}`}
        description="Bộ thủ là mảnh ghép của Kanji, giúp bạn đoán nghĩa và ghi nhớ mặt chữ.">
        <TestPicker groups={testGroups} unit="bộ" />
      </KnowledgeGardenFrame>
      <details className="knowledge-catalog-toggle">
        <summary>Xem danh sách toàn bộ bộ thủ ({radicals.length})</summary>
        <RadicalGrid radicals={radicals} />
      </details>
    </>
  );
}
