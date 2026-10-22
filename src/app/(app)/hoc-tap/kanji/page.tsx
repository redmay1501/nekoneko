import { KanaClassroomFrame } from '@/components/learning/KanaClassroomFrame';
import { TestPicker } from '@/components/learning/TestPicker';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { buildTestGroups } from '@/features/learning/study-actions';
import { countLearnedOfType, kanjiRows } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** Kanji N5 dùng lớp học 2D để xem thứ tự nét và luyện viết ngay trên bảng. */
export default async function KanjiPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const testGroups = buildTestGroups('kanji', itemsOfType(catalog, 'kanji'), memoryViews);
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'kanji');
  const rows = kanjiRows(catalog, memoryViews);
  const kanjiById = new Map(catalog.content.kanji.map((item) => [item.id, item]));
  const items = rows.map((row) => {
    const kanji = kanjiById.get(Number(row.contentKey.slice('kanji-'.length)))!;
    return {
      contentKey: row.contentKey,
      character: kanji.character,
      romaji: [kanji.onReading, kanji.kunReading].filter(Boolean).join(' ・ '),
      tip: kanji.tip,
      status: row.status,
    };
  });

  return (
    <KanaClassroomFrame items={items} kind="kanji" count={`${learned}/${total}`}>
      <TestPicker groups={testGroups} unit="chữ" />
    </KanaClassroomFrame>
  );
}
