import 'server-only';
import { getLearnerContext } from '@/features/learning/learner-context';
import { JOURNEY_COMPLETION_METHODS, type JourneyAdvanceResult } from './journey-progress';

/**
 * JOURNEY SERVICE — nơi DUY NHẤT làm ngày lộ trình tăng lên.
 * Quy tắc nằm ở journey-progress.ts; file này chỉ nối quy tắc với nơi lưu trữ.
 */

/**
 * Người học bấm "Hoàn thành ngày X" và xác nhận — cách DUY NHẤT để sang ngày mới.
 * Chỉ có tác dụng với đúng ngày đang học (bấm hai lần, hai tab… không nhảy cóc).
 */
export async function completeJourneyDayManually(day: number): Promise<JourneyAdvanceResult> {
  const context = await getLearnerContext();
  if (day !== context.journeyDay || context.journey.isJourneyComplete) {
    return { hasAdvanced: false, ...context.journey };
  }
  return context.source.advanceJourneyDay(context.learner.userId, day, JOURNEY_COMPLETION_METHODS.MANUAL);
}
