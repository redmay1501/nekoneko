import 'server-only';
import { appDateKey } from '@/features/progress/recall-streak';
import { randomUUID } from 'node:crypto';
import { DEMO_LEARNER } from '@/config/demo';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { type ContentType, toContentKey } from '@/features/learning/knowledge-types';
import type { SessionMode } from '@/features/learning/session-modes';
import type { LearningSessionPlan, SessionSummary } from '@/features/learning/session-types';
import { generateDemoMemoryRecords } from '@/features/memory/demo-memory-seed';
import type { MemoryRecord, ReviewEventType } from '@/features/memory/memory-types';
import { JOURNEY_TOTAL_DAYS } from '@/features/roadmap/journey';
import type { JourneyAdvanceResult } from '@/features/roadmap/journey-progress';
import { addDays, toIsoDate } from '@/lib/utils/dates';
import { summarizeActivityEvents } from './activity-summary';
import { StaleMemoryRecordError } from './data-source';
import type {
  ActivitySummary,
  LearnerProfile,
  LearnerSettings,
  LearningDataSource,
  PersistMemoryUpdateInput,
  StoredSession,
} from './data-source';
import { loadSeedContent } from './seed-content';

/**
 * CHẾ ĐỘ DEMO — lưu mọi thứ trong bộ nhớ của tiến trình Next.js.
 *
 * Mục đích: `npm install && npm run dev` là thấy app chạy đủ luồng, không cần Supabase.
 * Giới hạn: dữ liệu mất khi tắt server; chỉ có một người học mẫu.
 *
 * Gắn vào globalThis để không bị reset mỗi lần Next.js hot-reload module.
 */

interface DemoReviewEvent {
  requestId: string;
  userId: string;
  eventType: ReviewEventType;
  contentKey: string;
  isCorrect: boolean | null;
  createdAt: string;
}

interface DemoStore {
  displayNames: Map<string, string>;
  memory: Map<string, Map<string, MemoryRecord>>;
  reviewEvents: DemoReviewEvent[];
  sessions: Map<string, StoredSession>;
  settings: Map<string, LearnerSettings>;
  journeys: Map<string, { currentDay: number; completedAt: string | null }>;
}

const DEFAULT_SETTINGS: LearnerSettings = {
  dailyMinutes: 8,
  reminderTime: '20:30',
  autoplayAudio: true,
  showFurigana: true,
  gameRecords: {},
  gentleMode: false,
  // Người học mẫu đang ở giữa lộ trình → đã qua lời chào từ lâu.
  welcomedAt: '2026-01-01T00:00:00.000Z',
  greetedAt: null,
  voiceGender: 'female',
};

const globalForDemo = globalThis as unknown as { nekoNekoDemoStore?: DemoStore };

function createDemoStore(): DemoStore {
  const now = new Date();
  const catalog = buildKnowledgeCatalog(loadSeedContent());
  const records = generateDemoMemoryRecords(catalog.items, DEMO_LEARNER.journeyDay, now);
  // Mô phỏng 7 ngày gần đây có nhớ lại kiến thức cũ — khớp chip "🧠 7 ngày nhớ lại" của prototype.
  const pastEvents: DemoReviewEvent[] = Array.from({ length: 7 }, (_, index) => ({
    requestId: `demo-history-${index}`,
    userId: DEMO_LEARNER.userId,
    eventType: 'recall' as const,
    contentKey: records[index] ? toContentKey(records[index].contentType, records[index].contentId) : `demo-${index}`,
    isCorrect: true,
    createdAt: addDays(now, -(index + 1)).toISOString(),
  }));
  return {
    displayNames: new Map(),
    memory: new Map([[DEMO_LEARNER.userId, new Map(records.map((record) => [toContentKey(record.contentType, record.contentId), record]))]]),
    reviewEvents: pastEvents,
    sessions: new Map(),
    settings: new Map([[DEMO_LEARNER.userId, { ...DEFAULT_SETTINGS }]]),
    journeys: new Map([[DEMO_LEARNER.userId, { currentDay: DEMO_LEARNER.journeyDay, completedAt: null }]]),
  };
}

function demoStore(): DemoStore {
  globalForDemo.nekoNekoDemoStore ??= createDemoStore();
  return globalForDemo.nekoNekoDemoStore;
}

function journeyOf(userId: string): { currentDay: number; completedAt: string | null } {
  const store = demoStore();
  let journey = store.journeys.get(userId);
  if (!journey) {
    journey = { currentDay: 1, completedAt: null };
    store.journeys.set(userId, journey);
  }
  return journey;
}

function memoryOf(userId: string): Map<string, MemoryRecord> {
  const store = demoStore();
  let userMemory = store.memory.get(userId);
  if (!userMemory) {
    userMemory = new Map();
    store.memory.set(userId, userMemory);
  }
  return userMemory;
}

export class DemoDataSource implements LearningDataSource {
  readonly kind = 'demo' as const;

  async getContent() {
    return loadSeedContent();
  }

