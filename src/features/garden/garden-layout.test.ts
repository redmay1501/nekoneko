import { describe, expect, it } from 'vitest';
import { GARDEN_LANDMARKS, GARDEN_RADIUS, MEADOW_OUTER_RADIUS, STAGE_OF_STATUS, gardenSlots, isMeadowPlantable, isPlantable, layoutGardenPlants } from './garden-layout';
import type { MemoryStatus } from '@/features/memory/memory-types';

const STATUSES: MemoryStatus[] = ['weak', 'learning', 'strong', 'mastered', 'fading'];
const plants = (count: number) => Array.from({ length: count }, (_, index) => ({ contentKey: `vocabulary-${index + 1}`, status: STATUSES[index % STATUSES.length] }));

describe('garden layout', () => {
  it('mỗi kiến thức một cây, giai đoạn đúng theo trạng thái ghi nhớ', () => {
    const layout = layoutGardenPlants(plants(25));
    expect(layout).toHaveLength(25);
    const byKey = new Map(plants(25).map((plant) => [plant.contentKey, plant.status]));
    for (const plant of layout) expect(plant.stage).toBe(STAGE_OF_STATUS[byKey.get(plant.contentKey)!]);
    expect(STAGE_OF_STATUS).toMatchObject({ weak: 'sprout', learning: 'sapling', strong: 'tree', mastered: 'blossom', fading: 'wilting' });
  });

  it('vườn trống thì không có cây (không thêm cây giả)', () => {
    expect(layoutGardenPlants([])).toEqual([]);
  });

  it('đủ chỗ cho một khu 60 cây, không đè nhau, không đè lối đá / hồ / cây lớn', () => {
    const slots = gardenSlots(60);
    expect(slots).toHaveLength(60);
    for (const slot of slots) {
      expect(isPlantable(slot.x, slot.z)).toBe(true);
      expect(Math.hypot(slot.x, slot.z)).toBeLessThanOrEqual(GARDEN_RADIUS);
    }
    for (let a = 0; a < slots.length; a += 1) for (let b = a + 1; b < slots.length; b += 1) {
      expect(Math.hypot(slots[a].x - slots[b].x, slots[a].z - slots[b].z)).toBeGreaterThanOrEqual(1.25);
    }
  });

  it('mọi kiến thức N5 cùng hiện trong một cảnh: hết chỗ trong vườn thì ra đồng cỏ — không cây nào bị bỏ', () => {
    const all = plants(1650);
    const layout = layoutGardenPlants(all);
    expect(layout).toHaveLength(1650);
    expect(new Set(layout.map((plant) => plant.contentKey)).size).toBe(1650);
    const inside = layout.filter((plant) => Math.hypot(plant.x, plant.z) <= GARDEN_RADIUS);
    expect(inside.length).toBeGreaterThan(100);
    for (const plant of layout.filter((entry) => Math.hypot(entry.x, entry.z) > GARDEN_RADIUS)) {
      expect(isMeadowPlantable(plant.x, plant.z)).toBe(true);
      expect(Math.max(Math.abs(plant.x), Math.abs(plant.z))).toBeLessThan(45); // trong mặt đất 90 × 90
    }
  });

  it('đồng cỏ: không trồng chắn trước camera, trên suối, nhà gỗ hay hồ lớn; không cây nào đè nhau', () => {
    const slots = gardenSlots(1650);
    const { house, lake } = GARDEN_LANDMARKS;
    for (const slot of slots.filter((entry) => Math.hypot(entry.x, entry.z) > GARDEN_RADIUS)) {
      expect(Math.hypot(slot.x, slot.z)).toBeLessThanOrEqual(MEADOW_OUTER_RADIUS + 0.5);
      if (slot.z > 3) expect(Math.abs(slot.x)).toBeGreaterThan(17); // giữa phía trước để trống
      expect(Math.hypot(slot.x - house.x, slot.z - house.z)).toBeGreaterThanOrEqual(house.clearance);
      expect(((slot.x - lake.x) / lake.radiusX) ** 2 + ((slot.z - lake.z) / lake.radiusZ) ** 2).toBeGreaterThanOrEqual(1);
    }
    const sorted = [...slots].sort((a, b) => a.x - b.x);
    for (let a = 0; a < sorted.length; a += 1) for (let b = a + 1; b < sorted.length && sorted[b].x - sorted[a].x < 0.95; b += 1) {
      expect(Math.hypot(sorted[a].x - sorted[b].x, sorted[a].z - sorted[b].z)).toBeGreaterThanOrEqual(0.94);
    }
  });

  it('cây vững vẫn ở trong vườn; mầm mới / sắp quên ra đồng cỏ khi vườn đầy', () => {
    const layout = layoutGardenPlants([...plants(400)]);
    const byKey = new Map(plants(400).map((plant) => [plant.contentKey, plant.status]));
    const radiusOf = (status: MemoryStatus) => layout.filter((plant) => byKey.get(plant.contentKey) === status).map((plant) => Math.hypot(plant.x, plant.z));
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(average(radiusOf('mastered'))).toBeLessThan(average(radiusOf('weak')));
  });

  it('cây vững nằm gần tâm hơn mầm mới; bố cục ổn định giữa các lần mở', () => {
    const layout = layoutGardenPlants(plants(30));
    const radius = (stage: string) => {
      const list = layout.filter((plant) => plant.stage === stage).map((plant) => Math.hypot(plant.x, plant.z));
      return list.reduce((sum, value) => sum + value, 0) / list.length;
    };
    expect(radius('blossom')).toBeLessThan(radius('sprout'));
    expect(layoutGardenPlants([...plants(30)].reverse())).toEqual(layout);
  });

  it('không trồng trên lối đá, trong hồ, trên bờ suối hay sát gốc cây lớn', () => {
    expect(isPlantable(2.6, 10.2)).toBe(false);
    expect(isPlantable(-6.2, 2.6)).toBe(false);
    expect(isPlantable(0.4, -2.2)).toBe(false);
    expect(isPlantable(20, 0)).toBe(false);
    expect(isPlantable(-11.4, -4.6)).toBe(false); // giữa dòng suối
    expect(isPlantable(-8.4, -2.6)).toBe(false);
    expect(isPlantable(5.2, -4.2)).toBe(false); // biển Ngữ pháp
    expect(isPlantable(8.8, -1.6)).toBe(false); // biển Kanji
  });
});
