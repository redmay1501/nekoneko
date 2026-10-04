import { redirect } from 'next/navigation';
import { RescueFlow } from '@/components/memory/RescueFlow';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildRescueView } from '@/features/memory/rescue-view';

/** SC-30 · Cứu một kiến thức. */
export default async function RescuePage({ params }: { params: Promise<{ contentKey: string }> }) {
  const { contentKey } = await params;
  const { catalog, memoryViews, journeyDay } = await getLearnerContext();
  const item = findKnowledgeItem(catalog, contentKey);
  const memory = item ? memoryViews.get(item.key) : undefined;
  // Chưa học tới thì chưa có gì để cứu — quay về ra-đa.
  if (!item || !memory?.isLearned) redirect('/tri-nho/sap-quen');
  return <RescueFlow key={item.key} view={buildRescueView(item, memory, catalog, memoryViews, journeyDay)} />;
}
