'use client';

import { useMutation } from '@tanstack/react-query';
import { rescueKnowledge } from '../memory-api';

/** Ghi nhận "đã cứu" khi người học đi hết luồng cứu kiến thức. Một requestId cho cả luồng → bấm lại không cộng điểm hai lần. */
export function useRescueKnowledge(contentKey: string, requestId: string) {
  return useMutation({
    mutationFn: () => rescueKnowledge(contentKey, requestId),
  });
}
