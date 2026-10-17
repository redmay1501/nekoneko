'use client';

import { type KeyboardEvent, type ReactNode, useRef } from 'react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
}

/**
 * Nhóm lựa chọn một-trong-nhiều kiểu "viên thuốc" (thay radio gốc của trình duyệt — mỗi hệ điều hành vẽ một kiểu).
 * Chuẩn ARIA radiogroup: chỉ ô đang chọn nhận Tab, phím mũi tên đổi lựa chọn. Có thể chọn đi chọn lại không giới hạn;
 * KHÔNG khoá cả nhóm khi đang lưu (trước đây fieldset disabled khiến bấm đổi tiếp không ăn).
 */
export function SegmentedChoice<T extends string | number>({ label, options, value, onChange }: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  }

  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button key={String(option.value)} ref={(element) => { buttons.current[index] = element; }} type="button" role="radio"
            aria-checked={isSelected} tabIndex={index === selectedIndex ? 0 : -1} className={`segmented-option${isSelected ? ' is-selected' : ''}`}
            onClick={() => { if (!isSelected) onChange(option.value); }} onKeyDown={(event) => onKeyDown(event, index)}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
