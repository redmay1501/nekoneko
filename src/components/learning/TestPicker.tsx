'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ModalPortal } from '@/components/common/ModalPortal';
import { MAX_FOCUS_ITEMS, focusSessionHref } from '@/features/learning/session-modes';
import type { TestGroup } from '@/features/learning/study-actions';

interface TestPickerProps {
  groups: TestGroup[];
  unit: string;
  /** Mặt chữ dài (từ vựng, mẫu câu) → ô rộng hơn. */
  isWide?: boolean;
}

/** Lấy ngẫu nhiên tối đa `limit` mục (chọn quá nhiều thì mỗi lần kiểm tra một phần, lần sau phần khác). */
function sample<T>(items: readonly T[], limit: number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy.slice(0, limit);
}

/**
 * MỘT nút "Kiểm tra" → bảng chọn: tất cả, chỉ chữ đã học, cả nhóm, hoặc từng chữ → bắt đầu.
 * Bài kiểm tra là phiên "Học theo lựa chọn": thứ đã học được hỏi lại (ghi trí nhớ thật); thứ chưa học được giới thiệu trước.
 */
export function TestPicker({ groups, unit, isWide = false }: TestPickerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allKeys = groups.flatMap((group) => group.entries.map((entry) => entry.key));
  const learnedKeys = groups.flatMap((group) => group.entries.filter((entry) => entry.isLearned).map((entry) => entry.key));
  const isAllSelected = selected.size === allKeys.length;

  const setMany = (keys: readonly string[], on: boolean) => setSelected((current) => {
    const next = new Set(current);
    for (const key of keys) (on ? next.add(key) : next.delete(key));
    return next;
  });
  const toggle = (key: string) => setMany([key], !selected.has(key));
  const start = () => router.push(focusSessionHref(sample([...selected], MAX_FOCUS_ITEMS)));

  return (
    <>
      <button type="button" className="btn block mb-3.5 test-open" onClick={() => setIsOpen(true)}>✅ Kiểm tra</button>
      {isOpen ? (
        <ModalPortal className="sheet on test-picker" labelledBy="test-picker-title" onEscape={() => setIsOpen(false)}>
          <button type="button" className="sheet-close" onClick={() => setIsOpen(false)} aria-label="Đóng">✕</button>
          <h2 id="test-picker-title" style={{ fontSize: 18 }}>Chọn {unit} để kiểm tra</h2>
          <div className="row wrap mt-2.5" style={{ gap: 8 }}>
            <button type="button" className={`chip ${isAllSelected ? 'pink' : ''}`} onClick={() => setSelected(isAllSelected ? new Set() : new Set(allKeys))}>
              {isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${allKeys.length})`}
            </button>
            {learnedKeys.length && learnedKeys.length < allKeys.length ? (
              <button type="button" className="chip" onClick={() => setSelected(new Set(learnedKeys))}>Chỉ {unit} đã học ({learnedKeys.length})</button>
            ) : null}
          </div>
          {groups.map((group) => {
            const keys = group.entries.map((entry) => entry.key);
            const isGroupSelected = keys.every((key) => selected.has(key));
            return (
              <section key={group.id} className="mt-3.5" aria-label={group.label}>
                <div className="between mb-2">
                  <b className="sm">{group.label}</b>
                  <button type="button" className="link sm" onClick={() => setMany(keys, !isGroupSelected)}>
                    {isGroupSelected ? 'Bỏ chọn nhóm' : 'Chọn cả nhóm'}
                  </button>
                </div>
                <div className={`test-grid ${isWide ? 'wide' : ''}`}>
                  {group.entries.map((entry) => (
                    <button key={entry.key} type="button" className={`test-cell ${selected.has(entry.key) ? 'on' : ''}`}
                      aria-pressed={selected.has(entry.key)} onClick={() => toggle(entry.key)}>
                      <span className="jp glyph test-face">{entry.face}</span>
                      <span className="test-caption">{entry.caption}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          <div className="test-start">
            {selected.size > MAX_FOCUS_ITEMS ? (
              <p className="tiny muted mb-1.5">Mỗi lần kiểm tra tối đa {MAX_FOCUS_ITEMS} {unit} — lấy ngẫu nhiên trong số bạn chọn.</p>
            ) : null}
            {selected.size ? (
              <button type="button" className="btn block" onClick={start}>
                ▶ Bắt đầu kiểm tra · {Math.min(selected.size, MAX_FOCUS_ITEMS)} {unit}
              </button>
            ) : (
              <button type="button" className="btn block" disabled>Chọn ít nhất một {unit}</button>
            )}
          </div>
        </ModalPortal>
      ) : null}
    </>
  );
}
