import { CardGridSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <CardGridSkeleton label="Đang mở Luyện tập…" cards={4} />;
}
