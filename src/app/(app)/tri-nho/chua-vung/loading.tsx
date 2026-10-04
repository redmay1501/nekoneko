import { KnowledgeListSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <KnowledgeListSkeleton label="Đang mở danh sách chưa vững…" hasFilters={false} rows={6} />;
}
