import { CardGridSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <CardGridSkeleton label="Đang mở Thành tích…" cards={8} />;
}
