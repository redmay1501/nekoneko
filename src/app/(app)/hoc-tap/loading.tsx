import { CardGridSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <CardGridSkeleton label="Đang mở Học tập…" cards={10} />;
}
