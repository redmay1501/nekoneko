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
    <button type="button" className={className} style={style} aria-label={label} onClick={() => openKnowledge(contentKey)}>
      {children}
    </button>
  );
}
