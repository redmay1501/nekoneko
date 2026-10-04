import { KnowledgeListSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <KnowledgeListSkeleton label="Đang mở Bộ thủ…" hasFilters={false} />;
}
