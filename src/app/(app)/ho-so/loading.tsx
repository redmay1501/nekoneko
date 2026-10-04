import { StackedCardsSkeleton } from '@/components/common/PageSkeletons';

export default function Loading() {
  return <StackedCardsSkeleton label="Đang mở hồ sơ…" cards={3} hasAvatar />;
}
