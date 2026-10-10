/**
 * MỘT Session Engine — nhiều chế độ.
 * Mọi chế độ chỉ khác nhau ở CẤU HÌNH dưới đây (sheet "6. Session Engine").
 * Không tạo file riêng cho từng chế độ.
 */

export const SESSION_MODES = {
  DAILY: 'daily',
  QUICK_5: 'quick5',
  RANDOM: 'random',
  MORE: 'more',
  RESCUE: 'rescue',
  FLOW: 'flow',
  RECALL: 'recall',
  DISCOVER: 'discover',
  USE: 'use',
  DAY: 'day',
  BACKLOG: 'backlog',
  FOCUS: 'focus',
} as const;

export type SessionMode = (typeof SESSION_MODES)[keyof typeof SESSION_MODES];

export interface SessionComposition {
  surprise: number;
  recall: number;
  discover: number;
  use: number;
}

/**
 * - priority : ưu tiên mục đến hạn và điểm thấp (phiên học thường).
 * - at-risk  : chỉ lấy từ ra-đa sắp quên (ôn lại sau khi nghỉ).
 */
export type RecallSource = 'priority' | 'at-risk';

/**
 * Kiến thức mới lấy bao nhiêu:
 * - next-chunk  : đúng `composition.discover` mục kế tiếp của ngày đang học.
 * - rest-of-day : TẤT CẢ kiến thức còn lại của ngày đang học (phiên "Học hết ngày").
 */
/** next-chunk: chặng kế tiếp của ngày · rest-of-day: hết phần còn lại của ngày · backlog-only: chỉ kiến thức ngày trước còn sót. */
export type NewKnowledgeScope = 'next-chunk' | 'rest-of-day' | 'backlog-only';

/**
 * Một CHẶNG = 5 kiến thức mới. Theo kinh nghiệm của các app ghi nhớ (WaniKani mặc định lô 5 mục):
 * đủ nhỏ để không quá tải, đủ lớn để thấy mình vừa xong một phần.
 */
export const DAY_CHUNK_SIZE = 5;

/** Phiên "Học theo lựa chọn" nhận tối đa chừng này kiến thức — đủ trọn một bài từ vựng (bài dài nhất 53 từ). */
export const MAX_FOCUS_ITEMS = 60;

/** Đường dẫn mở phiên "Học theo lựa chọn" cho các kiến thức này. */
export function focusSessionHref(keys: readonly string[]): string {
  return `/hoc/${SESSION_MODES.FOCUS}?k=${keys.slice(0, MAX_FOCUS_ITEMS).join(',')}`;
}

/** Phiên "Học hôm nay" học bù tối đa chừng này kiến thức ngày cũ — đủ để không bỏ sót, không nuốt phiên. */
export const BACKLOG_PER_DAILY_SESSION = 3;

export interface SessionModeConfig {
  label: string;
  emoji: string;
  /** Câu mô tả cảm xúc hiện trong thẻ chọn kiểu học. */
  description: string;
  cardBackground: string;
  targetMinutes: number;
  composition: SessionComposition;
  recallSource: RecallSource;
  newKnowledgeScope: NewKnowledgeScope;
  /** Sau mỗi chừng này bước Khám phá thì dừng lại hỏi "Học tiếp hay nghỉ?". null = không dừng. */
  checkpointEvery: number | null;
  /** Hiện trong khay "Học ngay" và màn Luyện tập. */
  isPickable: boolean;
  /**
   * Học bù: tối đa bấy nhiêu kiến thức của các ngày TRƯỚC còn chưa gặp, học trước kiến thức mới của hôm nay.
   * Có giới hạn để phần học bù không nuốt hết phiên học (BACKLOG — docs/session-engine.md).
   */
  backlogPerSession: number;
}

