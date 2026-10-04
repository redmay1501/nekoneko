/** "2026-09-11" → "11/09/2026" (định dạng ngày Việt Nam). */
export function formatVietnameseDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
