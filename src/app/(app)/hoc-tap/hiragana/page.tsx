import { KanaPractice } from '@/components/learning/KanaPractice';
import { StudyActionBar } from '@/components/learning/StudyActionBar';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildStudyActions } from '@/features/learning/study-actions';
import { buildKanaPractice } from '@/features/learning/kana-practice';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toIsoDate } from '@/lib/utils/dates';

/** SC-14 · Hiragana — học → nghe → nhận diện → luyện viết → kiểm tra → gặp lại. */
export default async function HiraganaPage({ searchParams }: { searchParams: Promise<{ viet?: string }> }) {
  const { viet } = await searchParams;
  const { catalog, memoryViews, now } = await getLearnerContext();
  const data = buildKanaPractice('hiragana', catalog.content.kana, memoryViews, toIsoDate(now));
  const actions = buildStudyActions(itemsOfType(catalog, 'hiragana'), memoryViews, toIsoDate(now));
  return (
    <>
      <div className="between">
        <h1>Hiragana</h1>
        <span className="chip mint">{data.learnedCount}/{data.cells.length}</span>
      </div>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>Mỗi chữ đều có: học → nghe → nhận diện → luyện viết → kiểm tra → gặp lại.</p>
      <StudyActionBar actions={actions} unit="chữ" />
      <KanaPractice data={data} initialWriting={viet} />
    </>
  );
}
