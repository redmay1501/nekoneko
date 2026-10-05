import 'server-only';
import { type RecallStreak, summarizeRecallDates } from '@/features/progress/recall-streak';
import { cache } from 'react';
import { requireCurrentLearner, type CurrentLearner } from '@/features/auth/current-learner';
import { buildMemoryViews, seedScheduledMemory } from '@/features/memory/memory-service';
import type { MemoryRecord, MemoryView } from '@/features/memory/memory-types';
import { clampJourneyDay } from '@/features/roadmap/journey';
import type { JourneyPosition } from '@/features/roadmap/journey-progress';
import type { LearnerProfile, LearnerSettings, LearningDataSource } from '@/lib/data/data-source';
import { getLearningDataSource } from '@/lib/data/get-data-source';
import { getKnowledgeCatalog } from './content-service';
import type { KnowledgeCatalog } from './knowledge-catalog';
import type { ContentKey } from './knowledge-types';

/** Số ngày nhìn lại khi đếm "ngày nhớ lại". */

export interface LearnerContext {
  learner: CurrentLearner;
  source: LearningDataSource;
  profile: LearnerProfile;
  settings: LearnerSettings;
  catalog: KnowledgeCatalog;
  /** Ngày lộ trình đang học (= journey.currentDay). */
  journeyDay: number;
  journey: JourneyPosition;
  memoryRecords: Map<ContentKey, MemoryRecord>;
  memoryViews: Map<ContentKey, MemoryView>;
  /** Số ngày có ôn trong 30 ngày qua. */
  recallDays: number;
  streak: RecallStreak;
  now: Date;
}

/**
 * Mọi thứ một màn hình cần biết về người học hiện tại — gom ở MỘT chỗ.
 * Được cache trong phạm vi một request (React cache), nên nhiều component
 * cùng gọi cũng chỉ đọc database một lần.
 */
export const getLearnerContext = cache(async (): Promise<LearnerContext> => {
  const learner = await requireCurrentLearner();
  const source = await getLearningDataSource();
  const now = new Date();
  // Mọi lượt đọc độc lập chạy song song: database ở xa (mỗi lượt ~100ms), chạy nối tiếp là người học phải chờ.
  const [profile, settings, content, existingMemory, recallDates] = await Promise.all([
    source.getProfile(learner.userId),
    source.getSettings(learner.userId),
    source.getContent(),
    source.listMemoryRecords(learner.userId),
    source.listRecallDates(learner.userId),
  ]);
  const catalog = getKnowledgeCatalog(content);
  const streak = summarizeRecallDates(recallDates, now);
  // Ngày lộ trình theo NGÀY HỌC THẬT — chỉ tăng khi xong ngày (journey-progress.ts), không theo lịch.
  const journey: JourneyPosition = {
    currentDay: clampJourneyDay(profile.currentDay),
    isJourneyComplete: profile.journeyCompletedAt !== null,
  };
  const journeyDay = journey.currentDay;
  const memoryRecords = await seedScheduledMemory(source, learner.userId, existingMemory, catalog, journeyDay, now);
  return {
    learner, source, profile, settings, catalog, journeyDay, journey, memoryRecords, recallDays: streak.recallDays, streak, now,
    memoryViews: buildMemoryViews(catalog, memoryRecords, now),
  };
});
