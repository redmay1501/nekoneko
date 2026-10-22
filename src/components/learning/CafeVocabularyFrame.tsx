'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSheetStore } from '@/stores/sheet-store';

export interface CafeVocabularyItem {
  contentKey: string;
  kana: string;
  kanji: string;
  romaji: string;
  meaning: string;
  tip: string;
  lesson: string;
  icon: string;
  learned: boolean;
  examples: Array<{ jp: string; vi: string }>;
  kanjiParts: Array<{ contentKey: string; character: string; meaning: string }>;
}

/** Từ vựng được học theo từng từ trong sổ quán cà phê; trạng thái vẫn lưu qua Memory API của app. */
export function CafeVocabularyFrame({ items, count, initialContentKey, children }: {
  items: CafeVocabularyItem[];
  count: string;
  initialContentKey?: string;
  children?: ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [toolbarHost, setToolbarHost] = useState<HTMLElement | null>(null);
  const learnedKeys = useRef(new Set(items.filter((item) => item.learned).map((item) => item.contentKey)));
  const initialCounts = count.split('/');
  const totalCount = Number(initialCounts[1] || 0);
  const [displayLearnedCount, setDisplayLearnedCount] = useState(Number(initialCounts[0] || 0));
  const itemKeys = useMemo(() => new Set(items.map((item) => item.contentKey)), [items]);
  const knowledgeKeys = useMemo(() => new Set(items.flatMap((item) => [item.contentKey, ...item.kanjiParts.map((kanji) => kanji.contentKey)])), [items]);
  const src = useMemo(() => {
    const data = encodeURIComponent(JSON.stringify(items));
    const params = new URLSearchParams({ embedded: '1' });
    if (initialContentKey) params.set('word', initialContentKey);
    return `/nekoneko-cafe-vocab.html?${params.toString()}#data=${data}`;
  }, [initialContentKey, items]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const updateHost = () => setToolbarHost(media.matches ? document.querySelector<HTMLElement>('.topbar-knowledge-slot') : null);
    updateHost();
    media.addEventListener('change', updateHost);
    return () => media.removeEventListener('change', updateHost);
  }, []);

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== 'neko-cafe-vocab') return;
      if (data.type === 'open-knowledge' && knowledgeKeys.has(data.contentKey)) {
        useSheetStore.getState().openKnowledge(data.contentKey);
        return;
      }
      if (data.type !== 'mark' || !itemKeys.has(data.contentKey)) return;
      const frame = frameRef.current?.contentWindow;
      try {
        const response = await fetch('/api/memory/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentKey: data.contentKey,
            selfReport: data.value === 'ok' ? 'remembered' : 'forgot',
            requestId: globalThis.crypto?.randomUUID?.() ?? `cafe-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          }),
        });
        if (response.ok && !learnedKeys.current.has(data.contentKey)) {
          learnedKeys.current.add(data.contentKey);
          setDisplayLearnedCount((value) => value + 1);
        }
        frame?.postMessage({ source: 'neko-cafe-vocab', type: 'mark-result', ok: response.ok }, window.location.origin);
      } catch {
        frame?.postMessage({ source: 'neko-cafe-vocab', type: 'mark-result', ok: false }, window.location.origin);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [itemKeys, knowledgeKeys]);

  return (
    <section className="knowledge-garden-shell cafe-vocab-shell" aria-label="Học từ vựng N5">
      <iframe ref={frameRef} className="knowledge-garden-frame" src={src}
        title="Sổ học từ vựng N5 ở quán cà phê" sandbox="allow-scripts allow-same-origin" />
      {toolbarHost ? createPortal(
        <div className="cafe-vocab-header">
          <div className="knowledge-header-copy"><div><strong>Từ vựng N5</strong><span>{displayLearnedCount}/{totalCount}</span></div></div>
        </div>, toolbarHost,
      ) : (
        <div className="knowledge-garden-toolbar kana-classroom-toolbar cafe-vocab-toolbar">
          <div className="knowledge-garden-heading">
            <h1>Từ vựng N5</h1>
            <span>{displayLearnedCount}/{totalCount}</span>
          </div>
        </div>
      )}
      <div className="knowledge-radical-test cafe-vocab-test">{children}</div>
    </section>
  );
}
