import Link from 'next/link';
import { KanaClassroomFrame } from '@/components/learning/KanaClassroomFrame';
import { KanaPractice } from '@/components/learning/KanaPractice';
import { TestPicker } from '@/components/learning/TestPicker';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildTestGroups } from '@/features/learning/study-actions';
import { buildKanaPractice } from '@/features/learning/kana-practice';
import { toContentKey } from '@/features/learning/knowledge-types';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toIsoDate } from '@/lib/utils/dates';

/** SC-15 · Katakana — học → nghe → nhận diện → luyện viết → kiểm tra → gặp lại. */
export default async function KatakanaPage({ searchParams }: { searchParams: Promise<{ viet?: string; muc?: string }> }) {
  const { viet, muc } = await searchParams;
  const { catalog, memoryViews, now } = await getLearnerContext();
  const data = buildKanaPractice('katakana', catalog.content.kana, memoryViews, toIsoDate(now));
  const testGroups = buildTestGroups('katakana', itemsOfType(catalog, 'katakana'), memoryViews);
  const items = catalog.content.kana.map((entry, index) => ({
    contentKey: toContentKey('katakana', entry.id), character: data.cells[index].character,
    romaji: entry.romaji, tip: entry.tip, status: data.cells[index].status,
  }));
  if (muc === 'nghe') return (
    <main className="view">
      <div className="row mb-2">
        <Link className="btn ghost sm" href="/hoc-tap/katakana">← Quay lại lớp học</Link>
      </div>
      <div className="title-count"><h1>Luyện nghe Katakana</h1></div>
      <KanaPractice data={data} initialTab="listen" />
    </main>
  );
  return (
    <KanaClassroomFrame items={items} kind="katakana" count={`${data.learnedCount}/${data.cells.length}`} initialCharacter={viet} listeningHref="/hoc-tap/katakana?muc=nghe">
      <TestPicker groups={testGroups} unit="chữ" />
    </KanaClassroomFrame>
  );
}
