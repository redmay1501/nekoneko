'use client';

import { useState } from 'react';
import { KnowledgeListRow, type KnowledgeListRowData } from './KnowledgeListRow';

/**
 * Danh sách Kanji xếp THEO BÀI (bài mà chữ được học cùng từ vựng), có nút "Chỉ chữ đã học". Không chia thành các tab
 * trạng thái trí nhớ (Đang học / Đã nắm / Cần ôn) — trạng thái vẫn hiện trên thanh sức nhớ của từng dòng và ở trang Trí nhớ.
 * "Đã học" = đã gặp trong phiên học (trạng thái khác "new") — mở trang không làm chữ thành "đã học".
 */
export function FilterableKnowledgeList({ rows, unit = 'chữ' }: { rows: Array<KnowledgeListRowData & { group: string }>; unit?: string }) {
  const [isLearnedOnly, setIsLearnedOnly] = useState(false);
  const learnedCount = rows.filter((row) => row.status !== 'new').length;
  const visibleRows = isLearnedOnly ? rows.filter((row) => row.status !== 'new') : rows;
  const groups = [...new Set(visibleRows.map((row) => row.group))];
  return (
    <>
      <div className="row wrap" style={{ gap: 8 }}>
        <button type="button" role="switch" aria-checked={isLearnedOnly} className={`chip ${isLearnedOnly ? 'pink' : ''}`}
          onClick={() => setIsLearnedOnly((value) => !value)}>
          {isLearnedOnly ? '✓ ' : ''}Chỉ {unit} đã học ({learnedCount})
        </button>
      </div>
      {groups.length ? groups.map((group) => {
        const groupRows = visibleRows.filter((row) => row.group === group);
        return (
          <section key={group}>
            <div className="sec-h"><h2 style={{ fontSize: 15 }}>{group}</h2><span className="tiny muted">{groupRows.length} {unit}</span></div>
            <div className="list-grid stack" style={{ gap: 9 }}>
              {groupRows.map((row) => <KnowledgeListRow key={row.contentKey} row={row} />)}
            </div>
          </section>
        );
      }) : <p className="soft center mt-3">Bạn chưa học {unit} nào — các {unit} sẽ hiện ở đây sau phiên “Học hôm nay”.</p>}
    </>
  );
}
