import type { VoiceGender } from '@/lib/speech/japanese-voices';
import type { N5Content } from '@/types/content';
import type { MemoryRecord, ReviewEventType } from '@/features/memory/memory-types';
import type { ContentType } from '@/features/learning/knowledge-types';
import type { SessionMode } from '@/features/learning/session-modes';
import type { JourneyAdvanceResult, JourneyCompletionMethod } from '@/features/roadmap/journey-progress';
import type { LearningSessionPlan, SessionStepWithAnswer, SessionSummary } from '@/features/learning/session-types';

/**
 * HỢP ĐỒNG LƯU TRỮ của Neko Neko.
 *
 * Domain service (memory-service, session-service…) chỉ nói chuyện với interface này.
 * Có hai cách hiện thực:
 *  - SupabaseDataSource : production — PostgreSQL + RLS.
 *  - DemoDataSource     : chạy ngay không cần cấu hình — lưu trong bộ nhớ máy chủ.
 *
 * Interface này KHÔNG chứa logic nghiệp vụ. Mọi con số (điểm, lịch gặp lại…) đều
 * do Memory Engine tính sẵn rồi mới truyền vào đây để lưu.
 */

export interface LearnerProfile {
  userId: string;
  displayName: string;
  /** yyyy-mm-dd — ngày tạo tài khoản, chỉ để hiển thị ("Bắt đầu từ đây"). KHÔNG dùng để tính ngày lộ trình. */
  startDate: string;
  /** Ngày lộ trình đang học (1…90) — chỉ tăng khi xong ngày, xem journey-progress.ts. */
  currentDay: number;
  /** Thời điểm xong ngày 90; null nếu chưa xong cả lộ trình. */
  journeyCompletedAt: string | null;
  examDate: string | null;
  /** Chỉ để hiển thị nhẹ. KHÔNG phải trục tiến bộ của Neko Neko. */
  level: number;
}

export interface LearnerSettings {
  dailyMinutes: number;
  reminderTime: string | null;
  autoplayAudio: boolean;
  showFurigana: boolean;
  gentleMode: boolean;
  /** Lúc người học đi qua lời chào lần đầu; null = chưa thấy → Trang chủ mở hộp thoại chào. */
  welcomedAt: string | null;
  /** Giọng đọc tiếng Nhật người học muốn nghe. */
  voiceGender: VoiceGender;
}

export interface StoredStepResult {
  answer: string;
  isCorrect: boolean | null;
  face: string;
  daysSinceSeenBefore: number | null;
}

export interface PersistMemoryUpdateInput {
  userId: string;
  /** Khoá chống ghi trùng — gửi lại cùng requestId thì không cộng điểm lần hai. */
  requestId: string;
  contentType: ContentType;
  contentId: number;
  eventType: ReviewEventType;
  answer: string | null;
  isCorrect: boolean | null;
  scoreBefore: number;
  scoreAfter: number;
  nextRecord: MemoryRecord;
  session: { sessionId: string; stepIndex: number; stepResult: StoredStepResult } | null;
  /**
   * Khoá lạc quan: số lần gặp của bản ghi lúc server ĐỌC để tính (null = lúc đọc chưa có bản ghi).
   * Bản ghi đã đổi từ lúc đó (request khác ghi trước) → applyMemoryUpdate ném StaleMemoryRecordError, không ghi đè.
   */
  expectedEncounterCount: number | null;
}

/** Bản ghi trí nhớ đã bị request khác cập nhật kể từ lúc đọc — đọc lại, tính lại rồi thử lại (memory-service). */
export class StaleMemoryRecordError extends Error {
  constructor() {
    super('Bản ghi trí nhớ vừa được cập nhật ở nơi khác');
    this.name = 'StaleMemoryRecordError';
  }
}

export interface ActivitySummary {
  /** Số kiến thức CŨ đã gặp lại (đúng hay sai đều tính) — không tính thứ vừa khám phá trong cùng khoảng thời gian. */
  revisitedCount: number;
  /** Số kiến thức mới đã khám phá. */
  discoveredCount: number;
}

export interface StoredSessionStep {
  step: SessionStepWithAnswer;
  answeredAt: string | null;
  result: StoredStepResult | null;
}

export interface StoredSession {
  id: string;
  userId: string;
  mode: SessionMode;
  /** Ngày lộ trình lúc bắt đầu phiên (null với phiên tạo trước khi có cột này). */
  journeyDay: number | null;
  startedAt: string;
  endedAt: string | null;
  steps: StoredSessionStep[];
  summary: SessionSummary | null;
}

export interface LearningDataSource {
  readonly kind: 'demo' | 'supabase';

  getContent(): Promise<N5Content>;

  getProfile(userId: string): Promise<LearnerProfile>;
  getSettings(userId: string): Promise<LearnerSettings>;
  updateSettings(userId: string, patch: Partial<LearnerSettings>): Promise<LearnerSettings>;
  /**
   * Xong ngày `fromDay` → mở ngày kế tiếp. Atomic, và KHÔNG làm gì nếu `fromDay` không phải ngày
   * đang học (bấm hai lần, hai tab…) — nên không bao giờ nhảy cóc.
   */
  advanceJourneyDay(userId: string, fromDay: number, method: JourneyCompletionMethod): Promise<JourneyAdvanceResult>;

  listMemoryRecords(userId: string): Promise<MemoryRecord[]>;
  /** Một bản ghi — đọc lại khi ghi bị từ chối vì xung đột. */
  getMemoryRecord(userId: string, contentType: ContentType, contentId: number): Promise<MemoryRecord | null>;
  /** Thêm bản ghi cho kiến thức lộ trình vừa gieo. Bỏ qua nếu đã tồn tại. */
  insertMissingMemoryRecords(userId: string, records: MemoryRecord[]): Promise<void>;
  /**
   * Ghi MỘT lần gặp lại — atomic: memory_items + review_events (+ session_items nếu có)
   * cùng thành công hoặc cùng thất bại.
   */
  applyMemoryUpdate(input: PersistMemoryUpdateInput): Promise<{ isDuplicate: boolean }>;
  /** Đếm hoạt động kể từ `sinceIso` — cho màn Nghỉ ngơi ("hôm nay bạn đã gặp lại… và gieo thêm…"). */
  summarizeActivity(userId: string, sinceIso: string): Promise<ActivitySummary>;
  /** Các ngày (yyyy-mm-dd, giờ Việt Nam) có ít nhất một lần nhớ đúng — toàn bộ lịch sử, tăng dần. */
  listRecallDates(userId: string): Promise<string[]>;

  createSession(userId: string, plan: LearningSessionPlan, journeyDay: number): Promise<string>;
  getSession(userId: string, sessionId: string): Promise<StoredSession | null>;
  /** Phiên CHƯA kết thúc mới nhất của chế độ này, bắt đầu từ sinceIso — để học tiếp sau khi tải lại trang / đóng tab. */
  findLatestOpenSession(userId: string, mode: SessionMode, sinceIso: string): Promise<StoredSession | null>;
  finishSession(userId: string, sessionId: string, summary: SessionSummary): Promise<void>;
}
