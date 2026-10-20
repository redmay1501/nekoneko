import { describe, expect, it } from 'vitest';
import { GARDEN_RADIUS, STAGE_OF_STATUS, gardenSlots, isPlantable, layoutGardenPlants } from './garden-layout';
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

  it('đủ chỗ cho 60 cây (số cây tối đa trang Vườn hiển thị), không đè nhau, không đè lối đá / hồ / cây lớn', () => {
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
  });
});
