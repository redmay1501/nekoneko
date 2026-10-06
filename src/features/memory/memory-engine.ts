import { addDays, wholeDaysBetween } from '@/lib/utils/dates';
import { pickDeterministic } from '@/lib/utils/deterministic-random';
import type { ContentKey, ContentType } from '@/features/learning/knowledge-types';
import {
  DAILY_DRIFT,
  FORGETTING_RADAR,
  INITIAL_MEMORY_SCORE,
  MEMORY_SCORE_LIMITS,
  MEMORY_SURPRISE,
  REVIEW_INTERVAL,
  SCORE_CHANGE,
  STATUS_THRESHOLDS,
} from './memory-rules';
import type {
  MemoryRecord,
  MemoryStatus,
  MemoryUpdateInput,
  MemoryUpdateResult,
  MemoryView,
} from './memory-types';
import { REVIEW_EVENT_TYPES } from './memory-types';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  MEMORY ENGINE — trái tim của Neko Neko
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Quyết định: điểm trí nhớ · trạng thái · lịch gặp lại · nguy cơ quên
 *  · thứ tự ưu tiên.
 *
 *  Nguyên tắc:
 *   1. TẤT ĐỊNH — cùng đầu vào luôn cho cùng đầu ra. Không gọi AI, không Math.random().
 *   2. THUẦN — không đọc/ghi database. Việc lưu do memory-service đảm nhiệm.
 *   3. CHỈ CHẠY Ở SERVER khi ra quyết định có hiệu lực (Route Handler).
 *      Client có thể gọi các hàm "chỉ đọc" để hiển thị, nhưng không bao giờ
 *      tự ghi kết quả.
 *
 *  Tài liệu: docs/memory-engine.md
 * ═══════════════════════════════════════════════════════════════════
 */

function clampScore(score: number): number {
  return Math.min(MEMORY_SCORE_LIMITS.CEILING, Math.max(MEMORY_SCORE_LIMITS.FLOOR, score));
}

/**
 * Số ngày kể từ lần cuối gặp kiến thức này. Nếu chưa gặp lại lần nào thì tính
 * từ lúc lộ trình gieo nó (createdAt) — đó chính là ngày người học học nó lần đầu.
 */
export function daysSinceLastEncounter(record: MemoryRecord, now: Date): number {
  return wholeDaysBetween(new Date(record.lastSeenAt ?? record.createdAt), now);
}

/**
 * Trạng thái để HIỂN THỊ: như điểm, trừ một ngoại lệ — "Sắp quên" nghĩa là đang phai vì lâu không gặp.
 * Thứ vừa học (điểm còn thấp nhưng mới gặp chưa tới FORGETTING_RADAR.MIN_DAYS_SINCE_SEEN ngày) là "mới học" 🌱,
 * không phải lá úa 🍂 — vừa học xong mà vườn báo sắp quên là sai.
 */
export function getViewStatus(score: number, daysSinceSeen: number): MemoryStatus {
  const status = getMemoryStatus(score);
  return status === 'fading' && daysSinceSeen < FORGETTING_RADAR.MIN_DAYS_SINCE_SEEN ? 'weak' : status;
}

/** Quy đổi điểm thành trạng thái. Trạng thái không bao giờ được lưu rời — luôn suy ra từ điểm. */
export function getMemoryStatus(score: number): MemoryStatus {
  if (score >= STATUS_THRESHOLDS.MASTERED) return 'mastered';
  if (score >= STATUS_THRESHOLDS.STRONG) return 'strong';
  if (score >= STATUS_THRESHOLDS.LEARNING) return 'learning';
  if (score >= STATUS_THRESHOLDS.FADING) return 'fading';
  return 'weak';
}

/**
 * Điểm trí nhớ THỰC TẾ ở thời điểm `now`.
 *
 * Điểm lưu trong database là điểm tại lastSeenAt. Mỗi ngày trôi qua không gặp lại,
 * trí nhớ mờ đi DAILY_DRIFT điểm. Tính lúc đọc nên không cần cron job.
 *
 * Vì sao mốc là lastSeenAt (không phải lastRecalledAt): mỗi lần ghi nhận, điểm lưu
 * đã bao gồm phần trôi tới lúc đó. Nếu lấy lastRecalledAt làm mốc, một lần trả lời
 * SAI (không cập nhật lastRecalledAt) sẽ khiến phần trôi bị trừ hai lần.
 */
export function getEffectiveMemoryScore(record: MemoryRecord, now: Date): number {
  const baseline = record.lastSeenAt ?? record.createdAt;
  const idleDays = wholeDaysBetween(new Date(baseline), now);
  return clampScore(Math.round(record.memoryScore - idleDays * DAILY_DRIFT));
}