  async getProfile(userId: string): Promise<LearnerProfile> {
    const startDate = addDays(new Date(), -(DEMO_LEARNER.journeyDay - 1));
    const journey = journeyOf(userId);
    return {
      userId,
      displayName: demoStore().displayNames.get(userId) ?? DEMO_LEARNER.displayName,
      startDate: toIsoDate(startDate),
      currentDay: journey.currentDay,
      journeyCompletedAt: journey.completedAt,
      examDate: toIsoDate(addDays(startDate, JOURNEY_TOTAL_DAYS - 1)),
      level: DEMO_LEARNER.level,
    };
  }

  async advanceJourneyDay(userId: string, fromDay: number): Promise<JourneyAdvanceResult> {
    const journey = journeyOf(userId);
    const hasAdvanced = journey.currentDay === fromDay && journey.completedAt === null;
    if (hasAdvanced) {
      if (fromDay >= JOURNEY_TOTAL_DAYS) journey.completedAt = new Date().toISOString();
      else journey.currentDay = fromDay + 1;
    }
    return { hasAdvanced, currentDay: journey.currentDay, isJourneyComplete: journey.completedAt !== null };
  }

  async getSettings(userId: string): Promise<LearnerSettings> {
    return demoStore().settings.get(userId) ?? { ...DEFAULT_SETTINGS };
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    demoStore().displayNames.set(userId, displayName);
  }

  async updateSettings(userId: string, patch: Partial<LearnerSettings>): Promise<LearnerSettings> {
    const next = { ...(await this.getSettings(userId)), ...patch };
    demoStore().settings.set(userId, next);
    return next;
  }

  async listMemoryRecords(userId: string): Promise<MemoryRecord[]> {
    return [...memoryOf(userId).values()].map((record) => ({ ...record }));
  }

  async insertMissingMemoryRecords(userId: string, records: MemoryRecord[]): Promise<void> {
    const userMemory = memoryOf(userId);
    for (const record of records) {
      const key = toContentKey(record.contentType, record.contentId);
      if (!userMemory.has(key)) userMemory.set(key, { ...record });
    }
  }

  async applyMemoryUpdate(input: PersistMemoryUpdateInput): Promise<{ isDuplicate: boolean }> {
    const store = demoStore();
    if (store.reviewEvents.some((event) => event.requestId === input.requestId)) return { isDuplicate: true };
    const current = memoryOf(input.userId).get(toContentKey(input.contentType, input.contentId));
    // Cùng luật khoá lạc quan như hàm SQL apply_memory_update.
    if ((current?.encounterCount ?? null) !== input.expectedEncounterCount) throw new StaleMemoryRecordError();

    memoryOf(input.userId).set(toContentKey(input.contentType, input.contentId), { ...input.nextRecord });
    store.reviewEvents.push({
      requestId: input.requestId, userId: input.userId, eventType: input.eventType, contentKey: toContentKey(input.contentType, input.contentId), isCorrect: input.isCorrect, createdAt: new Date().toISOString(),
    });
    if (input.session) {
      const session = store.sessions.get(input.session.sessionId);
      const sessionStep = session?.steps[input.session.stepIndex];
      if (sessionStep) {
        sessionStep.answeredAt = new Date().toISOString();
        sessionStep.result = input.session.stepResult;
      }
    }
    return { isDuplicate: false };
  }

  async getMemoryRecord(userId: string, contentType: ContentType, contentId: number): Promise<MemoryRecord | null> {
    const record = memoryOf(userId).get(toContentKey(contentType, contentId));
    return record ? { ...record } : null;
  }

  async summarizeActivity(userId: string, sinceIso: string): Promise<ActivitySummary> {
    const events = demoStore().reviewEvents.filter((event) => event.userId === userId && event.createdAt >= sinceIso);
    return summarizeActivityEvents(events.map((event) => ({ eventType: event.eventType, itemId: event.contentKey })));
  }

  async listRecallDates(userId: string): Promise<string[]> {
    const days = demoStore().reviewEvents
      .filter((event) => event.userId === userId && event.isCorrect === true)
      .map((event) => appDateKey(new Date(event.createdAt)));
    return [...new Set(days)].sort();
  }

  async createSession(userId: string, plan: LearningSessionPlan, journeyDay: number): Promise<string> {
    const id = randomUUID();
    demoStore().sessions.set(id, {
      id, userId, mode: plan.mode, journeyDay, startedAt: new Date().toISOString(), endedAt: null, summary: null,
      steps: plan.steps.map((step) => ({ step, answeredAt: null, result: null })),
    });
    return id;
  }

  async getSession(userId: string, sessionId: string): Promise<StoredSession | null> {
    const session = demoStore().sessions.get(sessionId);
    return session && session.userId === userId ? session : null;
  }

  async findLatestOpenSession(userId: string, mode: SessionMode, sinceIso: string): Promise<StoredSession | null> {
    const open = [...demoStore().sessions.values()]
      .filter((session) => session.userId === userId && session.mode === mode && session.endedAt === null && session.startedAt >= sinceIso)
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
    return open[0] ?? null;
  }

  async finishSession(userId: string, sessionId: string, summary: SessionSummary): Promise<void> {
    const session = await this.getSession(userId, sessionId);
    if (!session) return;
    session.endedAt ??= new Date().toISOString();
    session.summary = summary;
  }
}

let demoDataSourceInstance: DemoDataSource | null = null;

export function getDemoDataSource(): DemoDataSource {
  demoDataSourceInstance ??= new DemoDataSource();
  return demoDataSourceInstance;
}
