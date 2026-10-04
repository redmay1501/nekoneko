/** Phần trăm làm tròn, an toàn khi mẫu số bằng 0. */
export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/** Lấy số bài Minna từ chuỗi kiểu "BÀI 10  ·  ..." hoặc "Bài 10". */
export function extractLessonNumber(label: string | null | undefined): number | null {
  const match = /B[ÀA]I\s*(\d+)/i.exec(label ?? '');
  return match ? Number(match[1]) : null;
}

/** Phần trước dấu phẩy đầu tiên — dùng để rút gọn nghĩa "Ngày, mặt trời" → "Ngày". */
export function firstMeaning(meaning: string): string {
  return meaning.split(',')[0].trim();
}

export function joinClassNames(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}
