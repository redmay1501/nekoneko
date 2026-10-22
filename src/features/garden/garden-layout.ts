import type { MemoryStatus } from '@/features/memory/memory-types';

/**
 * Bố cục Vườn tri thức 3D — thuần dữ liệu (không phụ thuộc three.js) để test được.
 * Đơn vị: mét của cảnh 3D; trục Y hướng lên, mặt đất là y = 0, camera mặc định nhìn từ phía +Z.
 */

/** Hình dạng cây theo trạng thái ghi nhớ — giữ đúng nghĩa chú giải của vườn (memory-rules → GARDEN_STAGES). */
export type PlantStage = 'sprout' | 'sapling' | 'tree' | 'blossom' | 'wilting';

export const STAGE_OF_STATUS: Record<MemoryStatus, PlantStage> = {
  new: 'sprout',
  weak: 'sprout', // Mới học → mầm
  learning: 'sapling', // Đang hình thành → cây non đang lớn
  strong: 'tree', // Đã nhớ tốt → cây khoẻ
  mastered: 'blossom', // Đã thành thạo → cây trưởng thành, nở hoa
  fading: 'wilting', // Sắp quên → lá ngả vàng (cần tưới)
};

/** Cây gần tâm vườn hơn khi trí nhớ vững hơn — vườn "kể" được trạng thái chỉ bằng vị trí. */
const STATUS_ORDER: readonly MemoryStatus[] = ['mastered', 'strong', 'learning', 'fading', 'weak', 'new'];

/** Cây lớn trung tâm, xích đu, hồ và lối đá — không trồng cây kiến thức đè lên. */
export const GARDEN_LANDMARKS = {
  bigTree: { x: -0.9, z: -2.2, radius: 1.0 },
  swing: { x: 1.7, z: -2.2 },
  pond: { x: -6.2, z: 2.6, radiusX: 2.3, radiusZ: 1.6 },
  lanterns: [{ x: -2.9, z: 3.4 }, { x: 5.4, z: 2.4 }],
  /**
   * Suối: chảy ra từ dưới dải bụi bìa rừng phía sau bên trái, uốn xuống đổ vào hồ, rồi chảy tiếp ra mép trước bên trái vườn.
   * Điểm theo thứ tự dòng chảy (thượng nguồn → hạ nguồn).
   */
  stream: [
    { x: -21.5, z: -18.5 }, { x: -18.8, z: -14.6 }, { x: -16.5, z: -11.5 }, { x: -13.2, z: -8.6 }, { x: -11.4, z: -4.6 }, { x: -8.4, z: -2.6 }, { x: -7.0, z: 0.8 },
    { x: -6.2, z: 2.6 }, { x: -7.6, z: 5.6 }, { x: -9.8, z: 8.4 }, { x: -9.4, z: 12.0 }, { x: -11.5, z: 16.5 },
  ],
  /**
   * Biển gỗ các nhóm kiến thức (theo bố cục concept): Từ vựng bên trái gần suối, Kana trước-trái cây đào,
   * Ngữ pháp bên phải cây đào, Kanji phía phải (gần cổng torii), Bộ thủ trước-phải (khu cây non).
   */
  signs: {
    vocabulary: { x: -5.2, z: -5.6 },
    kana: { x: -3.4, z: 4.6 },
    grammar: { x: 5.2, z: -4.2 },
    kanji: { x: 8.8, z: -1.6 },
    radical: { x: 5.6, z: 5.2 },
  },
  /** Cổng torii đỏ cạnh biển Kanji. */
  torii: { x: 10.8, z: -4.8 },
  /** Lối đá: từ mép trước vườn uốn vào trước xích đu. */
  path: [
    { x: 1.4, z: 13.5 }, { x: 2.6, z: 10.2 }, { x: 1.2, z: 7.2 }, { x: -0.6, z: 4.6 }, { x: 0.4, z: 2.2 }, { x: 1.6, z: 0.6 },
  ],
} as const;

export const GARDEN_RADIUS = 13.5;
/** Một khu vực 3D giữ số mesh vừa phải; người học có thể chuyển qua mọi khu theo chỉ số. */
export const GARDEN_AREA_SIZE = 60;

export function gardenAreaCount(totalPlants: number): number {
  return Math.max(1, Math.ceil(Math.max(0, totalPlants) / GARDEN_AREA_SIZE));
}

export function plantsInGardenArea<T>(plants: readonly T[], areaIndex: number): T[] {
  const safeIndex = Math.max(0, Math.floor(areaIndex));
  return plants.slice(safeIndex * GARDEN_AREA_SIZE, (safeIndex + 1) * GARDEN_AREA_SIZE);
}
/** Khoảng trống quanh gốc cây đào lớn (rễ nổi) + xích đu (người ngồi, dây treo) — giữ thoáng cho điểm nhấn. */
const CENTER_CLEARANCE = 4.9;
/** Quanh biển nhóm kiến thức / cổng torii — giữ thoáng để biển luôn đọc được. */
const SIGN_CLEARANCE = 1.9;
/** Hai bờ suối (đá cuội, cỏ) — không trồng cây kiến thức sát mép nước. */
const STREAM_CLEARANCE = 1.95;
const PATH_CLEARANCE = 1.05;
const MIN_SPACING = 1.25;

