'use client';

import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { createRequestId } from '@/lib/api/api-client';
import { rescueKnowledge } from '../memory-api';

/** Ghi nhận "đã cứu" khi người học đi hết luồng cứu kiến thức. Một requestId cho cả luồng → bấm lại không cộng điểm hai lần. */
export function useRescueKnowledge(contentKey: string) {
  const requestIdRef = useRef<string | null>(null);
  return useMutation({
    mutationFn: () => {
      requestIdRef.current ??= createRequestId();
      return rescueKnowledge(contentKey, requestIdRef.current);
    },
  });
}
