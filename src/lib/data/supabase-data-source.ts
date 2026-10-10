import 'server-only';
import type { GameRecords } from '@/features/games/match-game';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import type { ContentType } from '@/features/learning/knowledge-types';
import type { SessionMode } from '@/features/learning/session-modes';
import type { JourneyAdvanceResult, JourneyCompletionMethod } from '@/features/roadmap/journey-progress';
import type { LearningSessionPlan, SessionStepWithAnswer, SessionSummary } from '@/features/learning/session-types';
import { getMemoryStatus } from '@/features/memory/memory-engine';
import type { MemoryRecord, ReviewEventType } from '@/features/memory/memory-types';
import { createAnonymousSupabaseClient } from '@/lib/supabase/server';
import type {
  LearningSessionRow, MemoryItemRow, ProfileRow, SessionItemRow, UserSettingsRow,
} from '@/lib/supabase/database-rows';
import { toIsoDate } from '@/lib/utils/dates';
import { summarizeActivityEvents } from './activity-summary';
import { StaleMemoryRecordError } from './data-source';
import type {
  ActivitySummary,
  LearnerProfile, LearnerSettings, LearningDataSource, PersistMemoryUpdateInput, StoredSession, StoredStepResult,
} from './data-source';
import { CONTENT_TABLES, type ContentRows, contentFromRows } from './supabase-content-mapper';

const CONTENT_CACHE_SECONDS = 60 * 60;
const INSERT_BATCH_SIZE = 500;

function throwIfError(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`Supabase: ${context} — ${error.message}`);
}

/**
 * Supabase (PostgREST) trả tối đa 1.000 dòng mỗi lần dù có gọi .limit() lớn hơn.
 * Đọc theo từng trang để không bao giờ âm thầm thiếu dữ liệu (ví dụ review_events tăng dần theo thời gian).
 */
