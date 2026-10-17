import Link from 'next/link';
import { lessonNumber } from '@/lib/utils/lesson';
import { notFound } from 'next/navigation';
import { buildKnowledgeDetail } from '@/features/learning/knowledge-detail';
import { getLearnerContext } from '@/features/learning/learner-context';
import { type ContentType, toContentKey } from '@/features/learning/knowledge-types';
import { toMemoryView } from '@/features/memory/memory-engine';
import { KnowledgeDetailContent } from './KnowledgeDetailContent';

interface KnowledgeDetailPageProps {
  contentType: ContentType;
  rawId: string;
  backHref: string;
  backLabel: string;
}

/**
 * Trang chi tiết riêng (SC-17/19/21/23) — cùng nội dung với khay chi tiết,
 * dùng khi mở bằng đường dẫn trực tiếp hoặc chia sẻ.
 */
export async function KnowledgeDetailPage({ contentType, rawId, backHref, backLabel }: KnowledgeDetailPageProps) {
  const id = Number(rawId);
  if (!Number.isInteger(id)) notFound();
  const { catalog, memoryViews, now } = await getLearnerContext();
  const item = catalog.byKey.get(toContentKey(contentType, id));
  if (!item) notFound();
  const memory = memoryViews.get(item.key) ?? toMemoryView(item.key, item.type, null, now);
  return (
    <div className="session">
      <Link className="link" href={backHref}>← {backLabel}</Link>
      <div className="card mt-2" data-reveal="light"><KnowledgeDetailContent detail={buildKnowledgeDetail(item, memory, catalog)} /></div>
      {item.type === 'kanji' ? (
        <div className="row wrap mt-3" style={{ gap: 8 }}>
          <Link className="btn sm" href={`/luyen-tap/viet?muc=kanji&chu=${encodeURIComponent(item.content.character)}`}>✍️ Luyện viết chữ này</Link>
        </div>
      ) : null}
      {item.type === 'grammar' ? (
        <div className="row wrap mt-3" style={{ gap: 8 }}>
          <Link className="btn sm" href={`/hoc-tap/ngu-phap/luyen-tap?mau=${item.id}&che-do=luyen-tap&so-cau=tat-ca`}>📝 Luyện mẫu này</Link>
          <Link className="btn ghost sm" href={`/hoc-tap/ngu-phap/luyen-tap?bai=${lessonNumber(item.content.lesson)}&che-do=kiem-tra`}>✅ Kiểm tra cả bài</Link>
        </div>
      ) : null}
    </div>
  );
}
