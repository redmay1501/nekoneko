/**
 * Lựa chọn "ngẫu nhiên" nhưng TẤT ĐỊNH.
 *
 * Vì sao: Memory Engine và Session Engine phải cho cùng kết quả với cùng đầu vào
 * (để test được, để giải thích được, và để server/client không lệch nhau).
 * Vì vậy không dùng Math.random() trong logic nghiệp vụ — mọi lựa chọn đều đi qua
 * một "seed" dạng chuỗi.
 */

/** Băm chuỗi thành số thực trong [0, 1). Thuật toán FNV-1a 32-bit. */
export function hashToUnitInterval(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

/** Chọn tối đa `count` phần tử khác nhau từ `items`, thứ tự phụ thuộc `seed`. */
export function pickDeterministic<T>(items: readonly T[], count: number, seed: string): T[] {
  const remaining = [...items];
  const picked: T[] = [];
  let attempt = 0;
  while (picked.length < count && remaining.length > 0) {
    const index = Math.floor(hashToUnitInterval(`${seed}:${attempt}`) * remaining.length);
    picked.push(remaining.splice(index, 1)[0]);
    attempt++;
  }
  return picked;
}

/** Xáo trộn toàn bộ mảng theo `seed`. */
export function shuffleDeterministic<T>(items: readonly T[], seed: string): T[] {
  return items
    .map((item, index) => ({ item, weight: hashToUnitInterval(`${seed}:${index}`) }))
    .sort((left, right) => left.weight - right.weight)
    .map((entry) => entry.item);
}
