import { DictationPanel } from '@/components/learning/PracticePanels';
import { KanjiWritingPanel } from '@/components/learning/KanjiWritingPanel';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildDictationPools, buildWritingPractice } from '@/features/learning/skill-practice';
import { knowledgeGroups } from '@/features/learning/study-actions';
import { getLearnerContext } from '@/features/learning/learner-context';

/**
 * SC-27 · Luyện viết — tay nhớ lâu hơn mắt. Không khoá theo ngày:
 *  - Nghe – gõ: chọn phạm vi (theo lộ trình / tất cả / một bài);
 *  - Viết tay Kanji: chọn nhóm 10 chữ, rồi chọn chữ.
 * Đổi phạm vi / chữ diễn ra ngay trong trình duyệt (dữ liệu có sẵn), không chuyển trang.
 */
export default async function WritingPage({ searchParams }: { searchParams: Promise<{ chu?: string; nhom?: string; 'pham-vi'?: string }> }) {
  const params = await searchParams;
  const { catalog, journeyDay, memoryViews } = await getLearnerContext();
  const groups = knowledgeGroups('kanji', itemsOfType(catalog, 'kanji'));
  const requestedGroup = groups.find((group) => group.id === params.nhom);
  const practice = buildWritingPractice(catalog, journeyDay, params.chu ?? (requestedGroup ? String(requestedGroup.items[0].id) : undefined));
  return (
    <>
      <h1>Luyện viết</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Nghe rồi gõ lại bằng tiếng Nhật — sau đó viết tay Kanji, chậm và đúng thứ tự nét.</p>
      <div className="sec-h" style={{ marginTop: 0 }}><h2>🎧 Nghe – gõ</h2></div>
      <DictationPanel pools={buildDictationPools(catalog, memoryViews, journeyDay)} initialRange={params['pham-vi']} />
      <div className="sec-h"><h2>✍️ Viết tay Kanji</h2></div>
      <KanjiWritingPanel initialId={practice.focus.id}
        groups={groups.map((group) => ({ id: group.id, label: group.label, ids: group.items.map((item) => item.id) }))}
        kanji={catalog.content.kanji.map((item) => ({
          id: item.id, character: item.character, hanViet: item.hanViet, meaning: item.meaning, strokes: item.strokes,
          onReading: item.onReading, kunReading: item.kunReading, tip: item.tip,
        }))} />
    </>
  );
}
