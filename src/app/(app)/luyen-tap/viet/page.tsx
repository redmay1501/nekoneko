import { DictationPanel } from '@/components/learning/PracticePanels';
import { KanjiWritingPanel } from '@/components/learning/KanjiWritingPanel';
import { SectionTabs } from '@/components/common/SectionTabs';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildDictationPools, buildWritingPractice } from '@/features/learning/skill-practice';
import { knowledgeGroups } from '@/features/learning/study-actions';
import { getLearnerContext } from '@/features/learning/learner-context';
import { WritingNotebook } from '@/components/writing/WritingNotebook';
import { LottieAnimation } from '@/components/common/LottieAnimation';
import { buildNotebooks } from '@/features/writing/notebook';
import { notebookProgressMap } from '@/features/writing/notebook-progress';

/**
 * SC-27 · Luyện viết — tay nhớ lâu hơn mắt. Hai tab độc lập (chuyển tab không mất chữ đang gõ / nét đang viết). Không khoá theo ngày:
 *  - Nghe – gõ: chọn phạm vi (theo lộ trình / tất cả / một bài);
 *  - Viết tay Kanji: chọn nhóm 10 chữ, rồi chọn chữ;
 *  - Sổ luyện viết: vở tập viết — mỗi dòng một chữ, nhiều ô lặp lại (Hiragana, Katakana, Kanji, Bộ thủ).
 * Đổi phạm vi / chữ diễn ra ngay trong trình duyệt (dữ liệu có sẵn), không chuyển trang.
 */
export default async function WritingPage({ searchParams }: { searchParams: Promise<{ chu?: string; nhom?: string; 'pham-vi'?: string; muc?: string; so?: string; trang?: string }> }) {
  const params = await searchParams;
  const { catalog, journeyDay, memoryViews, settings } = await getLearnerContext();
  const notebooks = buildNotebooks(catalog.content);
  const groups = knowledgeGroups('kanji', itemsOfType(catalog, 'kanji'));
  const requestedGroup = groups.find((group) => group.id === params.nhom);
  const practice = buildWritingPractice(catalog, journeyDay, params.chu ?? (requestedGroup ? String(requestedGroup.items[0].id) : undefined));
  return (
    <>
      <h1>Luyện viết</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>Ba cách luyện viết — chọn một tab.</p>
      {/* Mở thẳng tab Kanji khi đến từ trang chi tiết Kanji (?chu=) hoặc chọn nhóm (?nhom=). */}
      <SectionTabs param="muc" label="Cách luyện viết" initialTab={params.muc ?? (params.chu || params.nhom ? 'kanji' : params.so ? 'so' : undefined)} tabs={[
        {
          id: 'nghe-go', label: '🎧 Nghe và gõ',
          content: (
            <>
              <div className="page-hero-cat">
                <p className="soft sm mb-2.5">Nghe từ hoặc câu, rồi gõ lại bằng tiếng Nhật (kana hoặc chữ Hán).</p>
                {/* Mèo gõ laptop (Lottie) — trang trí. */}
                <LottieAnimation src="/animations/cat-typing.json" className="page-hero-cat-art" stillFrame={40} />
              </div>
              <DictationPanel pools={buildDictationPools(catalog, memoryViews, journeyDay)} initialRange={params['pham-vi']} />
            </>
          ),
        },
        {
          id: 'kanji', label: '✍️ Viết tay Kanji',
          content: (
            <>
              <p className="soft sm mb-2.5">Xem thứ tự nét, rồi viết đè lên chữ mờ — chậm và đúng thứ tự.</p>
              <KanjiWritingPanel initialId={practice.focus.id}
                groups={groups.map((group) => ({ id: group.id, label: group.label, ids: group.items.map((item) => item.id) }))}
                kanji={catalog.content.kanji.map((item) => ({
                  id: item.id, character: item.character, hanViet: item.hanViet, meaning: item.meaning, strokes: item.strokes,
                  onReading: item.onReading, kunReading: item.kunReading, tip: item.tip,
                }))} />
            </>
          ),
        },
        {
          id: 'so', label: '📓 Sổ luyện viết',
          content: (
            <WritingNotebook notebooks={notebooks} initialNotebookId={params.so} initialPageNumber={Number(params.trang) || undefined}
              initialProgress={notebookProgressMap(settings.gameRecords, notebooks.flatMap((notebook) => notebook.pages))} />
          ),
        },
      ]} />
    </>
  );
}
