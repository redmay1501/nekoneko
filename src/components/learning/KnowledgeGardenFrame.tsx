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
  const pickerDialogRef = useRef<HTMLElement>(null);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
      if (!message || message.version !== 1) return;
      if (message.source === 'nekoneko-knowledge-garden' && message.type === 'picker' && message.open === true) {
        setPickerOpen(true);
        return;
      }
      if (message.source !== 'nekoneko-hiragana') return;
      if (message.type === 'select' && Number.isInteger(message.index)) setSelectedIndex(message.index);
      if (message.type === 'detail' && typeof message.contentKey === 'string') openKnowledge(message.contentKey);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [openKnowledge]);

  useEffect(() => {
    if (!pickerOpen) return;
    function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setPickerOpen(false); }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !pickerDialogRef.current?.contains(event.target)) setPickerOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [pickerOpen]);

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
      {label === 'bộ thủ' && pickerOpen && typeof document !== 'undefined' && createPortal(
        <>
          <button className="kana-picker-backdrop" type="button" aria-label="Đóng bảng bộ thủ" onClick={() => setPickerOpen(false)} />
          <section ref={pickerDialogRef} className="kana-picker-dialog" role="dialog" aria-label="Chọn bộ thủ">
            <header><h2>Chọn bộ thủ</h2><button type="button" className="kana-picker-close" onClick={() => setPickerOpen(false)} aria-label="Đóng">×</button></header>
            <div className="kana-picker-grid">
              {cards.map((card, index) => (
                <button key={card.contentKey} type="button" className="kana-picker-cell" aria-current={index === selectedIndex ? 'true' : undefined}
                  onClick={() => {
                    setSelectedIndex(index);
                    setPickerOpen(false);
                    frameRef.current?.contentWindow?.postMessage({ source: 'nekoneko-app', type: 'goto', index }, window.location.origin);
                    frameRef.current?.contentWindow?.focus();
                  }}>
                  <b lang="ja">{card.character}</b><small>{card.meaning}</small>
                </button>
              ))}
            </div>
          </section>
        </>, document.body,
      )}
    </section>
  );
}
