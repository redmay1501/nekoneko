import Link from 'next/link';
import { GrammarNotebook } from '@/components/learning/GrammarNotebook';
import { itemsOfType } from '@/features/learning/knowledge-catalog';
import { countLearnedOfType } from '@/features/learning/knowledge-library';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-22 · Sổ tay ngữ pháp N5 — công thức, ví dụ và luyện tập theo bài. */
export default async function GrammarPage() {
  const { catalog, memoryViews } = await getLearnerContext();
  const { learned, total } = countLearnedOfType(catalog, memoryViews, 'grammar');
  const items = itemsOfType(catalog, 'grammar').map((item) => ({
    grammar: item.content,
    status: memoryViews.get(item.key)?.status ?? 'new' as const,
  }));

  return <>
    <div className="grammar-page-actions">
      <Link href="/hoc-tap/ngu-phap/luyen-tap">✿ Luyện tập ngữ pháp</Link>
      <Link href="/hoc-tap/ngu-phap/bai-tap">✎ Bài tập ngữ pháp</Link>
    </div>
    <GrammarNotebook items={items} learned={learned} total={total} />
  </>;
}
