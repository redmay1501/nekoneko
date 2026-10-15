'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircleIcon } from '@/components/common/CheckCircleIcon';
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
  /** Số mục — để cộng tổng khi chọn nhiều phần. */
  size?: number;
}

/** Chọn NHIỀU phần cùng lúc (bài 1 + bài 3…) trong những nhóm này; đường dẫn = prefix + id nối bằng dấu phẩy. */
export interface RangeMultiSelect {
  groups: string[];
  hrefPrefix: string;
  /** "từ", "chữ" — trong "Đã chọn 2 bài · 30 từ". */
  unit: string;
  /** "bài", "nhóm". */
  partUnit: string;
  /** Ít nhất chừng này mục mới chơi được. */
  minSize: number;
}

/**
 * Chọn phạm vi luyện tập (theo lộ trình · tất cả · một hay NHIỀU bài / nhóm khi có `multi`) — MỘT nút "Phạm vi: … · Đổi" mở bảng chọn dạng lưới
 * như bảng Kiểm tra, thay cho hàng chip dài. Chọn xong chuyển trang ngay: server dựng đúng nội dung của phạm vi đó.
 */
export function RangePicker({ options, current, currentLabel, title, onSelect, param = 'pham-vi', multi, keepParams = [] }: {
  options: RangePickerOption[];
  current: string;
  title: string;
  /** Có thì đổi NGAY trong trình duyệt (dữ liệu mọi phạm vi đã có sẵn) và chỉ cập nhật URL — không chuyển trang. */
  onSelect?: (id: string) => void;
  /** Tham số URL ghi lại lựa chọn ở chế độ đổi tại chỗ (mặc định "pham-vi"). */
  param?: string;
  /** Nhãn khi phạm vi hiện tại là tổ hợp nhiều phần (không trùng một lựa chọn nào). */
  currentLabel?: string;
  multi?: RangeMultiSelect;
  /** Tham số URL hiện tại cần giữ khi chuyển phạm vi (vd chế độ đang chọn trong trang — có thể đổi phía client). */
  keepParams?: string[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.id === current) ?? options[0];
  const groups = [...new Set(options.map((option) => option.group))];
  const isMultiGroup = (group: string) => Boolean(multi?.groups.includes(group));
  const multiIds = new Set(options.filter((option) => isMultiGroup(option.group)).map((option) => option.id));
  const initialPicked = () => current.split(',').filter((id) => multiIds.has(id));
  const [picked, setPicked] = useState<string[]>(initialPicked);
  const pickedSize = options.filter((option) => picked.includes(option.id)).reduce((sum, option) => sum + (option.size ?? 0), 0);
  const label = currentLabel ?? selected?.label;

  function open() {
    setPicked(initialPicked());
    setIsOpen(true);
  }

  function togglePart(id: string) {
    setPicked((list) => (list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]));
  }

  function playPicked() {
    if (!multi) return;
    setIsOpen(false);
    const ordered = options.filter((option) => picked.includes(option.id)).map((option) => option.id);
    router.push(`${multi.hrefPrefix}${ordered.join(',')}`, { scroll: false });
  }

  function withKeptParams(href: string): string {
    if (!keepParams.length) return href;
    const target = new URL(href, window.location.origin);
    const current = new URL(window.location.href);
    for (const name of keepParams) {
      const value = current.searchParams.get(name);
      if (value) target.searchParams.set(name, value);
    }
    return `${target.pathname}${target.search}`;
  }

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
    if (option.href) router.push(withKeptParams(option.href), { scroll: false });
  }

  return (
    <>
      <div className="range-picker-row">
        <button type="button" className="btn ghost sm range-picker-open" onClick={open} aria-haspopup="dialog">
          🎯 {title}: <b>{label}</b> <span className="range-picker-change">· Đổi</span>
        </button>
      </div>
      {isOpen ? (
        <ModalPortal className="sheet on test-picker" labelledBy="range-picker-title" onEscape={() => setIsOpen(false)}>
          <button type="button" className="sheet-close" onClick={() => setIsOpen(false)} aria-label="Đóng">✕</button>
          <h2 id="range-picker-title" style={{ fontSize: 18 }}>Chọn {title.toLowerCase()}</h2>
          {groups.map((group) => (
            <section key={group} className="mt-3.5" aria-label={group}>
              <div className="between">
                <b className="sm">{group}{isMultiGroup(group) ? <span className="tiny muted" style={{ fontWeight: 400 }}> · chọn được nhiều</span> : null}</b>
                {isMultiGroup(group) ? (
                  <button type="button" className="link sm" onClick={() => {
                    const ids = options.filter((option) => option.group === group).map((option) => option.id);
                    const isAll = ids.every((id) => picked.includes(id));
                    setPicked((list) => (isAll ? list.filter((id) => !ids.includes(id)) : [...new Set([...list, ...ids])]));
                  }}>
                    {options.filter((option) => option.group === group).every((option) => picked.includes(option.id)) ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>
                ) : null}
              </div>
              <div className="test-grid range-grid mt-2" role={isMultiGroup(group) ? 'group' : 'radiogroup'} aria-label={group}>
                {options.filter((option) => option.group === group).map((option) => (isMultiGroup(group) ? (
                  <button key={option.id} type="button" role="checkbox" aria-checked={picked.includes(option.id)}
                    className={`test-cell ${picked.includes(option.id) ? 'on' : ''}`} onClick={() => togglePart(option.id)}>
                    <span className="test-face">{picked.includes(option.id) ? <CheckCircleIcon size={15} filled /> : null}{option.label}</span>
                    {option.caption ? <span className="test-caption">{option.caption}</span> : null}
                  </button>
                ) : (
                  // Đang đánh dấu nhiều bài → ô một-lựa-chọn (Đã học…) không còn sáng, tránh hiểu nhầm là chơi cả hai.
                  <button key={option.id} type="button" role="radio" aria-checked={option.id === current && !picked.length}
                    className={`test-cell ${option.id === current && !picked.length ? 'on' : ''}`} onClick={() => choose(option)}>
                    <span className="test-face">{option.label}</span>
                    {option.caption ? <span className="test-caption">{option.caption}</span> : null}
                  </button>
                )))}
              </div>
            </section>
          ))}
          {multi ? (
            <div className="range-multi-bar">
              <span className="sm">
                {picked.length ? <>Đã chọn <b>{picked.length}</b> {multi.partUnit} · <b>{pickedSize}</b> {multi.unit}</> : `Chạm để chọn một hay nhiều ${multi.partUnit}`}
              </span>
              <button type="button" className="btn sm" disabled={pickedSize < multi.minSize} onClick={playPicked}>
                {picked.length && pickedSize < multi.minSize ? `Cần ít nhất ${multi.minSize} ${multi.unit}` : 'Chơi'}
              </button>
            </div>
          ) : null}
        </ModalPortal>
      ) : null}
    </>
  );
}
