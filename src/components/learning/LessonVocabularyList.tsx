'use client';

import { useEffect, useRef, useState } from 'react';
import { lessonNumber } from '@/lib/utils/lesson';
import type { LessonContent } from '@/types/content';
import { KnowledgeListRow, type KnowledgeListRowData } from './KnowledgeListRow';

export interface VocabularyRowData extends KnowledgeListRowData {
  lesson: string;
}

/** Tab "Chữ cái": từ của giai đoạn học bảng chữ cái (ngày 6–13), chưa thuộc bài Minna nào. */
export const KANA_PERIOD_TAB = 'chu-cai';
const ALL_TAB = '';
/** Tab "Tất cả" có 755 từ: vẽ từng đợt chừng này dòng (đo được: vẽ cả 755 dòng một lúc khựng ~100ms, 8.700 phần tử). */
const PAGE_SIZE = 120;

const tabOfRow = (row: VocabularyRowData) => {
  const number = lessonNumber(row.lesson);
  return Number.isFinite(number) ? `Bài ${number}` : KANA_PERIOD_TAB;
};

/**
 * Từ vựng lọc theo bài Minna (SC-20). Tab xếp đúng 1 → 25, cuộn ngang; mở sẵn bài người học đang học và cuộn
 * tab đó vào giữa tầm nhìn (đang ở bài 18 thì thấy ngay "Bài 18", không phải kéo tìm).
 */
export function LessonVocabularyList({ rows, lessons, currentTab }: { rows: VocabularyRowData[]; lessons: LessonContent[]; currentTab: string }) {
  const [tab, setTab] = useState(currentTab);
  /** "Chỉ từ đã học" — giữ nguyên khi đổi bài (kết hợp với lọc theo bài). */
  const [isLearnedOnly, setIsLearnedOnly] = useState(false);
  const [shownCount, setShownCount] = useState(PAGE_SIZE);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const sortedLessons = [...lessons].sort((left, right) => lessonNumber(left.id) - lessonNumber(right.id));
  const hasKanaPeriod = rows.some((row) => tabOfRow(row) === KANA_PERIOD_TAB);
  const tabRows = tab === ALL_TAB ? rows : rows.filter((row) => tabOfRow(row) === tab);
  // Đã học = đã gặp trong phiên học (trạng thái khác "new"); mở trang hay xem thẻ không làm từ thành "đã học".
  const visibleRows = isLearnedOnly ? tabRows.filter((row) => row.status !== 'new') : tabRows;
  const learnedCount = rows.filter((row) => row.status !== 'new').length;
  const lesson = sortedLessons.find((candidate) => candidate.id === tab);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [tab]);

  const tabButton = (id: string, label: string) => (
    <button key={id || 'all'} ref={tab === id ? activeTabRef : undefined} type="button" role="tab" aria-selected={tab === id}
      className={`tab ${tab === id ? 'on' : ''}`} onClick={() => { setTab(id); setShownCount(PAGE_SIZE); }}>
      {label}{id === currentTab && id !== ALL_TAB ? ' · đang học' : ''}
    </button>
  );

  return (
    <>
      <div className="pill-tabs" role="tablist" aria-label="Lọc theo bài">
        {tabButton(ALL_TAB, 'Tất cả')}
        {hasKanaPeriod ? tabButton(KANA_PERIOD_TAB, 'Chào hỏi & Katakana') : null}
        {sortedLessons.map((candidate) => tabButton(candidate.id, candidate.id))}
      </div>
      <div className="row wrap mt-2.5" style={{ gap: 8 }}>
        <button type="button" role="switch" aria-checked={isLearnedOnly} className={`chip ${isLearnedOnly ? 'pink' : ''}`}
          onClick={() => { setIsLearnedOnly((value) => !value); setShownCount(PAGE_SIZE); }}>
          {isLearnedOnly ? '✓ ' : ''}Chỉ từ đã học ({learnedCount})
        </button>
      </div>
      <div className="mt-3">
        {lesson ? (
          <div className="card tight mb-3" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
            <b>{lesson.id} · {lesson.name}</b>
            {lesson.note ? <p className="sm soft mt-1">{lesson.note}</p> : null}
            <div className="row wrap mt-2" style={{ gap: 6 }}>
              <span className="chip">{lesson.dayRange}</span>
              <span className="chip">{visibleRows.length} từ</span>
            </div>
          </div>
        ) : tab === KANA_PERIOD_TAB ? (
          <p className="sm soft mb-3">Từ chào hỏi và từ Katakana học trong hai tuần bảng chữ cái (ngày 6–13).</p>
        ) : null}
        {!visibleRows.length ? (
          <p className="soft center">{isLearnedOnly ? 'Phần này chưa có từ nào bạn đã học.' : 'Phần này chưa có từ.'}</p>
        ) : null}
        <div key={`${tab}:${isLearnedOnly}`} className="list-grid stack" style={{ gap: 9 }} data-reveal-stagger>
          {visibleRows.slice(0, shownCount).map((row) => (
            <KnowledgeListRow key={row.contentKey} row={row} />
          ))}
        </div>
        {visibleRows.length > shownCount ? (
          <p className="center mt-3">
            <button type="button" className="btn ghost sm" onClick={() => setShownCount((count) => count + PAGE_SIZE)}>
              Xem thêm {Math.min(PAGE_SIZE, visibleRows.length - shownCount)} từ · còn {visibleRows.length - shownCount}
            </button>
          </p>
        ) : null}
      </div>
    </>
  );
}
