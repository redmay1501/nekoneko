'use client';

import { answerListeningPractice } from '@/features/memory/memory-api';
import { AssessmentQuiz, type AssessmentQuestion } from './AssessmentQuiz';

/**
 * Bài nghe từ vựng — như AssessmentQuiz, thêm: mỗi câu trả lời được ghi vào trí nhớ (chạy nền, không bắt chờ).
 * Ghi lỗi (mất mạng…) thì bài vẫn chạy tiếp; lần ôn sau Neko vẫn hỏi lại từ đó.
 */
export function ListeningQuiz(props: { title: string; description: string; questions: AssessmentQuestion[]; emptyMessage: string }) {
  function recordAnswer(question: AssessmentQuestion, answer: string) {
    if (!question.contentKey) return;
    answerListeningPractice(question.contentKey, answer).catch(() => undefined);
  }
  return <AssessmentQuiz {...props} onAnswer={recordAnswer} />;
}
