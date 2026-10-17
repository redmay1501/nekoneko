import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import { TestPicker } from '@/components/learning/TestPicker';
import { itemsOfType, primaryRadicalGlyph } from '@/features/learning/knowledge-catalog';
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
  const scheduled = radicals.filter((radical) => radical.day !== null);
  const reference = radicals.filter((radical) => radical.day === null);
  // Kiểm tra theo các bộ của lộ trình (bộ tham khảo không có ngày học riêng).
  const testGroups = buildTestGroups('radical', itemsOfType(catalog, 'radical').filter((item) => item.day !== null), memoryViews);
  return (
    <>
      <div className="title-count"><h1>Bộ thủ</h1><span className="chip lav">{learned}/{scheduled.length}</span></div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>
        Bộ thủ là mảnh ghép tạo nên Kanji. Không cần học thuộc trước — khi gặp Kanji mới, nhìn bộ thủ để đoán nghĩa và nhớ lâu hơn.
      </p>
      <TestPicker groups={testGroups} unit="bộ" />
      <RadicalGrid radicals={scheduled} />
      {reference.length ? (
        <>
          <div className="sec-h"><h2>Bộ tham khảo</h2><span className="tiny muted">{reference.length} bộ</span></div>
          <p className="sm soft mb-2.5">Bộ chính của một số Kanji N5 — không có ngày học riêng, bạn gặp chúng khi học Kanji.</p>
          <RadicalGrid radicals={reference} />
        </>
      ) : null}
    </>
  );
}
