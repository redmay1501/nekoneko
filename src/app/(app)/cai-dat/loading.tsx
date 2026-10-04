import { StackedCardsSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <StackedCardsSkeleton label="Đang mở cài đặt…" cards={5} />;
}
