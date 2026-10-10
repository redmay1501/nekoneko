'use client';

import { useState } from 'react';
import { MEMORY_FILTERS, type MemoryFilterId, matchesMemoryFilter } from '@/features/learning/knowledge-filters';
import { FocusSelectToggle, FocusSelectionBar, useFocusSelection } from './FocusSelection';
import { KnowledgeListRow, type KnowledgeListRowData } from './KnowledgeListRow';

/** Danh sách kiến thức có thẻ lọc theo trạng thái trí nhớ (Kanji), chọn được nhiều mục để học ngay. */
export function FilterableKnowledgeList({ rows, unit = 'chữ' }: { rows: KnowledgeListRowData[]; unit?: string }) {
  const [filter, setFilter] = useState<MemoryFilterId>('all');
  const selection = useFocusSelection();
  const visibleRows = rows.filter((row) => matchesMemoryFilter(row.status, filter));
  return (
    <>
      <div className="pill-tabs" role="tablist" aria-label="Lọc theo trạng thái trí nhớ">
        {MEMORY_FILTERS.map((option) => (
          <button key={option.id} type="button" role="tab" aria-selected={filter === option.id}
            className={`tab ${filter === option.id ? 'on' : ''}`} onClick={() => setFilter(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      <div className="row mt-2.5" style={{ justifyContent: 'flex-end' }}><FocusSelectToggle selection={selection} unit={unit} /></div>
      <div className="mt-2">
        {visibleRows.length ? (
          <div className="list-grid stack" style={{ gap: 9 }}>
            {visibleRows.map((row) => (
              <KnowledgeListRow key={row.contentKey} row={row} selection={selection.isSelecting ? selection.selectionFor(row.contentKey) : undefined} />
            ))}
          </div>
        ) : (
          <p className="soft center">Chưa có chữ nào ở nhóm này.</p>
        )}
      </div>
      <FocusSelectionBar selection={selection} unit={unit} />
    </>
  );
}
