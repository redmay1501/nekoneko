import Link from 'next/link';
import { RadarList } from '@/components/memory/RadarItem';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toKnowledgeListEntries } from '@/features/learning/knowledge-list';
import { joinWithKnowledge, viewsWithStatus } from '@/features/memory/memory-overview';

/** SC-31 · Kiến thức chưa vững — mới học, cần gặp thêm vài lần. */
export default async function WeakKnowledgePage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const weak = joinWithKnowledge(catalog, viewsWithStatus(memoryViews, 'weak').sort((left, right) => left.memoryScore - right.memoryScore));
  return (
    <>
      <Link className="link" href="/theo-doi?tab=tri-nho">← Trí nhớ</Link>
      <h1 className="mt-1">Kiến thức chưa vững</h1>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>Những thứ mới học, cần gặp thêm vài lần để bám rễ.</p>
      <RadarList entries={toKnowledgeListEntries(weak.map((entry) => entry.item), memoryViews)} emptyText="Không có gì chưa vững." />
    </>
  );
}
