'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { QUERY_KEYS } from '@/lib/api/query-keys';
import { startNavigation } from '@/stores/navigation-progress-store';
import { answerSessionStep, finishSession, startSession } from '../session-api';
import { SESSION_MODE_CONFIG, type SessionMode } from '../session-modes';
import { gradeAnswer, type StepAnswerFeedback } from '../session-types';

/**
 * Vòng đời một phiên học ở trình duyệt:
 *   tải phiên (server dựng các bước) → trả lời từng bước → sang bước sau → kết thúc → Khoảnh khắc tiến bộ.
 *
 * Phản hồi hiện NGAY khi bấm: trình duyệt tự chấm (gradeAnswer) bằng đáp án đi kèm phiên học.
 * Việc ghi lên server (server chấm lại + Memory Engine cập nhật trí nhớ) chạy ngầm phía sau, nối tiếp nhau;
 * khi server trả về, phần "sức nhớ / lần gặp tới" được điền thêm vào phản hồi đang hiện.
 */
export function useLearningSession(mode: SessionMode) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<StepAnswerFeedback | null>(null);
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  /** Đang đứng ở điểm dừng giữa hai chặng ("Học tiếp hay nghỉ?"). */
  const [isAtCheckpoint, setIsAtCheckpoint] = useState(false);
  const checkpointEvery = SESSION_MODE_CONFIG[mode].checkpointEvery;

  const sessionQuery = useQuery({
    queryKey: QUERY_KEYS.learningSession(mode, attempt),
    queryFn: () => startSession(mode),
    // Mỗi lần mở là một phiên mới; không tự tải lại giữa chừng.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const session = sessionQuery.data;
  const currentStep = session?.steps[stepIndex] ?? null;

  /**
   * Hàng đợi ghi lên server. NỐI TIẾP (không song song) để Memory Engine luôn cộng trên bản ghi mới nhất
   * và server tính tiến độ ngày trên dữ liệu đầy đủ (câu luyện ngay ghi sau thẻ giới thiệu cùng chữ).
   */
  const pendingWrites = useRef<Promise<unknown>>(Promise.resolve());
  /** Bước đang hiện — để phản hồi từ server về muộn không ghi đè lên bước sau. */
  const visibleStepIndex = useRef(0);
  visibleStepIndex.current = stepIndex;

  const recordMutation = useMutation({
    mutationFn: ({ sessionId, index, answer }: { sessionId: string; index: number; answer: string }) =>
      answerSessionStep(sessionId, index, answer),
    // Ghi trùng an toàn: server khoá theo (phiên, bước).
    retry: 2,
  });

  function recordInBackground(index: number, answer: string) {
    if (!session) return;
    const request = { sessionId: session.sessionId, index, answer };
    pendingWrites.current = pendingWrites.current
      .then(() => recordMutation.mutateAsync(request))
      .then((result) => {
        // Server là nguồn đúng: điền sức nhớ, và sửa kết quả nếu (hiếm khi) hai bên chấm khác nhau.
        if (visibleStepIndex.current === index) setFeedback((shown) => (shown ? { ...result, correctAnswer: shown.correctAnswer } : shown));
      })
      .catch(() => undefined); // Lỗi hiện qua recordMutation.error; không chặn các lần ghi sau.
  }

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Phiên học chưa sẵn sàng');
      // Tổng kết sau khi mọi câu trả lời đã được ghi.
      await pendingWrites.current;
      return finishSession(session.sessionId);
    },
    onSuccess: () => {
      if (!session) return;
      startNavigation();
      router.push(`/khoanh-khac?phien=${session.sessionId}`);
    },
  });

  function submitAnswer(answer: string) {
    if (!currentStep || feedback) return;
    setChosenAnswer(answer);
    setFeedback({ isCorrect: gradeAnswer(currentStep, answer), correctAnswer: currentStep.correctAnswer, memory: null });
    recordInBackground(stepIndex, answer);
  }

  function goToNextStep() {
    if (!session) return;
    setFeedback(null);
    setChosenAnswer(null);
    const nextIndex = stepIndex + 1;
    if (nextIndex >= session.steps.length) {
      finishMutation.mutate();
      return;
    }
    setStepIndex(nextIndex);
    // Xong một chặng (giới thiệu + luyện ngay) và chặng sau vẫn là kiến thức mới → để người học tự chọn học tiếp hay nghỉ.
    const startsNewChunk = session.steps[nextIndex].type === 'discover' && session.steps[nextIndex - 1].type !== 'discover'
      && session.steps.slice(0, nextIndex).some((step) => step.type === 'discover');
    if (checkpointEvery && startsNewChunk) {
      setIsAtCheckpoint(true);
    }
    window.scrollTo({ top: 0 });
  }

  /** Bước Khám phá không có đúng/sai: đi tiếp ngay, việc ghi nhận "đã gặp" chạy ngầm phía sau. */
  function acknowledgeAndContinue(answer: string) {
    recordInBackground(stepIndex, answer);
    goToNextStep();
  }

  function continueAfterCheckpoint() {
    setIsAtCheckpoint(false);
  }

  /** Dừng ở điểm dừng: kết thúc phiên, mọi thứ đã gặp đều đã được lưu. Lần sau học tiếp đúng chỗ này. */
  function stopAtCheckpoint() {
    setIsAtCheckpoint(false);
    finishMutation.mutate();
  }

  function restart() {
    setStepIndex(0);
    setFeedback(null);
    setChosenAnswer(null);
    setAttempt((value) => value + 1);
  }

  return {
    sessionQuery,
    session,
    stepIndex,
    currentStep,
    feedback,
    chosenAnswer,
    // Kết thúc xong vẫn tính là bận cho tới khi màn Khoảnh khắc mở ra — tránh bấm lại lần nữa.
    isFinishing: finishMutation.isPending || finishMutation.isSuccess,
    error: recordMutation.error ?? finishMutation.error,
    submitAnswer,
    goToNextStep,
    acknowledgeAndContinue,
    restart,
    isAtCheckpoint,
    checkpointEvery,
    continueAfterCheckpoint,
    stopAtCheckpoint,
  };
}