/** Ngày gặp lại tiếp theo sau một lần ghi nhận. */
export function getNextReviewDate(scoreAfter: number, isCorrect: boolean | null, now: Date): Date {
  if (isCorrect === null) return addDays(now, REVIEW_INTERVAL.DAYS_AFTER_DISCOVER);
  if (!isCorrect) return addDays(now, REVIEW_INTERVAL.DAYS_AFTER_WRONG);
  const intervalDays = Math.max(
    REVIEW_INTERVAL.MIN_DAYS_AFTER_CORRECT,
    Math.round(scoreAfter / REVIEW_INTERVAL.SCORE_DIVISOR_AFTER_CORRECT),
  );
  return addDays(now, intervalDays);
}

/** Bản ghi mới cho kiến thức vừa được lộ trình gieo vào vườn. */
export function createInitialMemoryRecord(contentType: ContentType, contentId: number, now: Date): MemoryRecord {
  return {
    contentType,
    contentId,
    memoryScore: INITIAL_MEMORY_SCORE,
    encounterCount: 0,
    correctCount: 0,
    wrongCount: 0,
    rescuedCount: 0,
    lastSeenAt: null,
    lastRecalledAt: null,
    nextReviewAt: null,
    createdAt: now.toISOString(),
  };
}

/**
 * HÀM DUY NHẤT tính kết quả của một lần gặp lại.
 *
 * Đầu vào : bản ghi hiện tại (hoặc null nếu chưa có), loại sự kiện, đúng/sai.
 * Đầu ra  : bản ghi mới + điểm trước/sau để ghi vào review_events.
 *
 * Quy tắc (sheet 5, mục B):
 *  - Khám phá (isCorrect = null): không đổi điểm, chỉ tính là một lần gặp.
 *  - Đúng: +14, gặp lại sau round(điểm/18) ngày (tối thiểu 1).
 *  - Sai : −6, gặp lại sau 1 ngày.
 *  - Cứu : áp dụng như trả lời đúng + đếm số lần được cứu.
 *  - Phần trôi theo thời gian được "chốt" vào điểm ngay trước khi cộng/trừ.
 */
export function calculateMemoryUpdate(input: MemoryUpdateInput): MemoryUpdateResult {
  const { now, eventType } = input;
  const record = input.record ?? createInitialMemoryRecord(input.contentType, input.contentId, now);
  const isCorrect = eventType === REVIEW_EVENT_TYPES.RESCUE ? true : input.isCorrect;

  const scoreBefore = getEffectiveMemoryScore(record, now);
  const daysSinceSeenBefore = input.record ? daysSinceLastEncounter(record, now) : null;

  let scoreAfter = scoreBefore;
  if (isCorrect === true) scoreAfter = clampScore(scoreBefore + SCORE_CHANGE.CORRECT);
  if (isCorrect === false) scoreAfter = clampScore(scoreBefore + SCORE_CHANGE.WRONG);

  const nowIso = now.toISOString();
  const nextRecord: MemoryRecord = {
    ...record,
    memoryScore: scoreAfter,
    encounterCount: record.encounterCount + 1,
    correctCount: record.correctCount + (isCorrect === true ? 1 : 0),
    wrongCount: record.wrongCount + (isCorrect === false ? 1 : 0),
    rescuedCount: record.rescuedCount + (eventType === REVIEW_EVENT_TYPES.RESCUE ? 1 : 0),
    lastSeenAt: nowIso,
    lastRecalledAt: isCorrect === true ? nowIso : record.lastRecalledAt,
    nextReviewAt: getNextReviewDate(scoreAfter, isCorrect, now).toISOString(),
  };

  return { nextRecord, scoreBefore, scoreAfter, daysSinceSeenBefore };
}

// ───────────────────────── Diễn đạt bằng lời ─────────────────────────

export function describeTimeAgo(days: number | null): string {
  if (days === null) return '—';
  if (days <= 0) return 'hôm nay';
  if (days === 1) return 'hôm qua';
  return `${days} ngày trước`;
}

export function describeTimeUntil(days: number | null): string {
  if (days === null) return '—';
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Ngày mai';
  return `Khoảng ${days} ngày nữa`;
}

/** Lý do một kiến thức xuất hiện — luôn bằng tiếng Việt đời thường, không thuật ngữ. */
export function describeMemoryReason(status: MemoryStatus, memoryScore: number, wrongCount: number): string {
  if (status === 'new') return 'Chưa học tới';
  if (wrongCount > 0 && memoryScore < STATUS_THRESHOLDS.LEARNING + 4) return 'Bạn từng trả lời sai';
  switch (status) {
    case 'weak':
      return 'Mới gặp vài lần, chưa kịp bám lại';
    case 'fading':
      return 'Đã đến lúc gặp lại';
    case 'learning':
      return 'Gặp thêm một lần nữa cho chắc';
    case 'strong':
      return 'Giữ cho chắc thêm';
    case 'mastered':
      return 'Đã ở lại khá vững';
  }
}

