'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { MemoryStatus } from '@/features/memory/memory-types';
import { useSheetStore } from '@/stores/sheet-store';

export interface KnowledgeGardenCard {
  contentKey: string;
  character: string;
  meaning: string;
  romaji: string;
  row: string;
  tip: string;
  details: Array<{ value: string }>;
  relatedKanji?: Array<{ character: string; meaning: string }>;
  chain?: Array<{ face: string; caption: string }>;
  status: MemoryStatus;
}

/** Nhúng nguyên giao diện carousel 3D từ prototype, nhận dữ liệu kho kiến thức thật qua URL fragment. */
export function KnowledgeGardenFrame({ cards, label, title, count, description, children }: {
  cards: KnowledgeGardenCard[];
  label: string;
  title: string;
  count: string;
  description: string;
  children?: ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const openKnowledge = useSheetStore((state) => state.openKnowledge);
  const src = useMemo(() => {
    const data = encodeURIComponent(JSON.stringify(cards.map((card) => ({
      ...card,
      status: card.status === 'mastered' || card.status === 'strong' ? 'learned'
        : card.status === 'new' ? 'new' : 'learning',
    }))));
    const kind = label === 'bộ thủ' ? 'radical' : 'kanji';
    return `/nekoneko-knowledge-3d.html?embedded=1&kind=${kind}#data=${data}`;
  }, [cards, label]);

  useEffect(() => {
    setToolbarHost(document.querySelector<HTMLElement>('.topbar-knowledge-slot'));
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      if (!message || message.source !== 'nekoneko-hiragana' || message.version !== 1) return;
      if (message.type === 'detail' && typeof message.contentKey === 'string') openKnowledge(message.contentKey);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [openKnowledge]);

  if (!cards.length) return null;
  return (
    <section className="knowledge-garden-shell" aria-label={`Vườn học ${label}`}>
      <iframe ref={frameRef} className="knowledge-garden-frame" src={src} title={`Thẻ 3D ${label}`}
        sandbox="allow-scripts allow-same-origin" />
      {label === 'bộ thủ' ? <div className="knowledge-radical-test">{children}</div> : (
        <div className="knowledge-garden-toolbar">
          <div className="knowledge-garden-heading"><h1>{title}</h1><span>{count}</span></div>
          <p>{description}</p>
          <div className="knowledge-garden-actions">{children}</div>
        </div>
      )}
      {toolbarHost && createPortal(<div className="knowledge-header-copy">
        <div><strong>{title}</strong><span>{count}</span></div>
        <p>{description}</p>
      </div>, toolbarHost)}
    </section>
  );
}
