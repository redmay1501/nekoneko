import { describe, expect, it } from 'vitest';
import { buildKnowledgeCatalog } from '@/features/learning/knowledge-catalog';
import { type LearningDataSource, type PersistMemoryUpdateInput, StaleMemoryRecordError } from '@/lib/data/data-source';
import { loadSeedContent } from '@/lib/data/seed-content';
import { createInitialMemoryRecord } from './memory-engine';
import { recordMemoryEvent } from './memory-service';
import type { MemoryRecord } from './memory-types';

const catalog = buildKnowledgeCatalog(loadSeedContent());
const item = catalog.items.find((entry) => entry.type === 'hiragana')!;
const NOW = new Date('2026-10-05T08:00:00.000Z');

/** Nguồn dữ liệu giả: lần ghi đầu bị từ chối vì một request khác đã ghi trước (bản ghi đã có 1 lần gặp). */
function sourceWithConcurrentWrite(alreadyWritten: MemoryRecord) {
  const writes: PersistMemoryUpdateInput[] = [];
  const source = {
    applyMemoryUpdate: async (input: PersistMemoryUpdateInput) => {
      writes.push(input);
      if (writes.length === 1) throw new StaleMemoryRecordError();
      return { isDuplicate: false };
    },
    getMemoryRecord: async () => alreadyWritten,
  } as unknown as LearningDataSource;
  return { source, writes };
}

describe('recordMemoryEvent — ghi đồng thời không làm mất lần gặp', () => {
  it('bị từ chối vì xung đột → đọc lại, tính lại trên bản ghi mới nhất rồi ghi', async () => {
    const seeded = createInitialMemoryRecord(item.type, item.id, NOW);
    const writtenByOtherTab: MemoryRecord = { ...seeded, encounterCount: 1, lastSeenAt: NOW.toISOString() };
    const { source, writes } = sourceWithConcurrentWrite(writtenByOtherTab);

    await recordMemoryEvent({
      source, userId: 'u', item, existingRecord: seeded, eventType: 'discover', answer: 'acknowledged',
      isCorrect: null, requestId: 'session:0', now: NOW,
    });

    expect(writes).toHaveLength(2);
    expect(writes[0].expectedEncounterCount).toBe(0);
    // Lần thử lại tính trên bản ghi tab kia vừa ghi: 1 → 2, không đè thành 1.
    expect(writes[1].expectedEncounterCount).toBe(1);
    expect(writes[1].nextRecord.encounterCount).toBe(2);
  });

  it('xung đột mãi (rất hiếm) → báo lỗi sau vài lần, không lặp vô hạn', async () => {
    const seeded = createInitialMemoryRecord(item.type, item.id, NOW);
    const source = {
      applyMemoryUpdate: async () => { throw new StaleMemoryRecordError(); },
      getMemoryRecord: async () => seeded,
    } as unknown as LearningDataSource;
    await expect(recordMemoryEvent({
      source, userId: 'u', item, existingRecord: seeded, eventType: 'recall', answer: 'a', isCorrect: true, requestId: 'x', now: NOW,
    })).rejects.toBeInstanceOf(StaleMemoryRecordError);
  });
});
