'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { SelfReportAnswer } from '@/features/learning/session-types';
import { answerMemorySurprise, fetchAnotherSurprise } from '../memory-api';
import type { SurpriseCardData } from '../memory-overview';
import type { MemoryView } from '../memory-types';

type SurpriseState =
  | { status: 'asking'; card: SurpriseCardData }
  /** memory = null khi server chưa ghi xong — đáp án vẫn hé ngay, phần trí nhớ điền vào sau. */
  | { status: 'revealed'; card: SurpriseCardData; wasRemembered: boolean; memory: MemoryView | null }
  | { status: 'empty' };

/**
 * Luồng thẻ "Gặp lại kiến thức" ở Trang chủ:
 *   hỏi → (Tôi nhớ / Chưa nhớ) → hé lộ NGAY → server cập nhật trí nhớ (ngầm) → Gặp thứ khác.
 */
export function useMemorySurprise(initialCard: SurpriseCardData | null) {
  const [state, setState] = useState<SurpriseState>(initialCard ? { status: 'asking', card: initialCard } : { status: 'empty' });
  const [seenKeys, setSeenKeys] = useState<string[]>(initialCard ? [initialCard.contentKey] : []);

  const answerMutation = useMutation({
    mutationFn: ({ card, selfReport }: { card: SurpriseCardData; selfReport: SelfReportAnswer }) =>
      answerMemorySurprise(card.contentKey, selfReport),
    onSuccess: ({ memory }, { card }) =>
      setState((shown) => (shown.status === 'revealed' && shown.card.contentKey === card.contentKey ? { ...shown, memory } : shown)),
  });

  const nextMutation = useMutation({
    mutationFn: () => fetchAnotherSurprise(seenKeys, seenKeys.length),
    onSuccess: ({ surprise }) => {
      if (!surprise) {
        setState({ status: 'empty' });
        return;
      }
      setSeenKeys((keys) => [...keys, surprise.contentKey]);
      setState({ status: 'asking', card: surprise });
    },
  });

  return {
    state,
    answer: (selfReport: SelfReportAnswer) => {
      if (state.status !== 'asking') return;
      setState({ status: 'revealed', card: state.card, wasRemembered: selfReport === 'remembered', memory: null });
      answerMutation.mutate({ card: state.card, selfReport });
    },
    showAnother: () => nextMutation.mutate(),
    isBusy: nextMutation.isPending,
    isLoadingAnother: nextMutation.isPending,
    error: answerMutation.error ?? nextMutation.error,
  };
}
