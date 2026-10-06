'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import type { RadicalExpandableData } from '@/features/learning/radical-view';

export type { RadicalExpandableData };

/**
 * Bộ thủ mở rộng TẠI CHỖ (không mở khay / cửa sổ lớn): bấm để xem nghĩa, mẹo nhớ, Kanji chứa bộ này; bấm lại để thu gọn.
 */
export function RadicalExpandable({ radical, compact = false, defaultOpen = false }: { radical: RadicalExpandableData; compact?: boolean; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className={`radical-x${isOpen ? ' open' : ''}${compact ? ' compact' : ''}`}>
      <button type="button" className="radical-x-head" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setIsOpen((value) => !value)}>
        <span className="radical-x-face jp">{radical.face}</span>
        <span className="radical-x-title">
          <b>{radical.meaning}</b>
          <span className="jp">{radical.nameJp}{radical.day ? ` · ngày ${radical.day}` : ' · bộ tham khảo'}</span>
        </span>
        <span className="radical-x-chevron" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen ? (
        <div id={panelId} className="radical-x-panel">
          {radical.tip ? <p className="sm"><b>💡 Gợi nhớ:</b> {radical.tip}</p> : null}
          {radical.kanji.length ? (
            <>
              <p className="tiny muted mt-2">Kanji N5 có bộ này</p>
              <div className="row wrap mt-1" style={{ gap: 6 }}>
                {radical.kanji.map((kanji) => (
                  <Link key={kanji.id} href={`/hoc-tap/kanji/${kanji.id}`} className="chip jp" title={kanji.meaning}>
                    {kanji.character} <span className="tiny muted" style={{ fontFamily: 'inherit' }}>{kanji.meaning.split(/[,;]/)[0]}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : null}
          <div className="between mt-2.5">
            <Link href={`/hoc-tap/bo-thu/${radical.id}`} className="link sm">Xem trang bộ thủ →</Link>
            <button type="button" className="link sm" onClick={() => setIsOpen(false)}>Thu gọn ▲</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