const PAGE_SIZE = 1000;
type PageQuery = (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;

async function selectAllPages<Row>(query: PageQuery, context: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    throwIfError(error, context);
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Nội dung là dữ liệu tĩnh dùng chung → cache 1 giờ, đọc bằng anon key (không gắn cookie). */
const fetchCachedContent = unstable_cache(
  async () => {
    const client = createAnonymousSupabaseClient();
    const entries = await Promise.all(
      CONTENT_TABLES.map(async ({ key, table, orderBy }) => {
        const rows = await selectAllPages((from, to) => client.from(table).select('*').order(orderBy).range(from, to), `đọc bảng ${table}`);
        return [key, rows] as const;
      }),
    );
    return contentFromRows(Object.fromEntries(entries) as unknown as ContentRows);
  },
  ['neko-neko-n5-content'],
  { revalidate: CONTENT_CACHE_SECONDS, tags: ['content'] },
);

function toMemoryRecord(row: MemoryItemRow): MemoryRecord {
  return {
    contentType: row.content_type as ContentType, contentId: row.content_id, memoryScore: row.memory_score,
    encounterCount: row.encounter_count, correctCount: row.correct_count, wrongCount: row.wrong_count,
    rescuedCount: row.rescued_count, lastSeenAt: row.last_seen_at, lastRecalledAt: row.last_recalled_at,
    nextReviewAt: row.next_review_at, createdAt: row.created_at,
  };
}

function toProfile(row: ProfileRow): LearnerProfile {
  return {
    userId: row.id, displayName: row.display_name, startDate: row.start_date, examDate: row.exam_date, level: row.level,
    currentDay: row.current_day, journeyCompletedAt: row.journey_completed_at,
  };
}

function toSettings(row: UserSettingsRow): LearnerSettings {
  return {
    dailyMinutes: row.daily_minutes, reminderTime: row.reminder_time, autoplayAudio: row.autoplay_audio,
    showFurigana: row.show_furigana, gentleMode: row.gentle_mode, welcomedAt: row.welcomed_at ?? null, greetedAt: row.greeted_at ?? null,
    voiceGender: row.voice_gender === 'male' ? 'male' : 'female',
    gameRecords: (row.game_records ?? {}) as GameRecords,
  };
}

/**
 * Lưu trữ production.
 *  - userClient  : mang phiên người dùng → mọi truy vấn ĐỌC đi qua RLS.
 *  - adminClient : service role → chỉ dùng để GHI kết quả Memory Engine và đọc đáp án phiên học.
 */
export class SupabaseDataSource implements LearningDataSource {
  readonly kind = 'supabase' as const;

  constructor(
    private readonly userClient: SupabaseClient,
    private readonly getAdminClient: () => SupabaseClient,
  ) {}

  async getContent() {
    return fetchCachedContent();
  }

  async getProfile(userId: string): Promise<LearnerProfile> {
    const { data, error } = await this.userClient.from('profiles').select('*').eq('id', userId).maybeSingle();
    throwIfError(error, 'đọc hồ sơ');
    if (data) return toProfile(data as ProfileRow);
    // Trigger tạo hồ sơ lỗi hoặc tài khoản tạo trước migration → tạo bù, bắt đầu ở ngày 1.
    const fallback: ProfileRow = {
      id: userId, display_name: 'bạn', start_date: toIsoDate(new Date()), exam_date: null, level: 1, current_day: 1, journey_completed_at: null,
    };
    const insert = await this.getAdminClient().from('profiles').upsert(fallback, { onConflict: 'id' });
    throwIfError(insert.error, 'tạo hồ sơ bù');
    return toProfile(fallback);
  }

  async advanceJourneyDay(userId: string, fromDay: number, method: JourneyCompletionMethod): Promise<JourneyAdvanceResult> {
    const { data, error } = await this.getAdminClient().rpc('advance_journey_day', {
      p_user_id: userId,
      p_from_day: fromDay,
      p_method: method,
    });
    throwIfError(error, 'chuyển sang ngày kế tiếp');
    const result = data as { advanced: boolean; current_day: number; journey_completed: boolean };
    return { hasAdvanced: result.advanced, currentDay: result.current_day, isJourneyComplete: result.journey_completed };
  }

  async getSettings(userId: string): Promise<LearnerSettings> {
    const { data, error } = await this.userClient.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    throwIfError(error, 'đọc cài đặt');
    if (data) return toSettings(data as UserSettingsRow);
    const insert = await this.getAdminClient().from('user_settings').upsert({ user_id: userId }, { onConflict: 'user_id' }).select('*').single();
    throwIfError(insert.error, 'tạo cài đặt mặc định');
    return toSettings(insert.data as UserSettingsRow);
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    // Quyền: người học chỉ được tự sửa display_name / exam_date của chính mình (grant cột + RLS).
    const { error } = await this.userClient.from('profiles').update({ display_name: displayName }).eq('id', userId);
    throwIfError(error, 'đổi tên hiển thị');
  }

  async updateSettings(userId: string, patch: Partial<LearnerSettings>): Promise<LearnerSettings> {
    const update: Partial<UserSettingsRow> & { updated_at: string } = { updated_at: new Date().toISOString() };
    if (patch.dailyMinutes !== undefined) update.daily_minutes = patch.dailyMinutes;
    if (patch.reminderTime !== undefined) update.reminder_time = patch.reminderTime;
    if (patch.autoplayAudio !== undefined) update.autoplay_audio = patch.autoplayAudio;
    if (patch.showFurigana !== undefined) update.show_furigana = patch.showFurigana;
    if (patch.gentleMode !== undefined) update.gentle_mode = patch.gentleMode;
    if (patch.welcomedAt !== undefined) update.welcomed_at = patch.welcomedAt;
    if (patch.greetedAt !== undefined) update.greeted_at = patch.greetedAt;
    if (patch.voiceGender !== undefined) update.voice_gender = patch.voiceGender;
    if (patch.gameRecords !== undefined) update.game_records = { ...patch.gameRecords };
    const { data, error } = await this.userClient.from('user_settings').update(update).eq('user_id', userId).select('*').single();
    throwIfError(error, 'cập nhật cài đặt');
    return toSettings(data as UserSettingsRow);
  }

  async getMemoryRecord(userId: string, contentType: ContentType, contentId: number): Promise<MemoryRecord | null> {
    const { data, error } = await this.userClient.from('memory_items').select('*')
      .eq('user_id', userId).eq('content_type', contentType).eq('content_id', contentId).maybeSingle();
    throwIfError(error, 'đọc lại một bản ghi trí nhớ');
    return data ? toMemoryRecord(data as MemoryItemRow) : null;
  }

  async listMemoryRecords(userId: string): Promise<MemoryRecord[]> {
    const rows = await selectAllPages<MemoryItemRow>(
      (from, to) => this.userClient.from('memory_items').select('*').eq('user_id', userId).order('created_at').range(from, to),
      'đọc trí nhớ',
    );
    return rows.map(toMemoryRecord);
  }

  async insertMissingMemoryRecords(userId: string, records: MemoryRecord[]): Promise<void> {
    const rows = records.map((record) => ({
      user_id: userId, content_type: record.contentType, content_id: record.contentId,
      memory_score: record.memoryScore, status: getMemoryStatus(record.memoryScore),
      encounter_count: record.encounterCount, correct_count: record.correctCount, wrong_count: record.wrongCount,
      rescued_count: record.rescuedCount, last_seen_at: record.lastSeenAt, last_recalled_at: record.lastRecalledAt,
      next_review_at: record.nextReviewAt, created_at: record.createdAt,
    }));
    for (let start = 0; start < rows.length; start += INSERT_BATCH_SIZE) {
      const { error } = await this.getAdminClient()
        .from('memory_items')
        .upsert(rows.slice(start, start + INSERT_BATCH_SIZE), { onConflict: 'user_id,content_type,content_id', ignoreDuplicates: true });
      throwIfError(error, 'gieo kiến thức mới theo lộ trình');
    }
  }

  async applyMemoryUpdate(input: PersistMemoryUpdateInput): Promise<{ isDuplicate: boolean }> {
    const record = input.nextRecord;
    const { data, error } = await this.getAdminClient().rpc('apply_memory_update', {
      p_user_id: input.userId,
      p_request_id: input.requestId,
      p_content_type: input.contentType,
      p_content_id: input.contentId,
      p_event_type: input.eventType,
      p_answer: input.answer,
      p_is_correct: input.isCorrect,
      p_score_before: input.scoreBefore,
      p_score_after: input.scoreAfter,
      p_status: getMemoryStatus(input.scoreAfter),
      p_encounter_count: record.encounterCount,
      p_correct_count: record.correctCount,
      p_wrong_count: record.wrongCount,
      p_rescued_count: record.rescuedCount,
      p_last_seen_at: record.lastSeenAt,
      p_last_recalled_at: record.lastRecalledAt,
      p_next_review_at: record.nextReviewAt,
      p_created_at: record.createdAt,
      p_session_id: input.session?.sessionId ?? null,
      p_step_index: input.session?.stepIndex ?? null,
      p_step_result: input.session?.stepResult ?? null,
      p_expected_encounter_count: input.expectedEncounterCount,
    });
    // apply_memory_update báo 'stale_memory_record': bản ghi đã đổi kể từ lúc đọc (khoá lạc quan).
    if (error?.message.includes('stale_memory_record')) throw new StaleMemoryRecordError();
    throwIfError(error, 'ghi một lần gặp lại');
    return { isDuplicate: Boolean((data as { duplicate?: boolean } | null)?.duplicate) };
  }

  async summarizeActivity(userId: string, sinceIso: string): Promise<ActivitySummary> {
    const rows = await selectAllPages<{ event_type: ReviewEventType; memory_item_id: string }>(
      (from, to) => this.userClient.from('review_events').select('event_type, memory_item_id').eq('user_id', userId)
        .gte('created_at', sinceIso).order('id').range(from, to),
      'tóm tắt hoạt động',
    );
    return summarizeActivityEvents(rows.map((row) => ({ eventType: row.event_type, itemId: row.memory_item_id })));
  }

  async listRecallDates(_userId: string): Promise<string[]> {
    // Hàm SQL gom theo ngày giờ Việt Nam, chạy với quyền người học (RLS) — mỗi ngày một dòng.
    const { data, error } = await this.userClient.rpc('recall_dates');
    throwIfError(error, 'đọc các ngày nhớ lại');
    return ((data ?? []) as string[]).map((day) => String(day).slice(0, 10));
  }

  async createSession(userId: string, plan: LearningSessionPlan, journeyDay: number): Promise<string> {
    const admin = this.getAdminClient();
    const session = await admin.from('learning_sessions').insert({ user_id: userId, mode: plan.mode, journey_day: journeyDay }).select('id').single();
    throwIfError(session.error, 'tạo phiên học');
    const sessionId = (session.data as { id: string }).id;
    const items = plan.steps.map((step) => {
      const [contentType, contentId] = step.contentKey.split('-');
      return {
        session_id: sessionId, step_index: step.stepIndex, step_type: step.type,
        content_type: contentType, content_id: Number(contentId), payload: step, correct_answer: step.correctAnswer,
      };
    });
    if (items.length) {
      const { error } = await admin.from('session_items').insert(items);
      throwIfError(error, 'lưu các bước của phiên học');
    }
    return sessionId;
  }

  async getSession(userId: string, sessionId: string): Promise<StoredSession | null> {
    const admin = this.getAdminClient();
    // Đọc song song; các bước chỉ được dùng khi phiên đúng là của người học này (kiểm tra user_id ở truy vấn đầu).
    const [{ data, error }, items] = await Promise.all([
      admin.from('learning_sessions').select('*').eq('id', sessionId).eq('user_id', userId).maybeSingle(),
      admin.from('session_items').select('*').eq('session_id', sessionId).order('step_index'),
    ]);
    throwIfError(error, 'đọc phiên học');
    if (!data) return null;
    const row = data as LearningSessionRow;
    throwIfError(items.error, 'đọc các bước của phiên học');
    return {
      id: row.id, userId: row.user_id, mode: row.mode as SessionMode, journeyDay: row.journey_day, startedAt: row.started_at, endedAt: row.ended_at,
      summary: (row.summary as SessionSummary | null) ?? null,
      steps: (items.data as SessionItemRow[]).map((item) => ({
        step: item.payload as SessionStepWithAnswer,
        answeredAt: item.answered_at,
        result: (item.result as StoredStepResult | null) ?? null,
      })),
    };
  }

  async findLatestOpenSession(userId: string, mode: SessionMode, sinceIso: string): Promise<StoredSession | null> {
    const { data, error } = await this.getAdminClient().from('learning_sessions').select('id')
      .eq('user_id', userId).eq('mode', mode).is('ended_at', null).gte('started_at', sinceIso)
      .order('started_at', { ascending: false }).limit(1).maybeSingle();
    throwIfError(error, 'tìm phiên học dở dang');
    return data ? this.getSession(userId, (data as { id: string }).id) : null;
  }

  async finishSession(userId: string, sessionId: string, summary: SessionSummary): Promise<void> {
    const { error } = await this.getAdminClient()
      .from('learning_sessions')
      .update({
        ended_at: new Date().toISOString(), recalled: summary.recalled, learned_new: summary.learnedNew,
        used_in_context: summary.usedInContext, missed: summary.missed, summary,
      })
      .eq('id', sessionId).eq('user_id', userId);
    throwIfError(error, 'kết thúc phiên học');
  }
}
