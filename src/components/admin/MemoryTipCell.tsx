'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';

/** Truncate in-table, show the full tip in a body portal so table overflow cannot clip it. */
export function MemoryTipCell({ text }: { text: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 12, top: 12 });

  function show(target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 180)),
    });
    setOpen(true);
  }

  if (!text) return <span className="adm-muted">—</span>;

  return (
    <>
      <span
        className="adm-memory-tip"
        role="button"
        tabIndex={0}
        aria-label={`Xem mẹo nhớ đầy đủ: ${text}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setOpen(false)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setOpen(false)}
        onClick={(event) => {
          if (window.matchMedia('(hover: none)').matches) {
            if (open) setOpen(false);
            else show(event.currentTarget);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(event.currentTarget); }
          if (event.key === 'Escape') setOpen(false);
        }}
      >
        {text}
      </span>
      {open ? createPortal(
        <span id={id} role="tooltip" className="adm-memory-tip-tooltip" style={{ left: position.left, top: position.top }}>
          {text}
        </span>,
        document.body,
      ) : null}
    </>
  );
}
