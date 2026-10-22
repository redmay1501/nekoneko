'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { MemoryStatus } from '@/features/memory/memory-types';

export interface KanaClassroomItem {
  contentKey: string;
  character: string;
  romaji: string;
  tip: string;
  status: MemoryStatus;
}

/** Lớp học 2D từ prototype; nội dung chữ và trạng thái luôn lấy từ kho kiến thức của app. */
export function KanaClassroomFrame({
  items, kind, count, initialCharacter, listeningHref, children,
}: {
  items: KanaClassroomItem[];
  kind: 'hiragana' | 'katakana' | 'kanji';
  count: string;
  initialCharacter?: string;
  listeningHref?: string;
  children?: ReactNode;
}) {
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const src = useMemo(() => {
    const data = encodeURIComponent(JSON.stringify(items.map((item) => ({
      ...item,
      status: item.status === 'mastered' || item.status === 'strong' ? 'learned'
        : item.status === 'weak' || item.status === 'fading' ? 'weak'
          : item.status === 'new' ? 'new' : 'learning',
    }))));
    const selected = initialCharacter ? `&selected=${encodeURIComponent(initialCharacter)}&writing=1` : '';
    return `/nekoneko-kana-classroom-2d.html?kind=${kind}${selected}#data=${data}`;
  }, [initialCharacter, items, kind]);
  const title = kind === 'hiragana' ? 'Hiragana' : kind === 'katakana' ? 'Katakana' : 'Kanji N5';

  useEffect(() => {
    setToolbarHost(document.querySelector<HTMLElement>('.topbar-knowledge-slot'));
  }, []);

  return (
    <section className="knowledge-garden-shell kana-classroom-shell" aria-label={`Lớp học ${kind}`}>
      <iframe className="knowledge-garden-frame" src={src}
        title={`Lớp học ${kind}`} sandbox="allow-scripts allow-same-origin" />
      <div className="knowledge-garden-toolbar kana-classroom-toolbar">
        <div className="kana-classroom-toolbar-body">
          <div className="knowledge-garden-actions">
            {children}
            {listeningHref ? <Link className="btn ghost sm" href={listeningHref}>🎧 Luyện nghe</Link> : null}
          </div>
        </div>
      </div>
      {toolbarHost && createPortal(
        <div className="knowledge-header-copy kana-header-copy"><div><strong>{title}</strong><span>{count}</span></div></div>,
        toolbarHost,
      )}
    </section>
  );
}
