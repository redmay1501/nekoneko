import type { ContentKey } from './knowledge-types';
import type { DiscoverCard } from './knowledge-presenter';
import type { SessionMode } from './session-modes';

export const SESSION_STEP_TYPES = {
  SURPRISE: 'surprise',
  RECALL: 'recall',
  DISCOVER: 'discover',
  USE: 'use',
} as const;

export type SessionStepType = (typeof SESSION_STEP_TYPES)[keyof typeof SESSION_STEP_TYPES];

/** Câu trả lời đặc biệt (không phải chọn đáp án). */
export const SELF_REPORT_ANSWERS = {
  REMEMBERED: 'remembered',
  FORGOT: 'forgot',
} as const;
export type SelfReportAnswer = (typeof SELF_REPORT_ANSWERS)[keyof typeof SELF_REPORT_ANSWERS];
export const DISCOVER_ACKNOWLEDGED = 'acknowledged';

interface StepBase {
  stepIndex: number;
  contentKey: ContentKey;
}

export interface SurpriseStep extends StepBase {
  type: 'surprise';
  face: string;
  reading: string;
  meaning: string;
  /** Chữ Nhật để đọc thành tiếng (speechTextFor) — không phải romaji. */
  audioText: string;
}

export interface RecallStep extends StepBase {
  type: 'recall';
  face: string;
  question: string;
  options: string[];
  /** Luyện ngay kiến thức VỪA được giới thiệu trong phiên này (không phải gặp lại thứ cũ). */
  isPractice?: boolean;
}

export interface DiscoverStep extends StepBase {
  type: 'discover';
  card: DiscoverCard;
}

export interface UseChooseSentenceStep extends StepBase {
  type: 'use';
  variant: 'choose-sentence';
  promptVi: string;
  options: string[];
}

export interface UseFillBlankStep extends StepBase {
  type: 'use';
  variant: 'fill-blank';
  contextJp: string;
  sentenceJp: string;
  promptVi: string;
  options: string[];
}

/** Bước học gửi xuống trình duyệt — KHÔNG chứa đáp án đúng. */
export type PublicSessionStep = SurpriseStep | RecallStep | DiscoverStep | UseChooseSentenceStep | UseFillBlankStep;

/** Bước học lưu ở server — có đáp án để chấm. */
export type SessionStepWithAnswer = PublicSessionStep & { correctAnswer: string | null };

export interface LearningSessionPlan {
  mode: SessionMode;
  steps: SessionStepWithAnswer[];
}

/** Kết quả một bước, dùng để tổng kết phiên. */
export interface AnsweredStep {
  stepType: SessionStepType;
  contentKey: ContentKey;
  face: string;
  isCorrect: boolean | null;
  daysSinceSeenBefore: number | null;
}

export interface SessionSummary {
  recalled: number;
  learnedNew: number;
  usedInContext: number;
  missed: number;
  /** "Bạn vừa nhớ lại 日本 sau 6 ngày." */
  highlight: { contentKey: ContentKey; face: string; daysSinceSeen: number } | null;
}

/** Phản hồi sau khi trả lời một bước. */
export interface StepAnswerFeedback {
  isCorrect: boolean | null;
  correctAnswer: string | null;
  memory: {
    scoreBefore: number;
    scoreAfter: number;
    lastEncounterText: string;
    nextEncounterText: string;
  } | null;
}

/**
 * Chấm một câu trả lời. null = bước không có đúng/sai (Khám phá).
 * Hàm thuần, dùng ở CẢ trình duyệt (hiện đáp án ngay khi bấm) lẫn server (chấm lại theo đáp án server lưu
 * rồi mới ghi trí nhớ) — hai bên luôn cho cùng một kết quả.
 */
export function gradeAnswer(step: { type: SessionStepType; correctAnswer: string | null }, answer: string): boolean | null {
  switch (step.type) {
    case 'surprise':
      return answer === SELF_REPORT_ANSWERS.REMEMBERED;
    case 'discover':
      return null;
    case 'recall':
    case 'use':
      return answer === step.correctAnswer;
  }
}

/**
 * Phiên học vừa bắt đầu — thứ trình duyệt nhận được. CÓ kèm đáp án đúng để trình duyệt chấm và hiện kết quả
 * ngay, không chờ mạng. Đánh đổi có chủ ý: người tự học xem trộm đáp án chỉ thiệt cho chính mình; server vẫn
 * tự chấm bằng bản đáp án của nó (session_items) nên không thể gửi kết quả giả lên.
 */
export interface StartedSession {
  sessionId: string;
  mode: SessionMode;
  targetMinutes: number;
  steps: SessionStepWithAnswer[];
}
