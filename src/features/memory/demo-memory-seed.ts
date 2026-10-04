import { addDays } from '@/lib/utils/dates';
import { hashToUnitInterval } from '@/lib/utils/deterministic-random';
import type { KnowledgeItem } from '@/features/learning/knowledge-types';
import { createInitialMemoryRecord } from './memory-engine';
import type { MemoryRecord } from './memory-types';

/**
 * DỮ LIỆU TRÍ NHỚ GIẢ cho chế độ demo và cho QA.
 *
 * Mô phỏng một người học ở giữa lộ trình: phần lớn kiến thức khoẻ, khoảng 9% đang
 * mờ dần. Phân bố giữ đúng như prototype HTML để giao diện trông giống bản thiết kế.
 *
 * KHÔNG dùng cho người dùng thật. Người dùng thật bắt đầu từ trạng thái trống và
 * được Memory Engine dựng dần qua từng lần học.
 */

type Band = 'mastered' | 'strong' | 'learning' | 'fading' | 'weak';

const BAND_SCORE_RANGE: Record<Band, [number, number]> = {
  mastered: [90, 99],
  strong: [75, 89],
  learning: [57, 73],
  fading: [42, 55],
  weak: [20, 39],
};

function pickBand(daysSinceLearned: number, roll: number): Band {
  if (daysSinceLearned <= 1) return roll < 0.6 ? 'weak' : 'learning';
  if (roll < 0.26) return 'mastered';
  if (roll < 0.72) return 'strong';
  if (roll < 0.93) return 'learning';
  if (roll < 0.975) return 'fading';
  return 'weak';
}

export function generateDemoMemoryRecords(items: readonly KnowledgeItem[], journeyDay: number, now: Date): MemoryRecord[] {
  return items
    .filter((item) => item.day !== null && item.day <= journeyDay)
    .map((item) => {
      // Kiến thức của NGÀY ĐANG HỌC: mới được gieo, chưa gặp lần nào — giống hệt người học thật.
      if (item.day === journeyDay) return createInitialMemoryRecord(item.type, item.id, now);
      const roll = hashToUnitInterval(`${item.key}:band`);
      const variance = hashToUnitInterval(`${item.key}:score`);
      const daysSinceLearned = journeyDay - (item.day ?? journeyDay);
      const [low, high] = BAND_SCORE_RANGE[pickBand(daysSinceLearned, roll)];
      const lastSeenDaysAgo = Math.max(0, Math.round(daysSinceLearned * (0.25 + variance * 0.5)));
      const encounterCount = 1 + Math.round(variance * 4) + (daysSinceLearned > 10 ? 1 : 0);
      const wasWrongOnce = variance > 0.62 && roll > 0.72;
      const score = Math.round(low + variance * (high - low));
      const lastSeen = addDays(now, -lastSeenDaysAgo);
      return {
        contentType: item.type,
        contentId: item.id,
        // Bù phần trôi để điểm hiển thị hôm nay khớp với băng điểm mong muốn.
        memoryScore: Math.min(99, score + Math.round(lastSeenDaysAgo * 0.45)),
        encounterCount,
        correctCount: Math.max(0, encounterCount - (wasWrongOnce ? 1 : 0)),
        wrongCount: wasWrongOnce ? 1 : 0,
        rescuedCount: 0,
        lastSeenAt: lastSeen.toISOString(),
        lastRecalledAt: lastSeen.toISOString(),
        nextReviewAt: addDays(now, Math.max(0, Math.round(score / 22 - variance * 2))).toISOString(),
        createdAt: addDays(now, -daysSinceLearned).toISOString(),
      };
    });
}
