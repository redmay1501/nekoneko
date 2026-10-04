'use client';

import { useState } from 'react';
import { MEMORY_FILTERS, type MemoryFilterId, matchesMemoryFilter } from '@/features/learning/knowledge-filters';
import { KnowledgeListRow, type KnowledgeListRowData } from './KnowledgeListRow';

/** Danh sách kiến thức có thẻ lọc theo trạng thái trí nhớ (Kanji). */
export function FilterableKnowledgeList({ rows }: { rows: KnowledgeListRowData[] }) {
  const [filter, setFilter] = useState<MemoryFilterId>('all');
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
      <div className="mt-3">
        {visibleRows.length ? (
          <div className="list-grid stack" style={{ gap: 9 }}>
            {visibleRows.map((row) => <KnowledgeListRow key={row.contentKey} row={row} />)}
          </div>
        ) : (
          <p className="soft center">Chưa có chữ nào ở nhóm này.</p>
        )}
      </div>
    </>
  );
}
