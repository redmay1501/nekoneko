import 'server-only';
import { randomUUID } from 'node:crypto';
import { requireCurrentLearner } from '@/features/auth/current-learner';
import { recordMemoryEvent } from '@/features/memory/memory-service';
import { getLearningDataSource } from '@/lib/data/get-data-source';
import { describeTimeAgo } from '@/features/memory/memory-engine';
import { NotFoundError } from '@/lib/api/errors';
import type { ContentKey } from './knowledge-types';
import { getLearnerContext } from './learner-context';
import { buildLearningSession, evaluateStepAnswer, reviewEventTypeForStep, summarizeSession } from './session-engine';
import { SESSION_MODE_CONFIG, type SessionMode } from './session-modes';
import {
  type AnsweredStep,
  type SessionSummary,
  type StartedSession,
  type StepAnswerFeedback,
} from './session-types';

/**
 * SESSION SERVICE — vòng đời một phiên học:
 *   bắt đầu (dựng các bước) → trả lời từng bước (chấm + ghi trí nhớ) → kết thúc (tổng kết).
 *
 * Trình duyệt nhận cả đáp án để chấm ngay (xem StartedSession); server luôn chấm lại bằng bản đáp án nó lưu
 * trong session_items trước khi ghi trí nhớ — kết quả gửi lên từ trình duyệt không bao giờ được tin.
 */

/** Phiên dở dang quá chừng này thì không học tiếp nữa (nội dung ôn tập đã lỗi thời) — tạo phiên mới. */
const RESUME_WINDOW_HOURS = 12;

/**
 * Bắt đầu một phiên — hoặc HỌC TIẾP phiên dở dang cùng chế độ (tải lại trang, đóng tab giữa chừng):
 * cùng ngày lộ trình, trong RESUME_WINDOW_HOURS giờ, còn bước chưa làm → trả lại đúng phiên đó.
 */
export async function startLearningSession(mode: SessionMode): Promise<StartedSession> {
  const context = await getLearnerContext();
  const targetMinutes = SESSION_MODE_CONFIG[mode].targetMinutes;
  const since = new Date(context.now.getTime() - RESUME_WINDOW_HOURS * 3_600_000).toISOString();
  const open = await context.source.findLatestOpenSession(context.learner.userId, mode, since);
  const resumeFromStep = open?.steps.findIndex((stored) => stored.result === null) ?? -1;
  // Còn bước chưa làm (kể cả chưa làm bước nào — tránh đẻ thêm phiên bỏ dở mỗi lần tải lại).
  if (open && resumeFromStep >= 0 && open.journeyDay === context.journeyDay) {
    return { sessionId: open.id, mode, targetMinutes, steps: open.steps.map((stored) => stored.step), resumeFromStep };
  }

  const plan = buildLearningSession({
    mode,
    seed: randomUUID(),
    catalog: context.catalog,
    memoryViews: context.memoryViews,
    journeyDay: context.journeyDay,
  });
  const sessionId = await context.source.createSession(context.learner.userId, plan, context.journeyDay);
  return { sessionId, mode, targetMinutes, steps: plan.steps, resumeFromStep: 0 };
}

export interface AnswerStepInput {
  sessionId: string;
  stepIndex: number;
  answer: string;
}

export async function answerSessionStep(input: AnswerStepInput): Promise<StepAnswerFeedback> {
  const learner = await requireCurrentLearner();
  // Ngữ cảnh người học và phiên học độc lập nhau → đọc song song.
  const [context, session] = await Promise.all([
    getLearnerContext(),
    getLearningDataSource().then((source) => source.getSession(learner.userId, input.sessionId)),
  ]);
  const storedStep = session?.steps[input.stepIndex];
  if (!session || !storedStep) throw new NotFoundError('bước học');

  const { step } = storedStep;
  // Đã trả lời rồi (bấm hai lần, mạng gửi lại): trả lại kết quả cũ, không ghi thêm.
  if (storedStep.result) {
    return { isCorrect: storedStep.result.isCorrect, correctAnswer: step.correctAnswer, memory: null };
  }

  const item = context.catalog.byKey.get(step.contentKey);
  if (!item) throw new NotFoundError(`kiến thức ${step.contentKey}`);

  const isCorrect = evaluateStepAnswer(step, input.answer);
  const recorded = await recordMemoryEvent({
    source: context.source,
    userId: context.learner.userId,
    item,
    existingRecord: context.memoryRecords.get(item.key) ?? null,
    eventType: reviewEventTypeForStep(step),
    answer: input.answer,
    isCorrect,
    requestId: `${input.sessionId}:${input.stepIndex}`,
    now: new Date(),
    session: { sessionId: input.sessionId, stepIndex: input.stepIndex },
  });


  return {
    isCorrect,
    correctAnswer: step.correctAnswer,
    memory: {
      scoreBefore: recorded.scoreBefore,
      scoreAfter: recorded.scoreAfter,
      lastEncounterText: recorded.daysSinceSeenBefore === null ? 'lần đầu' : describeTimeAgo(recorded.daysSinceSeenBefore),
      nextEncounterText: recorded.view.nextEncounterText,
    },
  };
}

export async function finishLearningSession(sessionId: string): Promise<SessionSummary> {
  const context = await getLearnerContext();
  const session = await context.source.getSession(context.learner.userId, sessionId);
  if (!session) throw new NotFoundError('phiên học');
  if (session.summary) return session.summary;

  const answered: AnsweredStep[] = session.steps
    .filter((stored) => stored.result !== null)
    .map((stored) => ({
      stepType: stored.step.type,
      contentKey: stored.step.contentKey,
      face: stored.result?.face ?? '',
      isCorrect: stored.result?.isCorrect ?? null,
      daysSinceSeenBefore: stored.result?.daysSinceSeenBefore ?? null,
      isPractice: stored.step.type === 'recall' && stored.step.isPractice === true,
    }));
  const summary = summarizeSession(answered);
  await context.source.finishSession(context.learner.userId, sessionId, summary);
  return summary;
}

export interface FinishedSession {
  mode: SessionMode;
  summary: SessionSummary;
  /** Kiến thức người học đã thực sự gặp trong phiên (mỗi thứ một lần) — để nói "khi nào gặp lại". */
  encounteredKeys: ContentKey[];
}

export async function getFinishedSession(sessionId: string): Promise<FinishedSession | null> {
  const context = await getLearnerContext();
  const session = await context.source.getSession(context.learner.userId, sessionId);
  if (!session) return null;
  const summary = session.summary ?? (await finishLearningSession(sessionId));
  const encounteredKeys = [...new Set(session.steps.filter((stored) => stored.result !== null).map((stored) => stored.step.contentKey))];
  return { mode: session.mode, summary, encounteredKeys };
}
