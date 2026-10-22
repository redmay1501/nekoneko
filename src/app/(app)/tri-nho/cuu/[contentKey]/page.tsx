import { redirect } from 'next/navigation';
import { randomUUID } from 'node:crypto';
import { RescueFlow } from '@/components/memory/RescueFlow';
import { findKnowledgeItem } from '@/features/learning/knowledge-catalog';
import { getLearnerContext } from '@/features/learning/learner-context';
import { buildRescueView } from '@/features/memory/rescue-view';

/** SC-30 · Cứu một kiến thức. */
export default async function RescuePage({ params, searchParams }: { params: Promise<{ contentKey: string }>; searchParams: Promise<{ returnTo?: string; flow?: string }> }) {
  const { contentKey } = await params;
  const query = await searchParams;
  const returnParam = query.returnTo;
  const returnTo = returnParam === '/vuon' ? '/vuon' : '/tri-nho/sap-quen';
  const { catalog, memoryViews, journeyDay } = await getLearnerContext();
  const item = findKnowledgeItem(catalog, contentKey);
  const memory = item ? memoryViews.get(item.key) : undefined;
  // Chưa học tới thì chưa có gì để cứu — quay về ra-đa.
  if (!item || !memory?.isLearned) redirect('/tri-nho/sap-quen');
  const flowId = /^[0-9a-f-]{36}$/i.test(query.flow ?? '') ? query.flow! : randomUUID();
  if (flowId !== query.flow) {
    const next = new URLSearchParams({ flow: flowId });
    if (returnTo === '/vuon') next.set('returnTo', '/vuon');
    redirect(`/tri-nho/cuu/${item.key}?${next}`);
  }
  return <RescueFlow key={`${item.key}:${flowId}`} view={buildRescueView(item, memory, catalog, memoryViews, journeyDay)} returnTo={returnTo} flowId={flowId} />;
}
