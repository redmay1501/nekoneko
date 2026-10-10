'use client';

import Link from 'next/link';
import { useState } from 'react';
import { focusSessionHref } from '@/features/learning/session-modes';
import type { StudyParts } from '@/features/learning/study-actions';

/**
 * Học / ôn ngay tại trang Học tập — người học CHỌN phạm vi (Tất cả, Cần ôn, từng phần), không bị dẫn theo thứ tự lộ trình.
 * Nút bắt đầu nói rõ phần đó có bao nhiêu thứ mới (sẽ được giới thiệu) và bao nhiêu thứ đã học (sẽ được hỏi lại).
 */
export function StudyActionBar({ parts, unit }: { parts: StudyParts; unit: string }) {
  const [selectedId, setSelectedId] = useState(parts.parts[0]?.id);
  const selected = parts.parts.find((part) => part.id === selectedId) ?? parts.parts[0];
  if (!selected) return null;
  const summary = [
    selected.newCount ? `${selected.newCount} ${unit} mới` : '',
    selected.learnedCount ? `ôn ${selected.learnedCount} ${unit} đã học` : '',
  ].filter(Boolean).join(' · ');
  return (
    <section className="card tight study-actions mb-3.5" aria-label="Học và ôn tập">
      <div className="between">
        <b className="sm">🎯 Học / ôn theo phần</b>
        <span className="tiny muted">Đã học {parts.learned}/{parts.total} {unit}</span>
      </div>
      <div className="study-parts mt-2.5" role="radiogroup" aria-label="Chọn phần để học">
        {parts.parts.map((part) => (
          <button key={part.id} type="button" role="radio" aria-checked={part.id === selected.id}
            className={`chip ${part.id === selected.id ? 'pink' : ''}`} onClick={() => setSelectedId(part.id)}>
            <span className={/[぀-ヿ一-鿿]/.test(part.label) ? 'jp' : undefined}>{part.label}</span>
          </button>
        ))}
      </div>
      {selected.hint ? <p className="tiny muted mt-2">{selected.hint}</p> : null}
      <Link className="btn sm block mt-2.5" href={focusSessionHref(selected.keys)}>
        ▶ {selected.learnedCount && !selected.newCount ? 'Ôn' : 'Học'} {selected.keys.length} {unit}{summary ? ` · ${summary}` : ''}
      </Link>
    </section>
  );
}