export interface PlantInput {
  contentKey: string;
  status: MemoryStatus;
}

export interface PlantPlacement {
  contentKey: string;
  stage: PlantStage;
  x: number;
  z: number;
  /** Góc xoay quanh trục đứng (radian) và hệ số cỡ — cố định theo contentKey để vườn không "nhảy" giữa các lần mở. */
  rotation: number;
  scale: number;
}

/** Băm chuỗi → số thực [0, 1) ổn định (FNV-1a). */
export function hashUnit(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  // Trộn bit cuối (fmix32 của MurmurHash3): chuỗi gần giống nhau ("a:1", "a:2"…) không cho ra số gần nhau → không xếp thành hàng.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0x100000000;
}

function distanceToSegment(px: number, pz: number, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (a.x + t * dx), pz - (a.z + t * dz));
}

/** Ô đất trồng được: trong vườn, ngoài vùng cây lớn / xích đu, lối đá, hồ và đèn đá. */
export function isPlantable(x: number, z: number): boolean {
  if (Math.hypot(x, z) > GARDEN_RADIUS) return false;
  const { bigTree, swing, pond, lanterns, path } = GARDEN_LANDMARKS;
  const centerX = (bigTree.x + swing.x) / 2;
  const centerZ = (bigTree.z + swing.z) / 2;
  if (Math.hypot((x - centerX) / 1.25, z - centerZ) < CENTER_CLEARANCE) return false;
  if (((x - pond.x) / (pond.radiusX + 0.9)) ** 2 + ((z - pond.z) / (pond.radiusZ + 0.9)) ** 2 < 1) return false;
  if (lanterns.some((lantern) => Math.hypot(x - lantern.x, z - lantern.z) < 1.1)) return false;
  for (let index = 1; index < path.length; index += 1) {
    if (distanceToSegment(x, z, path[index - 1], path[index]) < PATH_CLEARANCE) return false;
  }
  const { stream, signs, torii } = GARDEN_LANDMARKS;
  for (const sign of Object.values(signs)) if (Math.hypot(x - sign.x, z - sign.z) < SIGN_CLEARANCE) return false;
  if (Math.hypot(x - torii.x, z - torii.z) < 2.2) return false;
  for (let index = 1; index < stream.length; index += 1) {
    if (distanceToSegment(x, z, stream[index - 1], stream[index]) < STREAM_CLEARANCE) return false;
  }
  return true;
}

/** Ô trồng xếp theo xoắn ốc vàng từ trong ra ngoài, chỉ giữ ô hợp lệ và đủ cách nhau. */
export function gardenSlots(maxSlots: number): Array<{ x: number; z: number }> {
  const slots: Array<{ x: number; z: number }> = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < 4000 && slots.length < maxSlots; index += 1) {
    const radius = 3.6 + Math.sqrt(index) * 0.44;
    if (radius > GARDEN_RADIUS) break;
    const angle = index * goldenAngle;
    // Lệch nhẹ có kiểm soát → cây không xếp thành vòng / hàng đều tăm tắp.
    const jitterX = (hashUnit(`slot:x:${index}`) - 0.5) * 0.7;
    const jitterZ = (hashUnit(`slot:z:${index}`) - 0.5) * 0.7;
    const x = Math.round((Math.cos(angle) * radius + jitterX) * 100) / 100;
    const z = Math.round((Math.sin(angle) * radius + jitterZ) * 100) / 100;
    if (!isPlantable(x, z)) continue;
    if (slots.some((slot) => Math.hypot(slot.x - x, slot.z - z) < MIN_SPACING)) continue;
    slots.push({ x, z });
  }
  return slots;
}

/**
 * Đặt mỗi kiến thức một cây. Cây vững nhất gần cây lớn trung tâm, mầm mới ở rìa vườn.
 * Số cây = số kiến thức truyền vào (tối đa số ô trồng được) — không thêm cây giả.
 */
export function layoutGardenPlants(plants: readonly PlantInput[]): PlantPlacement[] {
  const ordered = [...plants].sort((left, right) => STATUS_ORDER.indexOf(left.status) - STATUS_ORDER.indexOf(right.status)
    || left.contentKey.localeCompare(right.contentKey));
  const slots = gardenSlots(ordered.length);
  return ordered.slice(0, slots.length).map((plant, index) => ({
    contentKey: plant.contentKey,
    stage: STAGE_OF_STATUS[plant.status],
    x: slots[index].x,
    z: slots[index].z,
    rotation: hashUnit(`${plant.contentKey}:r`) * Math.PI * 2,
    scale: 0.88 + hashUnit(`${plant.contentKey}:s`) * 0.24,
  }));
}
