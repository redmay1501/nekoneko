'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type RecognitionOutcome, type RecognitionSession, getSpeechRecognitionConstructor, startRecognitionSession,
} from '@/features/speech/recognition-session';

/** Mỗi trang chỉ một lượt nghe: bắt đầu ở thẻ này thì huỷ lượt đang chạy ở thẻ khác (trình duyệt chỉ cho một micro / lúc). */
let activeSession: RecognitionSession | null = null;

/**
 * Nhận diện một câu tiếng Nhật bằng Web Speech API của trình duyệt. `isSupported` = null khi chưa biết (đang render ở server).
 * Không ghi âm, không lưu, không gửi âm thanh lên máy chủ NekoNeko.
 */
export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'done'>('idle');
  const [interim, setInterim] = useState('');
  const [outcome, setOutcome] = useState<RecognitionOutcome | null>(null);
  const sessionRef = useRef<RecognitionSession | null>(null);

  useEffect(() => {
    setIsSupported(getSpeechRecognitionConstructor() !== null);
    return () => {
      sessionRef.current?.cancel();
      if (activeSession === sessionRef.current) activeSession = null;
    };
  }, []);

  const start = useCallback(() => {
    activeSession?.cancel();
    setInterim('');
    setOutcome(null);
    setPhase('listening');
    let session: RecognitionSession | null = null;
    let isSettled = false;
    session = startRecognitionSession({
      Recognition: getSpeechRecognitionConstructor(),
      onInterim: setInterim,
      onOutcome: (result) => {
        isSettled = true;
        setOutcome(result);
        setPhase('done');
        if (session && activeSession === session) activeSession = null;
        if (session && sessionRef.current === session) sessionRef.current = null;
      },
    });
    // Không có API / start() lỗi → phiên đã kết thúc ngay khi tạo: không giữ lại.
    if (!isSettled) {
      sessionRef.current = session;
      activeSession = session;
    }
  }, []);

  const stop = useCallback(() => sessionRef.current?.stop(), []);

  const reset = useCallback(() => {
    sessionRef.current?.cancel();
    sessionRef.current = null;
    setInterim('');
    setOutcome(null);
    setPhase('idle');
  }, []);

  return { isSupported, phase, interim, outcome, start, stop, reset };
}
