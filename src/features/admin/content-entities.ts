import { z } from 'zod';

/**
 * Bốn loại nội dung admin sửa được trực tiếp trong database (bảng có sẵn, không đổi cấu trúc).
 * Bài đọc và video đọc từ tệp trong repo → chỉ xem ở admin (xem trang tương ứng).
 * File thuần — dùng chung cho server (kiểm tra dữ liệu) và trình duyệt (vẽ form).
 */
export const ADMIN_ENTITIES = ['vocabulary', 'kanji', 'radical', 'grammar'] as const;
export type AdminEntity = (typeof ADMIN_ENTITIES)[number];

export const CONTENT_STATUSES = ['draft', 'review', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Nháp', review: 'Chờ duyệt', published: 'Đã xuất bản', archived: 'Lưu trữ',
};
/** Trạng thái người học KHÔNG thấy. */
export const HIDDEN_FROM_LEARNERS: readonly ContentStatus[] = ['draft', 'review', 'archived'];

export type FieldKind = 'text' | 'textarea' | 'number' | 'day';
export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Chữ Nhật → font tiếng Nhật trong form. */
  isJapanese?: boolean;
  max?: number;
  min?: number;
  help?: string;
}

export type AdminRow = Record<string, string | number | null> & { id: number };

export interface EntityConfig {
  entity: AdminEntity;
  table: string;
  /** Đường dẫn trong /admin. */
  slug: string;
  label: string;
  singular: string;
  fields: FieldDef[];
  /** Cột dùng để tìm kiếm. */
  searchFields: string[];
  /** Cột có "Bài" (lọc theo bài Minna) — kanji / bộ thủ không có. */
  hasLesson: boolean;
  /** Khoá dùng để phát hiện trùng khi thêm mới. */
  duplicateKey: (row: Partial<AdminRow>) => string;
  title: (row: AdminRow) => string;
  subtitle: (row: AdminRow) => string;
}

const day: FieldDef = { name: 'day', label: 'Ngày trong lộ trình', kind: 'day', help: '1–90. Để trống = chưa gắn vào ngày nào.' };
const tip: FieldDef = { name: 'tip', label: 'Mẹo nhớ', kind: 'textarea', max: 1000 };
const lesson: FieldDef = { name: 'lesson', label: 'Bài', kind: 'text', max: 80, help: 'Giữ định dạng đang dùng: Bài 3 · Chủ đề' };
const text = (value: unknown) => String(value ?? '').trim();

