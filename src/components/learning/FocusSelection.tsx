'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MAX_FOCUS_ITEMS, focusSessionHref } from '@/features/learning/session-modes';

/** Chọn kiến thức để học (tối đa MAX_FOCUS_ITEMS) — trạng thái cục bộ của một danh sách. */
export function useFocusSelection() {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (key: string) => setSelected((current) => (current.includes(key)
    ? current.filter((candidate) => candidate !== key)
    : current.length < MAX_FOCUS_ITEMS ? [...current, key] : current));
  return {
    isSelecting,
    selected,
    isFull: selected.length >= MAX_FOCUS_ITEMS,
    start: () => setIsSelecting(true),
    cancel: () => { setIsSelecting(false); setSelected([]); },
    /** Chọn tất cả mục đang hiện (theo bộ lọc / bài) — tối đa MAX_FOCUS_ITEMS mỗi lượt. */
    selectAll: (keys: readonly string[]) => setSelected([...new Set(keys)].slice(0, MAX_FOCUS_ITEMS)),
    clear: () => setSelected([]),
    selectionFor: (key: string) => {
      const isSelected = selected.includes(key);
      return { isSelected, isDisabled: !isSelected && selected.length >= MAX_FOCUS_ITEMS, onToggle: () => toggle(key) };
    },
  };
}

export type FocusSelection = ReturnType<typeof useFocusSelection>;

/** Nút bật chế độ chọn — đặt cạnh bộ lọc của danh sách. */
export function FocusSelectToggle({ selection, unit }: { selection: FocusSelection; unit: string }) {
  if (selection.isSelecting) return null;
  return <button type="button" className="btn ghost sm" onClick={selection.start}>☑ Chọn {unit} để học</button>;
}

/** Thanh dưới màn hình khi đang chọn: số đã chọn + "Học ngay" (mở phiên Học theo lựa chọn). */
export function FocusSelectionBar({ selection, unit, visibleKeys }: { selection: FocusSelection; unit: string; visibleKeys: readonly string[] }) {
  if (!selection.isSelecting) return null;
  const count = selection.selected.length;
  const allSelected = count > 0 && visibleKeys.slice(0, MAX_FOCUS_ITEMS).every((key) => selection.selected.includes(key));
  return (
    <div className="focus-select-bar" role="region" aria-label="Kiến thức đã chọn">
      <span className="sm">
        {count ? <>Đã chọn <b>{count}</b> {unit}{selection.isFull ? ` (tối đa ${MAX_FOCUS_ITEMS})` : ''}</> : `Bấm vào ${unit} để chọn`}
      </span>
      <div className="row" style={{ gap: 8 }}>
        {allSelected
          ? <button type="button" className="btn ghost sm" onClick={selection.clear}>Bỏ chọn</button>
          : <button type="button" className="btn ghost sm" onClick={() => selection.selectAll(visibleKeys)}>Chọn tất cả</button>}
        <button type="button" className="btn ghost sm" onClick={selection.cancel} aria-label="Huỷ chọn">✕</button>
        {count ? <Link className="btn sm" href={focusSessionHref(selection.selected)}>▶ Học {count} {unit}</Link> : null}
      </div>
    </div>
  );
}
