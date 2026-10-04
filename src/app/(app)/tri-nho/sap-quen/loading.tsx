import { KnowledgeListSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <KnowledgeListSkeleton label="Đang tìm những thứ sắp quên…" hasFilters={false} rows={6} />;
}