export const ENTITY_CONFIG: Record<AdminEntity, EntityConfig> = {
  vocabulary: {
    entity: 'vocabulary', table: 'vocabulary', slug: 'tu-vung', label: 'Từ vựng', singular: 'từ',
    fields: [
      { name: 'kana', label: 'Cách đọc (kana)', kind: 'text', required: true, isJapanese: true, max: 60 },
      { name: 'kanji', label: 'Chữ Kanji', kind: 'text', isJapanese: true, max: 60, help: 'Để trống nếu từ chỉ viết bằng kana.' },
      { name: 'meaning', label: 'Nghĩa tiếng Việt', kind: 'text', required: true, max: 200 },
      lesson, day, tip,
    ],
    searchFields: ['kana', 'kanji', 'meaning'], hasLesson: true,
    // Đồng âm khác nghĩa (かけます: gọi điện / đeo kính) không phải trùng.
    duplicateKey: (row) => `${text(row.kana)}|${text(row.kanji)}|${foldSearch(text(row.meaning))}`,
    title: (row) => text(row.kanji) || text(row.kana),
    subtitle: (row) => `${text(row.kanji) ? `${text(row.kana)} · ` : ''}${text(row.meaning)}`,
  },
  kanji: {
    entity: 'kanji', table: 'kanji', slug: 'kanji', label: 'Kanji', singular: 'chữ',
    fields: [
      { name: 'character', label: 'Chữ', kind: 'text', required: true, isJapanese: true, max: 4 },
      { name: 'han_viet', label: 'Âm Hán Việt', kind: 'text', max: 60 },
      { name: 'meaning', label: 'Nghĩa', kind: 'text', required: true, max: 200 },
      { name: 'on_reading', label: 'Âm On', kind: 'text', isJapanese: true, max: 120 },
      { name: 'kun_reading', label: 'Âm Kun', kind: 'text', isJapanese: true, max: 120 },
      { name: 'strokes', label: 'Số nét', kind: 'number', min: 1, max: 40 },
      { name: 'words', label: 'Từ ghép', kind: 'textarea', isJapanese: true, max: 1000, help: 'Giữ đúng định dạng đang dùng, ví dụ: 日本（にほん）Nhật Bản; …' },
      day, tip,
    ],
    searchFields: ['character', 'han_viet', 'meaning', 'on_reading', 'kun_reading'], hasLesson: false,
    duplicateKey: (row) => text(row.character),
    title: (row) => text(row.character),
    subtitle: (row) => [text(row.han_viet), text(row.meaning)].filter(Boolean).join(' · '),
  },
  radical: {
    entity: 'radical', table: 'radicals', slug: 'bo-thu', label: 'Bộ thủ', singular: 'bộ',
    fields: [
      { name: 'radical', label: 'Bộ thủ', kind: 'text', required: true, isJapanese: true, max: 20 },
      { name: 'name_jp', label: 'Tên tiếng Nhật', kind: 'text', isJapanese: true, max: 80 },
      { name: 'meaning', label: 'Nghĩa', kind: 'text', required: true, max: 200 },
      { name: 'kanji_list', label: 'Kanji có bộ này', kind: 'text', isJapanese: true, max: 300 },
      day, tip,
    ],
    searchFields: ['radical', 'name_jp', 'meaning'], hasLesson: false,
    duplicateKey: (row) => text(row.radical),
    title: (row) => text(row.radical),
    subtitle: (row) => [text(row.name_jp), text(row.meaning)].filter(Boolean).join(' · '),
  },
  grammar: {
    entity: 'grammar', table: 'grammar', slug: 'ngu-phap', label: 'Ngữ pháp', singular: 'mẫu',
    fields: [
      { name: 'pattern', label: 'Mẫu câu', kind: 'text', required: true, isJapanese: true, max: 120 },
      { name: 'usage', label: 'Ý nghĩa / cách dùng', kind: 'textarea', required: true, max: 1000 },
      { name: 'when_to_use', label: 'Khi nào dùng', kind: 'textarea', max: 1000 },
      { name: 'example_jp', label: 'Ví dụ 1 (tiếng Nhật)', kind: 'text', isJapanese: true, max: 300 },
      { name: 'example_reading', label: 'Ví dụ 1 — cách đọc', kind: 'text', isJapanese: true, max: 300 },
      { name: 'example_vi', label: 'Ví dụ 1 — nghĩa', kind: 'text', max: 300 },
      { name: 'example2_jp', label: 'Ví dụ 2 (tiếng Nhật)', kind: 'text', isJapanese: true, max: 300 },
      { name: 'example2_reading', label: 'Ví dụ 2 — cách đọc', kind: 'text', isJapanese: true, max: 300 },
      { name: 'example2_vi', label: 'Ví dụ 2 — nghĩa', kind: 'text', max: 300 },
      { name: 'common_mistake', label: 'Lỗi thường gặp', kind: 'textarea', max: 1000 },
      lesson, day,
    ],
    searchFields: ['pattern', 'usage', 'example_jp', 'example_vi'], hasLesson: true,
    duplicateKey: (row) => text(row.pattern),
    title: (row) => text(row.pattern),
    subtitle: (row) => text(row.usage).slice(0, 90),
  },
};

export const ENTITY_BY_SLUG: Record<string, AdminEntity> = Object.fromEntries(
  ADMIN_ENTITIES.map((entity) => [ENTITY_CONFIG[entity].slug, entity]),
);

export function isAdminEntity(value: string): value is AdminEntity {
  return (ADMIN_ENTITIES as readonly string[]).includes(value);
}

function fieldSchema(field: FieldDef): z.ZodTypeAny {
  if (field.kind === 'day') return z.number().int().min(1, 'Ngày từ 1 đến 90').max(90, 'Ngày từ 1 đến 90').nullable();
  if (field.kind === 'number') {
    const number = z.number().int().min(field.min ?? 0, `Tối thiểu ${field.min ?? 0}`).max(field.max ?? 9999, `Tối đa ${field.max ?? 9999}`);
    return field.required ? number : number.nullable();
  }
  const base = z.string().trim().max(field.max ?? 500, `Tối đa ${field.max ?? 500} ký tự`);
  return field.required ? base.min(1, 'Bắt buộc') : base;
}

/** Schema kiểm tra dữ liệu gửi lên — chỉ nhận đúng các cột của loại nội dung (không cho ghi id, cột lạ). */
export function entityInputSchema(entity: AdminEntity) {
  const shape = Object.fromEntries(ENTITY_CONFIG[entity].fields.map((field) => [field.name, fieldSchema(field)]));
  return z.object(shape).strict();
}

export type FieldErrors = Record<string, string>;