export const SESSION_MODE_CONFIG: Record<SessionMode, SessionModeConfig> = {
  // Một ngày học trọn vẹn, theo chặng: Gặp lại (≤5) → Học bù (≤3) → Mới (TOÀN BỘ kiến thức còn lại của ngày, từng chặng 5 thứ,
  // hết mỗi chặng hỏi "Học tiếp hay nghỉ?") → Dùng thử (2). Nghỉ giữa chừng thì lần sau học tiếp đúng chỗ đó.
  daily: {
    label: 'Học hôm nay', emoji: '🌱', description: 'Ôn bài cũ, học bài mới, rồi đặt một câu.', cardBackground: '#FFEFF2',
    targetMinutes: 8, composition: { surprise: 1, recall: 4, discover: DAY_CHUNK_SIZE, use: 2 }, recallSource: 'priority', isPickable: false,
    backlogPerSession: BACKLOG_PER_DAILY_SESSION,
    newKnowledgeScope: 'rest-of-day', checkpointEvery: DAY_CHUNK_SIZE,
  },
  // Học bù: chỉ kiến thức các ngày trước còn chưa gặp (bấm "Hoàn thành ngày" khi còn sót, bỏ dở…), cũ nhất trước.
  backlog: {
    label: 'Học bù', emoji: '📦', description: 'Kiến thức các ngày trước bạn chưa kịp học.', cardBackground: '#FFF3DE',
    targetMinutes: 5, composition: { surprise: 0, recall: 0, discover: DAY_CHUNK_SIZE, use: 0 }, recallSource: 'priority', isPickable: false,
    backlogPerSession: DAY_CHUNK_SIZE,
    newKnowledgeScope: 'backlog-only', checkpointEvery: null,
  },
  // Đi hết kiến thức còn lại của ngày đang học trong MỘT phiên, có điểm dừng sau mỗi chặng.
  day: {
    label: 'Học hết ngày', emoji: '📘', description: 'Đi hết kiến thức của ngày, từng chặng 5 thứ.', cardBackground: '#FFF3DE',
    targetMinutes: 15, composition: { surprise: 0, recall: 0, discover: 0, use: 2 }, recallSource: 'priority', isPickable: false, backlogPerSession: 0,
    newKnowledgeScope: 'rest-of-day', checkpointEvery: DAY_CHUNK_SIZE,
  },
  // Học theo lựa chọn: người học chọn kiến thức ở trang Học tập. Thứ đã học → hỏi lại (Gặp lại, ghi trí nhớ như ôn);
  // thứ chưa học → giới thiệu từng chặng 5 thứ rồi luyện ngay. Số lượng do lựa chọn quyết định, không theo composition.
  focus: {
    label: 'Học theo lựa chọn', emoji: '🎯', description: 'Học hoặc kiểm tra đúng những gì bạn chọn.', cardBackground: '#FFEFF2',
    targetMinutes: 8, composition: { surprise: 0, recall: 0, discover: 0, use: 0 }, recallSource: 'priority', isPickable: false, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: DAY_CHUNK_SIZE,
  },
  quick5: {
    label: 'Học nhanh 5 phút', emoji: '⚡', description: 'Không cần suy nghĩ. Neko Neko chọn cho bạn.', cardBackground: '#FFF3DE',
    targetMinutes: 5, composition: { surprise: 1, recall: 3, discover: 0, use: 0 }, recallSource: 'priority', isPickable: true, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
  random: {
    label: 'Học ngẫu nhiên', emoji: '🪄', description: 'Neko chọn vài chữ bất kỳ để bạn ôn.', cardBackground: '#EAE4F7',
    targetMinutes: 6, composition: { surprise: 1, recall: 2, discover: 1, use: 1 }, recallSource: 'priority', isPickable: true, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
  more: {
    label: 'Học thêm', emoji: '🌱', description: 'Khi bạn muốn học tiếp.', cardBackground: '#DFF3E4',
    targetMinutes: 5, composition: { surprise: 0, recall: 3, discover: 3, use: 0 }, recallSource: 'priority', isPickable: true, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
  rescue: {
    label: 'Ôn lại sau khi nghỉ', emoji: '🔄', description: 'Ôn những thứ lâu rồi chưa gặp.', cardBackground: '#E2F0F8',
    targetMinutes: 6, composition: { surprise: 0, recall: 5, discover: 0, use: 0 }, recallSource: 'at-risk', isPickable: true, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
  flow: {
    label: 'Học liên tục', emoji: '🌊', description: 'Khi bạn đang có hứng.', cardBackground: '#FFEFF2',
    targetMinutes: 12, composition: { surprise: 1, recall: 4, discover: 3, use: 2 }, recallSource: 'priority', isPickable: true, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
  recall: {
    label: 'Gặp lại kiến thức', emoji: '🧠', description: 'Những thứ đã đến lúc gặp lại.', cardBackground: '#FFEFF2',
    targetMinutes: 4, composition: { surprise: 0, recall: 4, discover: 0, use: 0 }, recallSource: 'at-risk', isPickable: false, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
  discover: {
    label: 'Khám phá', emoji: '🌱', description: 'Một vài thứ mới, nhỏ thôi.', cardBackground: '#DFF3E4',
    targetMinutes: 4, composition: { surprise: 0, recall: 0, discover: 4, use: 0 }, recallSource: 'priority', isPickable: false, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
  use: {
    label: 'Thực hành', emoji: '💬', description: 'Đưa kiến thức vào câu thật.', cardBackground: '#E2F0F8',
    targetMinutes: 4, composition: { surprise: 0, recall: 0, discover: 0, use: 4 }, recallSource: 'priority', isPickable: false, backlogPerSession: 0,
    newKnowledgeScope: 'next-chunk', checkpointEvery: null,
  },
};

/** Thứ tự hiện trong khay "Học ngay" — giữ đúng prototype. */
export const PICKABLE_MODES: readonly SessionMode[] = ['quick5', 'random', 'more', 'rescue', 'flow'];

export function isSessionMode(value: string): value is SessionMode {
  return Object.values(SESSION_MODES).includes(value as SessionMode);
}

/** Số bước của một phiên đủ nội dung. Mỗi kiến thức mới = 1 bước giới thiệu + 1 câu luyện ngay. */
export function totalSteps(composition: SessionComposition): number {
  return composition.surprise + composition.recall + composition.discover * 2 + composition.use;
}
