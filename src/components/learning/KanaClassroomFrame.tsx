'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pickerDialogRef = useRef<HTMLElement>(null);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, items.findIndex((item) => item.character === initialCharacter)));
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

  useEffect(() => {
    if (!pickerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPickerOpen(false);
    }
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

  // Header của app và thanh công cụ phủ lên phần trên của khung → báo cho lớp học biết để bảng không nằm dưới chúng.
  useEffect(() => {
    const frame = frameRef.current;
    const toolbar = toolbarRef.current;
    if (!frame || !toolbar) return;
    let raf = 0;
    const send = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const top = toolbar.getBoundingClientRect().bottom - frame.getBoundingClientRect().top;
        frame.contentWindow?.postMessage({ source: 'nekoneko-app', type: 'inset', top: Math.round(top) }, window.location.origin);
      });
    };
    const observer = new ResizeObserver(send);
    observer.observe(toolbar);
    const header = document.querySelector('.topbar');
    if (header) observer.observe(header);
    frame.addEventListener('load', send);
    window.addEventListener('resize', send);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      frame.removeEventListener('load', send);
      window.removeEventListener('resize', send);
    };
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      if (message?.source !== 'nekoneko-kana-classroom' || message.version !== 1) return;
      if (message.type === 'picker' && message.open === true) setPickerOpen(true);
      if (message.type === 'select' && Number.isInteger(message.index)) setSelectedIndex(message.index);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <section className="knowledge-garden-shell kana-classroom-shell" aria-label={`Lớp học ${kind}`}>
      <iframe ref={frameRef} className="knowledge-garden-frame" src={src}
        title={`Lớp học ${kind}`} sandbox="allow-scripts allow-same-origin" />
      <div ref={toolbarRef} className="knowledge-garden-toolbar kana-classroom-toolbar">
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
      {pickerOpen && typeof document !== 'undefined' && createPortal(
        <>
          <button className="kana-picker-backdrop" type="button" aria-label="Đóng bảng chọn chữ" onClick={() => setPickerOpen(false)} />
          <section ref={pickerDialogRef} className="kana-picker-dialog" role="dialog" aria-label={`Chọn chữ ${title}`}>
            <header><h2>Chọn chữ</h2><button type="button" className="kana-picker-close" onClick={() => setPickerOpen(false)} aria-label="Đóng">×</button></header>
            <div className="kana-picker-grid">
              {items.map((item, index) => (
                <button key={item.contentKey} type="button" className="kana-picker-cell" aria-current={index === selectedIndex ? 'true' : undefined}
                  onClick={() => {
                    setSelectedIndex(index);
                    setPickerOpen(false);
                    frameRef.current?.contentWindow?.postMessage({ source: 'nekoneko-app', type: 'goto', index }, window.location.origin);
                    frameRef.current?.contentWindow?.focus();
                  }}>
                  <b lang="ja">{item.character}</b>{kind !== 'kanji' ? <small>{item.romaji}</small> : null}
                </button>
              ))}
            </div>
          </section>
        </>, document.body,
      )}
    </section>
  );
}
