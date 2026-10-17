import { percentOf } from '@/lib/utils/text';

/** Lộ trình JLPT N5 có đúng 90 ngày — nguồn: file Excel lộ trình. Không đổi. */
export const JOURNEY_TOTAL_DAYS = 90;

export interface JourneyStage {
  from: number;
  to: number;
  name: string;
  subtitle: string;
  emoji: string;
  color: string;
}

/**
 * Bốn chặng đường (lộ trình phân bổ lại 18/10/2026 — docs/ROADMAP_REPLAN.md):
 * chữ cái → bộ thủ (3 ngày, nhận diện) → Minna bài 1–25 (Kanji học cùng từ chứa nó) → tổng ôn & thi thử.
 */
export const JOURNEY_STAGES: readonly JourneyStage[] = [
  { from: 1, to: 14, name: 'Bảng chữ cái', subtitle: 'Hiragana & Katakana', emoji: '🔤', color: '#FFC1CD' },
  { from: 15, to: 17, name: 'Bộ thủ', subtitle: '45 bộ — nhận diện mặt chữ', emoji: '🧩', color: '#F6D58E' },
  { from: 18, to: 81, name: 'Giáo trình', subtitle: 'Minna bài 1–25 · từ, Kanji, mẫu câu', emoji: '🌱', color: '#9FD3A6' },
  { from: 82, to: 90, name: 'Chinh phục N5', subtitle: 'Tổng ôn & thi thử', emoji: '🏯', color: '#D8C7F0' },
];

export function stageOfDay(day: number): JourneyStage {
  return JOURNEY_STAGES.find((stage) => day >= stage.from && day <= stage.to) ?? JOURNEY_STAGES[0];
}

export function clampJourneyDay(day: number): number {
  return Math.min(JOURNEY_TOTAL_DAYS, Math.max(1, Math.round(day)));
}

export function journeyProgressPercent(day: number): number {
  return percentOf(day, JOURNEY_TOTAL_DAYS);
}

/** Mỗi chặng đã đi được bao nhiêu ngày, tính tới `currentDay`. */
export function stageProgress(stage: JourneyStage, currentDay: number): { done: number; total: number } {
  const total = stage.to - stage.from + 1;
  const done = Math.max(0, Math.min(currentDay, stage.to) - stage.from + 1);
  return { done, total };
}
