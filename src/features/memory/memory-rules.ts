import type { ContentType } from '@/features/learning/knowledge-types';
import type { MemoryStatus } from './memory-types';

/**
 * MỌI HẰNG SỐ CỦA MEMORY ENGINE NẰM Ở ĐÂY.
 *
 * Nguồn: sheet "5. Memory Engine" trong NOKORU_Ho_so_xay_dung_website.xlsx (file đặc tả, đặt khi app còn tên NOKORU).
 * Đây là bản đơn giản hoá cho MVP, chưa phải SM-2 chuẩn (câu hỏi Q-08).
 * Muốn chỉnh công thức sau khi có dữ liệu thật → chỉ sửa file này.
 */

export const MEMORY_SCORE_LIMITS = {
  /** Điểm thấp nhất có thể có, kể cả sau nhiều lần sai hoặc trôi lâu ngày. */
  FLOOR: 10,
  /** Điểm cao nhất. Để 99 chứ không 100: không có gì là nhớ tuyệt đối. */
  CEILING: 99,
} as const;

/**
 * Điểm khởi đầu khi một kiến thức vừa được lộ trình "gieo" (tới ngày học của nó).
 * GIẢ ĐỊNH của đội phát triển: đặc tả chưa ghi con số này. Chọn 35 để mục mới rơi vào
 * trạng thái "Chưa vững" (🌱 Hạt mới gieo) đúng như sheet 5 mô tả cho kiến thức mới học.
 */
export const INITIAL_MEMORY_SCORE = 35;

/** Ngưỡng điểm của từng trạng thái — sheet 5, mục A. */
export const STATUS_THRESHOLDS = {
  MASTERED: 90,
  STRONG: 74,
  LEARNING: 56,
  FADING: 40,
} as const;

/** Thưởng vừa phải, phạt nhẹ hơn thưởng — mục tiêu là quay lại, không phải trừng phạt. */
export const SCORE_CHANGE = {
  CORRECT: 14,
  WRONG: -6,
} as const;

/** Mỗi ngày không gặp lại, điểm trôi xuống chừng này (mô phỏng đường cong quên). */
export const DAILY_DRIFT = 0.45;

export const REVIEW_INTERVAL = {
  /** Trả lời đúng: gặp lại sau round(điểm / 18) ngày. Điểm càng cao, khoảng cách càng xa. */
  SCORE_DIVISOR_AFTER_CORRECT: 18,
  MIN_DAYS_AFTER_CORRECT: 1,
  /** Trả lời sai: gặp lại gần như ngay. */
  DAYS_AFTER_WRONG: 1,
  /** Vừa khám phá: gặp lại ngày mai để bắt đầu bám rễ. */
  DAYS_AFTER_DISCOVER: 1,
} as const;

/** Ra-đa "Kiến thức sắp quên" — sheet 5, mục C. */
export const FORGETTING_RADAR = {
  STATUSES: ['fading', 'weak'] as readonly MemoryStatus[],
  /** Vừa học hôm qua thì chưa tính là sắp quên — để người dùng thở. */
  MIN_DAYS_SINCE_SEEN: 2,
  MAX_ITEMS: 24,
  HOME_PREVIEW_ITEMS: 3,
} as const;

/** "Gặp lại kiến thức" — vùng vàng tạo cảm giác "ồ, mình vẫn nhớ". */
export const MEMORY_SURPRISE = {
  CONTENT_TYPES: ['vocabulary', 'kanji'] as readonly ContentType[],
  MIN_SCORE: 58,
  MAX_SCORE: 86,
  MIN_DAYS_SINCE_SEEN: 3,
} as const;

interface StatusPresentation {
  label: string;
  emoji: string;
  plant: string;
  color: string;
  background: string;
}

/** Cách hiển thị từng trạng thái — giữ đúng màu và biểu tượng của prototype. */
export const STATUS_PRESENTATION: Record<MemoryStatus, StatusPresentation> = {
  mastered: { label: 'Đã thành thạo', emoji: '🌸', plant: '🌸', color: '#E06C87', background: '#FFEFF2' },
  strong: { label: 'Đã nhớ tốt', emoji: '🌳', plant: '🌳', color: '#5EA368', background: '#F1FAF3' },
  learning: { label: 'Đang học', emoji: '🌿', plant: '🌿', color: '#7DBA82', background: '#F4FBF6' },
  fading: { label: 'Sắp quên', emoji: '🍂', plant: '🍂', color: '#D59A3C', background: '#FFF6E8' },
  weak: { label: 'Chưa vững', emoji: '🌱', plant: '🌱', color: '#C9774F', background: '#FDF1EA' },
  new: { label: 'Mới', emoji: '🫧', plant: '🫧', color: '#8E8781', background: '#FAF8F6' },
};

/** Thứ tự trạng thái từ khoẻ tới yếu — dùng cho thanh phân bố. */
export const LEARNED_STATUS_ORDER: readonly MemoryStatus[] = ['mastered', 'strong', 'learning', 'fading', 'weak'];

/** Chú giải Vườn tri thức — sheet 1 / prototype màn Vườn. */
export const GARDEN_STAGES: ReadonlyArray<{ status: MemoryStatus; label: string; description: string }> = [
  { status: 'weak', label: 'Mới học', description: 'Vừa gieo, chưa bám rễ' },
  { status: 'learning', label: 'Đang hình thành', description: 'Đã nhớ nhưng còn lung lay' },
  { status: 'strong', label: 'Đã nhớ tốt', description: 'Gọi ra được mà không cần nghĩ lâu' },
  { status: 'mastered', label: 'Đã thành thạo', description: 'Gần như không quên nữa' },
];
