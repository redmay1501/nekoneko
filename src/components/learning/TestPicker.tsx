'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ModalPortal } from '@/components/common/ModalPortal';
import { MAX_FOCUS_ITEMS, focusSessionHref } from '@/features/learning/session-modes';
import type { TestGroup } from '@/features/learning/study-actions';

interface TestPickerProps {
  groups: TestGroup[];
  unit: string;
  /** Mặt chữ dài (từ vựng, mẫu câu) → ô rộng hơn. */
  isWide?: boolean;
}

/** Số câu mỗi lần kiểm tra (mỗi câu một mục); "Tất cả" = mọi mục đã chọn (tối đa MAX_FOCUS_ITEMS). */
const QUESTION_COUNTS = [10, 20, 30, 50] as const;
const ALL = 0;
const DEFAULT_COUNT = 20;
const COUNT_STORAGE_KEY = 'test-picker:count';

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
 * MỘT nút "Kiểm tra" → bảng chọn: tất cả, chỉ chữ đã học, cả nhóm, hoặc từng chữ → chọn số câu (10 · 20 · 30 · 50 · tất cả) → bắt đầu.
 * Bài kiểm tra là phiên "Học theo lựa chọn": thứ đã học được hỏi lại (ghi trí nhớ thật); thứ chưa học được giới thiệu trước.
 */
export function TestPicker({ groups, unit, isWide = false }: TestPickerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allKeys = groups.flatMap((group) => group.entries.map((entry) => entry.key));
  const learnedKeys = groups.flatMap((group) => group.entries.filter((entry) => entry.isLearned).map((entry) => entry.key));
  const isAllSelected = selected.size === allKeys.length;
  /** Số câu đã chọn (0 = tất cả). Nhớ lần chọn trước trên máy này. */
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COUNT_STORAGE_KEY);
      if (raw === null) return;
      const saved = Number(raw);
      if (saved === ALL || QUESTION_COUNTS.includes(saved as (typeof QUESTION_COUNTS)[number])) setCount(saved);
    } catch { /* trình duyệt chặn lưu — dùng mặc định */ }
  }, []);
  function chooseCount(value: number) {
    setCount(value);
    try { localStorage.setItem(COUNT_STORAGE_KEY, String(value)); } catch { /* bỏ qua */ }
  }
  const allLimit = Math.min(selected.size, MAX_FOCUS_ITEMS);
  const questionCount = count === ALL ? allLimit : Math.min(count, allLimit);

  const setMany = (keys: readonly string[], on: boolean) => setSelected((current) => {
    const next = new Set(current);
    for (const key of keys) (on ? next.add(key) : next.delete(key));
    return next;
  });
  const toggle = (key: string) => setMany([key], !selected.has(key));
  const start = () => router.push(focusSessionHref(sample([...selected], questionCount)));

  return (
    <>
      <div className="test-open-row">
        <button type="button" className="btn ghost sm test-open" onClick={() => setIsOpen(true)}>✅ Kiểm tra</button>
      </div>
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
            {selected.size ? (
              <div className="test-count" role="radiogroup" aria-label="Số câu mỗi lần">
                <span className="sm">Số câu:</span>
                {QUESTION_COUNTS.filter((value) => value < selected.size).map((value) => (
                  <button key={value} type="button" role="radio" aria-checked={count === value}
                    className={`chip ${count === value ? 'pink' : ''}`} onClick={() => chooseCount(value)}>{value}</button>
                ))}
                <button type="button" role="radio" aria-checked={count === ALL || count >= selected.size}
                  className={`chip ${count === ALL || count >= selected.size ? 'pink' : ''}`} onClick={() => chooseCount(ALL)}>
                  Tất cả ({allLimit})
                </button>
              </div>
            ) : null}
            {questionCount < selected.size ? (
              <p className="tiny muted mb-1.5">Lấy ngẫu nhiên {questionCount} trong {selected.size} {unit} đã chọn — lần sau sẽ ra {unit} khác.</p>
            ) : null}
            {selected.size ? (
              <button type="button" className="btn block" onClick={start}>
                ▶ Bắt đầu kiểm tra · {questionCount} câu
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