/**
 * Dựng MemoryView để UI hiển thị. `record = null` nghĩa là chưa học tới.
 * Bản ghi lộ trình vừa gieo nhưng người học CHƯA GẶP lần nào (encounterCount = 0) cũng tính là chưa học:
 * chưa được giới thiệu thì không bị hỏi lại, không lên ra-đa, không mọc trong vườn.
 */
export function toMemoryView(
  contentKey: ContentKey,
  contentType: ContentType,
  record: MemoryRecord | null,
  now: Date,
): MemoryView {
  if (!record || record.encounterCount === 0) {
    return {
      contentKey, contentType, isLearned: false, status: 'new', memoryScore: 0,
      encounterCount: 0, correctCount: 0, wrongCount: 0, daysSinceSeen: null, daysUntilReview: null,
      lastEncounterText: '—', nextEncounterText: '—', reason: describeMemoryReason('new', 0, 0),
    };
  }
  const memoryScore = getEffectiveMemoryScore(record, now);
  const daysSinceSeen = daysSinceLastEncounter(record, now);
  const status = getViewStatus(memoryScore, daysSinceSeen);
  const daysUntilReview = record.nextReviewAt
    ? Math.max(0, Math.ceil((new Date(record.nextReviewAt).getTime() - now.getTime()) / 86_400_000))
    : 0;
  return {
    contentKey, contentType, isLearned: true, status, memoryScore,
    encounterCount: record.encounterCount, correctCount: record.correctCount, wrongCount: record.wrongCount,
    daysSinceSeen, daysUntilReview,
    lastEncounterText: describeTimeAgo(daysSinceSeen),
    nextEncounterText: describeTimeUntil(daysUntilReview),
    reason: describeMemoryReason(status, memoryScore, record.wrongCount),
  };
}

// ───────────────────────── Chọn kiến thức ─────────────────────────

/**
 * Ra-đa "Kiến thức sắp quên": trạng thái sắp quên / chưa vững, đã ít nhất 2 ngày
 * không gặp, xếp từ yếu nhất lên. Mục vừa gặp trong 1 ngày qua không bao giờ lọt vào.
 */
export function getForgettingRadar(views: readonly MemoryView[], limit: number = FORGETTING_RADAR.MAX_ITEMS): MemoryView[] {
  return views
    .filter((view) => view.isLearned && FORGETTING_RADAR.STATUSES.includes(view.status))
    .filter((view) => (view.daysSinceSeen ?? 0) >= FORGETTING_RADAR.MIN_DAYS_SINCE_SEEN)
    .sort((left, right) => left.memoryScore - right.memoryScore)
    .slice(0, limit);
}

/** Chọn MỘT kiến thức cho khoảnh khắc "Gặp lại kiến thức". */
export function pickMemorySurprise(
  views: readonly MemoryView[],
  seed: string,
  excludedKeys: readonly ContentKey[] = [],
): MemoryView | null {
  const inGoldenZone = views.filter(
    (view) =>
      view.isLearned &&
      MEMORY_SURPRISE.CONTENT_TYPES.includes(view.contentType) &&
      view.memoryScore >= MEMORY_SURPRISE.MIN_SCORE &&
      view.memoryScore <= MEMORY_SURPRISE.MAX_SCORE &&
      (view.daysSinceSeen ?? 0) >= MEMORY_SURPRISE.MIN_DAYS_SINCE_SEEN &&
      !excludedKeys.includes(view.contentKey),
  );
  // Không có gì trong vùng vàng thì lấy bất kỳ từ/kanji đã học — vẫn tốt hơn là trống.
  const pool = inGoldenZone.length
    ? inGoldenZone
    : views.filter((view) => view.isLearned && MEMORY_SURPRISE.CONTENT_TYPES.includes(view.contentType) && !excludedKeys.includes(view.contentKey));
  return pickDeterministic(pool, 1, `surprise:${seed}`)[0] ?? null;
}

/** Sức khoẻ trí nhớ = điểm trung bình của mọi kiến thức đã học. */
export function calculateMemoryHealth(views: readonly MemoryView[]): number {
  const learnedViews = views.filter((view) => view.isLearned);
  if (!learnedViews.length) return 0;
  return Math.round(learnedViews.reduce((sum, view) => sum + view.memoryScore, 0) / learnedViews.length);
}

/**
 * Độ ưu tiên gặp lại — số càng NHỎ càng cần gặp trước.
 * Ưu tiên: đã quá hạn > điểm thấp.
 */
export function getReviewPriority(view: MemoryView): number {
  const overdueBonus = view.daysUntilReview === 0 ? 0 : 100;
  return overdueBonus + view.memoryScore;
}

export function countByStatus(views: readonly MemoryView[]): Record<MemoryStatus, number> {
  const counts: Record<MemoryStatus, number> = { new: 0, weak: 0, fading: 0, learning: 0, strong: 0, mastered: 0 };
  for (const view of views) counts[view.status]++;
  return counts;
}
