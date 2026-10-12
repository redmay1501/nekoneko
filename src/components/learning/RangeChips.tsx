import Link from 'next/link';

export interface RangeChipOption {
  id: string;
  label: string;
  href: string;
}

/**
 * Hàng chip chọn phạm vi luyện tập (theo lộ trình · tất cả · từng bài / nhóm) — dùng chung cho Luyện nghe, nói,
 * nghe – gõ, viết. Mỗi chip là một liên kết: server dựng đúng nội dung của phạm vi (không lọc ở trình duyệt).
 */
export function RangeChips({ options, current, label }: { options: RangeChipOption[]; current: string; label: string }) {
  return (
    <div className="study-parts mb-3" aria-label={label}>
      {options.map((option) => (
        <Link key={option.id} href={option.href} scroll={false} className={`chip ${option.id === current ? 'pink' : ''}`}
          aria-current={option.id === current ? 'true' : undefined}>
          {option.label}
        </Link>
      ))}
    </div>
  );
}
