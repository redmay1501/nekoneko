'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ModalPortal } from '@/components/common/ModalPortal';

export interface RangePickerOption {
  id: string;
  label: string;
  /** Đường dẫn khi chuyển trang; chế độ đổi tại chỗ (onSelect) thì không cần. */
  href?: string;
  /** Nhóm hiển thị trong bảng chọn ("Gợi ý", "Theo bài", "Nhóm Kanji"…). */
  group: string;
  /** Dòng nhỏ dưới nhãn (số mục, ví dụ chữ đầu nhóm…). */
  caption?: string;
}

/**
 * Chọn phạm vi luyện tập (theo lộ trình · tất cả · từng bài / nhóm) — MỘT nút "Phạm vi: … · Đổi" mở bảng chọn dạng lưới
 * như bảng Kiểm tra, thay cho hàng chip dài. Chọn xong chuyển trang ngay: server dựng đúng nội dung của phạm vi đó.
 */
export function RangePicker({ options, current, title, onSelect, param = 'pham-vi' }: {
  options: RangePickerOption[];
  current: string;
  title: string;
  /** Có thì đổi NGAY trong trình duyệt (dữ liệu mọi phạm vi đã có sẵn) và chỉ cập nhật URL — không chuyển trang. */
  onSelect?: (id: string) => void;
  /** Tham số URL ghi lại lựa chọn ở chế độ đổi tại chỗ (mặc định "pham-vi"). */
  param?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.id === current) ?? options[0];
  const groups = [...new Set(options.map((option) => option.group))];

  function choose(option: RangePickerOption) {
    setIsOpen(false);
    if (option.id === current) return;
    if (onSelect) {
      onSelect(option.id);
      const url = new URL(window.location.href);
      url.searchParams.set(param, option.id);
      window.history.replaceState(window.history.state, '', url);
      return;
    }
    if (option.href) router.push(option.href, { scroll: false });
  }

  return (
    <>
      <div className="range-picker-row">
        <button type="button" className="btn ghost sm range-picker-open" onClick={() => setIsOpen(true)} aria-haspopup="dialog">
          🎯 {title}: <b>{selected?.label}</b> <span className="range-picker-change">· Đổi</span>
        </button>
      </div>
      {isOpen ? (
        <ModalPortal className="sheet on test-picker" labelledBy="range-picker-title" onEscape={() => setIsOpen(false)}>
          <button type="button" className="sheet-close" onClick={() => setIsOpen(false)} aria-label="Đóng">✕</button>
          <h2 id="range-picker-title" style={{ fontSize: 18 }}>Chọn {title.toLowerCase()}</h2>
          {groups.map((group) => (
            <section key={group} className="mt-3.5" aria-label={group}>
              <b className="sm">{group}</b>
              <div className="test-grid range-grid mt-2" role="radiogroup" aria-label={group}>
                {options.filter((option) => option.group === group).map((option) => (
                  <button key={option.id} type="button" role="radio" aria-checked={option.id === current}
                    className={`test-cell ${option.id === current ? 'on' : ''}`} onClick={() => choose(option)}>
                    <span className="test-face">{option.label}</span>
                    {option.caption ? <span className="test-caption">{option.caption}</span> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </ModalPortal>
      ) : null}
    </>
  );
}
