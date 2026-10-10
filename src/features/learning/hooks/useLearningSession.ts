'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { QUERY_KEYS } from '@/lib/api/query-keys';
import { scrollToTop } from '@/lib/ui/motion';
import { startNavigation } from '@/stores/navigation-progress-store';
import { answerSessionStep, finishSession, startSession } from '../session-api';
import { SESSION_MODE_CONFIG, type SessionMode } from '../session-modes';
import { gradeAnswer, phaseOfStep, type SessionPhase, type StepAnswerFeedback } from '../session-types';

/**
 * Vòng đời một phiên học ở trình duyệt:
 *   tải phiên (server dựng các bước) → trả lời từng bước → sang bước sau → kết thúc → Khoảnh khắc tiến bộ.
 *
 * Phản hồi hiện NGAY khi bấm: trình duyệt tự chấm (gradeAnswer) bằng đáp án đi kèm phiên học.
 * Việc ghi lên server (server chấm lại + Memory Engine cập nhật trí nhớ) chạy ngầm phía sau;
 * khi server trả về, phần "sức nhớ / lần gặp tới" được điền thêm vào phản hồi đang hiện.
 */
export function useLearningSession(mode: SessionMode, focusKeys?: readonly string[]) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<StepAnswerFeedback | null>(null);
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  /** Đang đứng ở điểm dừng giữa hai chặng ("Học tiếp hay nghỉ?"). */
  const [isAtCheckpoint, setIsAtCheckpoint] = useState(false);
  /** Vừa xong một chặng (Gặp lại → Học bù → Mới → Dùng thử): chặng vừa xong, để hiện màn chuyển chặng. */
  const [finishedPhase, setFinishedPhase] = useState<SessionPhase | null>(null);
  const checkpointEvery = SESSION_MODE_CONFIG[mode].checkpointEvery;

  const sessionQuery = useQuery({
    queryKey: [...QUERY_KEYS.learningSession(mode, attempt), focusKeys?.join(',') ?? ''],
    queryFn: () => startSession(mode, focusKeys),
    // Mỗi lần mở: phiên mới, hoặc phiên dở dang cùng chế độ (server quyết định). Không tự tải lại giữa chừng.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const session = sessionQuery.data;
  const currentStep = session?.steps[stepIndex] ?? null;

  // Học tiếp phiên dở dang (tải lại trang / đóng tab): nhảy tới bước đầu tiên chưa làm — bước trước đã được lưu.
  const sessionId = session?.sessionId;
  const resumeFromStep = session?.resumeFromStep ?? 0;
  useEffect(() => {
    if (sessionId) setStepIndex(resumeFromStep);
  }, [sessionId, resumeFromStep]);

  /**
   * Hàng đợi ghi lên server: NỐI TIẾP trong cùng một kiến thức (thẻ giới thiệu ghi trước câu luyện ngay của chính nó,
   * để Memory Engine cộng trên bản ghi mới nhất), SONG SONG giữa các kiến thức khác nhau — trước đây nối tiếp tất cả
   * nên học nhanh thì hàng đợi dồn lại, tới cuối phiên phải chờ ghi hết mới tổng kết được (màn hình như bị đơ).
   */
  const writesByKnowledge = useRef(new Map<string, Promise<unknown>>());
  const allWrites = useRef(new Set<Promise<unknown>>());
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
    const key = session.steps[index]?.contentKey ?? `step-${index}`;
    const write = (writesByKnowledge.current.get(key) ?? Promise.resolve())
      .then(() => recordMutation.mutateAsync(request))
      .then((result) => {
        // Server là nguồn đúng: điền sức nhớ, và sửa kết quả nếu (hiếm khi) hai bên chấm khác nhau.
        if (visibleStepIndex.current === index) setFeedback((shown) => (shown ? { ...result, correctAnswer: shown.correctAnswer } : shown));
      })
      .catch(() => undefined); // Lỗi hiện qua recordMutation.error; không chặn các lần ghi sau.
    writesByKnowledge.current.set(key, write);
    allWrites.current.add(write);
    void write.finally(() => allWrites.current.delete(write));
  }

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Phiên học chưa sẵn sàng');
      // Tổng kết sau khi mọi câu trả lời đã được ghi.
      await Promise.all([...allWrites.current]);
      return finishSession(session.sessionId);
    },
    onSuccess: () => {
      if (!session) return;
      startNavigation();
      router.push(`/khoanh-khac?phien=${session.sessionId}`);
      // Khung (số ngày đã ôn, trang chủ) đang giữ payload 30 giây. Làm mới sau khi phiên đã lưu.
      router.refresh();
    },
  });

  // Mỗi khi sang bước / chặng / điểm dừng / màn kết thúc: đưa về đầu trang SAU khi giao diện mới đã vẽ
  // (gọi trước khi vẽ thì trình duyệt giữ chỗ cuộn cũ — người học thấy mình đang ở cuối trang).
  useEffect(() => {
    scrollToTop();
  }, [stepIndex, finishedPhase, isAtCheckpoint, finishMutation.isPending]);

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
      // Hiện ngay màn "Xong rồi!" (isFinishing) — phần lưu & tổng kết chạy phía sau.
      finishMutation.mutate();
      return;
    }
    setStepIndex(nextIndex);
    const previousPhase = phaseOfStep(session.steps[stepIndex]);
    if (phaseOfStep(session.steps[nextIndex]) !== previousPhase) {
      setFinishedPhase(previousPhase);
      return;
    }
    // Xong một chặng (giới thiệu + luyện ngay) và chặng sau vẫn là kiến thức mới → để người học tự chọn học tiếp hay nghỉ.
    const startsNewChunk = session.steps[nextIndex].type === 'discover' && session.steps[nextIndex - 1].type !== 'discover'
      && session.steps.slice(0, nextIndex).some((step) => step.type === 'discover');
    if (checkpointEvery && startsNewChunk) {
      setIsAtCheckpoint(true);
    }
  }

  /** Bước Khám phá không có đúng/sai: đi tiếp ngay, việc ghi nhận "đã gặp" chạy ngầm phía sau. */
  function acknowledgeAndContinue(answer: string) {
    recordInBackground(stepIndex, answer);
    goToNextStep();
  }

  function startNextPhase() {
    setFinishedPhase(null);
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
    setFinishedPhase(null);
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
    /** Tổng kết lỗi (mất mạng…) — màn kết thúc hiện nút thử lại, không bắt làm lại câu cuối. */
    finishError: finishMutation.error,
    retryFinish: () => finishMutation.mutate(),
    submitAnswer,
    goToNextStep,
    acknowledgeAndContinue,
    restart,
    isAtCheckpoint,
    checkpointEvery,
    finishedPhase,
    startNextPhase,
    continueAfterCheckpoint,
    stopAtCheckpoint,
  };
}