/** Kiểm tra và trả lỗi theo từng ô — dùng chung ở form (trình duyệt) và API (server). */
export function validateEntityInput(entity: AdminEntity, input: unknown):
  | { ok: true; value: Record<string, string | number | null> }
  | { ok: false; errors: FieldErrors } {
  const parsed = entityInputSchema(entity).safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data as Record<string, string | number | null> };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const name = String(issue.path[0] ?? '_');
    if (!errors[name]) errors[name] = issue.code === 'unrecognized_keys' ? 'Có trường không hợp lệ' : issue.message;
  }
  return { ok: false, errors };
}

/** Giá trị form (chuỗi) → dữ liệu đúng kiểu cho API. Ô số để trống → null. */
export function formValuesToInput(entity: AdminEntity, values: Record<string, string>): Record<string, string | number | null> {
  return Object.fromEntries(ENTITY_CONFIG[entity].fields.map((field) => {
    const raw = (values[field.name] ?? '').trim();
    if (field.kind === 'day' || field.kind === 'number') return [field.name, raw === '' ? null : Number(raw)];
    return [field.name, raw];
  }));
}

export function rowToFormValues(entity: AdminEntity, row: Partial<AdminRow> | null): Record<string, string> {
  return Object.fromEntries(ENTITY_CONFIG[entity].fields.map((field) => [field.name, row?.[field.name] == null ? '' : String(row[field.name])]));
}

export interface ListFilters {
  q?: string;
  day?: number | null;
  lesson?: string;
  status?: ContentStatus | 'all';
  image?: 'with' | 'without' | 'all';
  page?: number;
  pageSize?: number;
}

export interface ListableRow {
  row: AdminRow;
  status: ContentStatus;
  hasImage: boolean;
}

/** Bỏ dấu tiếng Việt + chữ thường để tìm "meo" ra "mèo". */
export function foldSearch(value: string): string {
  return value.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

/** Lọc + phân trang thuần (danh sách ≤ vài nghìn dòng, làm trong bộ nhớ ở server). */
export function filterRows<T extends ListableRow>(entity: AdminEntity, rows: readonly T[], filters: ListFilters) {
  const config = ENTITY_CONFIG[entity];
  const query = foldSearch(filters.q ?? '');
  const matches = rows.filter(({ row, status, hasImage }) => {
    if (query && !(String(row.id) === query || config.searchFields.some((field) => foldSearch(String(row[field] ?? '')).includes(query)))) return false;
    if (filters.day != null && row.day !== filters.day) return false;
    if (filters.day === null && row.day !== null) return false;
    if (filters.lesson && config.hasLesson && String(row.lesson ?? '').split('·')[0].trim() !== filters.lesson) return false;
    if (filters.status && filters.status !== 'all' && status !== filters.status) return false;
    if (filters.image === 'with' && !hasImage) return false;
    if (filters.image === 'without' && hasImage) return false;
    return true;
  });
  const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 5), 100);
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(Math.max(filters.page ?? 1, 1), pageCount);
  return { items: matches.slice((page - 1) * pageSize, page * pageSize), total: matches.length, page, pageCount, pageSize };
}

/** Các bài có trong dữ liệu ("Bài 1", "Bài 2"…) — cho ô lọc. */
export function lessonOptions(rows: readonly AdminRow[]): string[] {
  const lessons = new Set(rows.map((row) => String(row.lesson ?? '').split('·')[0].trim()).filter(Boolean));
  const number = (value: string) => Number(/\d+/.exec(value)?.[0] ?? 9999);
  return [...lessons].sort((left, right) => number(left) - number(right) || left.localeCompare(right));
}

/** Đổi trạng thái: mục đã có người học có thẻ nhớ thì không được ẩn (người học sẽ mất thẻ khỏi màn hình). */
export function canChangeStatus(target: ContentStatus, learnerMemoryCount: number): { ok: true } | { ok: false; reason: string } {
  if (HIDDEN_FROM_LEARNERS.includes(target) && learnerMemoryCount > 0) {
    return { ok: false, reason: `${learnerMemoryCount} thẻ nhớ của người học đang dùng mục này — không thể ẩn. Hãy sửa nội dung thay vì ẩn.` };
  }
  return { ok: true };
}

export function canDeleteContent(learnerMemoryCount: number): { ok: true } | { ok: false; reason: string } {
  if (learnerMemoryCount > 0) {
    return { ok: false, reason: `${learnerMemoryCount} thẻ nhớ của người học đang dùng mục này — không thể xoá (sẽ làm mất tiến độ). Hãy sửa nội dung thay vì xoá.` };
  }
  return { ok: true };
}
