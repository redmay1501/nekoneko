'use client';

import type { ReactNode } from 'react';
import { useSheetStore } from '@/stores/sheet-store';

interface KnowledgeChipButtonProps {
  contentKey: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  children: ReactNode;
}

/** Bất kỳ thứ gì bấm vào để mở khay "Chi tiết kiến thức". */
export function KnowledgeChipButton({ contentKey, className = 'chip', style, label, children }: KnowledgeChipButtonProps) {
  const openKnowledge = useSheetStore((state) => state.openKnowledge);
  return (
    // data-knowledge-key: KnowledgePrefetcher tải sẵn chi tiết của thẻ đang hiện → bấm là mở ngay.
    <button type="button" className={className} style={style} aria-label={label} data-knowledge-key={contentKey} onClick={() => openKnowledge(contentKey)}>
      {children}
    </button>
  );
}
