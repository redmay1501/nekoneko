'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircleIcon } from '@/components/common/CheckCircleIcon';
import { ModalPortal } from '@/components/common/ModalPortal';
import { focusSessionHref } from '@/features/learning/session-modes';
import { ALL_QUESTIONS, QUESTION_COUNTS, pickTestKeys, questionCountFor } from '@/features/learning/test-selection';
import type { TestGroup } from '@/features/learning/study-actions';

interface TestPickerProps {
  groups: TestGroup[];
  unit: string;
  /** Tên mỗi phần để chọn: "bài" (từ vựng, ngữ pháp) hoặc "nhóm" (chữ cái, Kanji, bộ thủ). */
  partUnit?: string;
}

const COUNT_STORAGE_KEY = 'test-picker:count';
const DEFAULT_COUNT = 20;
const ALL = ALL_QUESTIONS;

/**
 * MỘT nút "Kiểm tra" → bảng chọn THEO BÀI / NHÓM (chọn một hay nhiều, không phải chọn từng chữ) → chọn số câu
 * (10 · 20 · 30 · 50 · tất cả) → bắt đầu. Câu hỏi lấy ngẫu nhiên trong các bài đã chọn.
 * Bài kiểm tra là phiên "Học theo lựa chọn": thứ đã học được hỏi lại (ghi trí nhớ thật); thứ chưa học được giới thiệu trước.
 */
export function TestPicker({ groups, unit, partUnit = 'nhóm' }: TestPickerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [onlyLearned, setOnlyLearned] = useState(false);
  const isAllPicked = picked.size === groups.length;
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
  const togglePart = (id: string) => setPicked((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const entries = groups.filter((group) => picked.has(group.id)).flatMap((group) => group.entries);
  const pool = (onlyLearned ? entries.filter((entry) => entry.isLearned) : entries).map((entry) => entry.key);
  const hasLearned = groups.some((group) => group.entries.some((entry) => entry.isLearned));
  const allLimit = questionCountFor(ALL_QUESTIONS, pool.length);
  // Cùng một số cho nút, ghi chú và số mục gửi đi → phiên có đúng chừng đó câu hỏi.
  const questionCount = questionCountFor(count, pool.length);
  const start = () => router.push(focusSessionHref(pickTestKeys(pool, questionCount)));

  return (
    <>
      <div className="test-open-row">
        <button type="button" className="btn ghost sm test-open" onClick={() => setIsOpen(true)}><CheckCircleIcon size={17} /> Kiểm tra</button>
      </div>
      {isOpen ? (
        <ModalPortal className="sheet on test-picker" labelledBy="test-picker-title" onEscape={() => setIsOpen(false)}>
          <button type="button" className="sheet-close" onClick={() => setIsOpen(false)} aria-label="Đóng">✕</button>
          <h2 id="test-picker-title" style={{ fontSize: 18 }}>Kiểm tra {unit} theo {partUnit}</h2>
          <p className="sm soft mt-1">Chọn một hay nhiều {partUnit}, rồi chọn số câu mỗi lần.</p>
          <div className="row wrap mt-2.5" style={{ gap: 8 }}>
            <button type="button" className={`chip ${isAllPicked ? 'pink' : ''}`}
              onClick={() => setPicked(isAllPicked ? new Set() : new Set(groups.map((group) => group.id)))}>
              {isAllPicked ? 'Bỏ chọn tất cả' : `Chọn tất cả ${groups.length} ${partUnit}`}
            </button>
            {hasLearned ? (
              <button type="button" role="switch" aria-checked={onlyLearned} className={`chip ${onlyLearned ? 'pink' : ''}`}
                onClick={() => setOnlyLearned((current) => !current)}>
                {onlyLearned ? <CheckCircleIcon size={15} filled /> : null} Chỉ hỏi {unit} đã học
              </button>
            ) : null}
          </div>
          <div className="test-grid range-grid mt-3" role="group" aria-label={`Chọn ${partUnit}`}>
            {groups.map((group) => {
              const learned = group.entries.filter((entry) => entry.isLearned).length;
              return (
                <button key={group.id} type="button" role="checkbox" aria-checked={picked.has(group.id)}
                  className={`test-cell ${picked.has(group.id) ? 'on' : ''}`} onClick={() => togglePart(group.id)}>
                  <span className="test-face">{picked.has(group.id) ? <CheckCircleIcon size={15} filled /> : null}{group.label}</span>
                  <span className="test-caption">{group.entries.length} {unit}{learned && learned < group.entries.length ? ` · đã học ${learned}` : ''}</span>
                </button>
              );
            })}
          </div>
          <div className="test-start">
            {pool.length ? (
              <div className="test-count" role="radiogroup" aria-label="Số câu mỗi lần">
                <span className="sm">Số câu:</span>
                {QUESTION_COUNTS.filter((value) => value < pool.length).map((value) => (
                  <button key={value} type="button" role="radio" aria-checked={count === value}
                    className={`chip ${count === value ? 'pink' : ''}`} onClick={() => chooseCount(value)}>{value}</button>
                ))}
                <button type="button" role="radio" aria-checked={count === ALL || count >= pool.length}
                  className={`chip ${count === ALL || count >= pool.length ? 'pink' : ''}`} onClick={() => chooseCount(ALL)}>
                  Tất cả ({allLimit})
                </button>
              </div>
            ) : null}
            {pool.length ? (
              <p className="tiny muted mb-1.5">
                Đã chọn {picked.size} {partUnit} · {pool.length} {unit}{questionCount < pool.length ? ` — lấy ngẫu nhiên ${questionCount}, lần sau ra ${unit} khác` : ''}.
                {count !== ALL && count > pool.length ? ` Phạm vi chỉ có ${pool.length} ${unit} nên bài có ${questionCount} câu.` : ''}
              </p>
            ) : null}
            {pool.length ? (
              <button type="button" className="btn block" onClick={start}>▶ Bắt đầu kiểm tra · {questionCount} câu</button>
            ) : (
              <button type="button" className="btn block" disabled>
                {picked.size && onlyLearned ? `Các ${partUnit} này chưa có ${unit} đã học` : `Chọn ít nhất một ${partUnit}`}
              </button>
            )}
          </div>
        </ModalPortal>
      ) : null}
    </>
  );
}
