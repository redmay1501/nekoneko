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

/**
 * Chặng của một ngày học — thứ tự cố định: Gặp lại → Học bù → Mới → Dùng thử (docs/session-engine.md).
 * Người học thấy mình đang ở chặng nào, nên biết "phần ôn" và "phần mới" là hai việc khác nhau.
 */
export const SESSION_PHASES = ['review', 'backlog', 'new', 'use'] as const;
export type SessionPhase = (typeof SESSION_PHASES)[number];

export const SESSION_PHASE_INFO: Record<SessionPhase, { emoji: string; label: string; intro: string }> = {
  review: { emoji: '🔄', label: 'Gặp lại', intro: 'Gặp lại vài thứ bạn đã học — xem bạn còn nhớ không nhé.' },
  backlog: { emoji: '📦', label: 'Học bù', intro: 'Vài kiến thức của ngày trước bạn chưa kịp học. Mình học bù một chút thôi.' },
  new: { emoji: '🌱', label: 'Mới', intro: 'Giờ học vài thứ mới của hôm nay.' },
  use: { emoji: '✨', label: 'Dùng thử', intro: 'Thử dùng những gì đã học trong một câu thật.' },
};

interface StepBase {
  stepIndex: number;
  contentKey: ContentKey;
  /** Chặng của bước. Phiên lưu trước khi có trường này → suy ra bằng phaseOfStep(). */
  phase?: SessionPhase;
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
  /** Chữ Nhật để đọc SAU khi trả lời (speechTextFor) — không đọc trước, kẻo lộ đáp án. Phiên cũ có thể thiếu. */
  audioText?: string;
}

export interface DiscoverStep extends StepBase {
  type: 'discover';
  card: DiscoverCard;
  /** Học bù: ngày lộ trình của kiến thức (để thẻ ghi "Học bù · từ ngày X"). */
  fromDay?: number;
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
  /** Câu luyện ngay của thứ VỪA học trong phiên — không tính là "nhớ lại" (chưa có khoảng cách thời gian). */
  isPractice?: boolean;
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
  /** Học tiếp phiên dở dang: bắt đầu từ bước này (bước trước đó đã trả lời và đã lưu). 0 = phiên mới. */
  resumeFromStep: number;
}

/** Chặng của một bước — dùng trường phase nếu có, nếu không (phiên cũ) suy ra từ loại bước. */
export function phaseOfStep(step: PublicSessionStep): SessionPhase {
  if (step.phase) return step.phase;
  if (step.type === 'surprise' || (step.type === 'recall' && !step.isPractice)) return 'review';
  if (step.type === 'use') return 'use';
  return 'new';
}
