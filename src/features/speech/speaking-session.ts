/** Điều hướng phiên luyện nói: mỗi lần một câu, chỉ đổi câu khi người học bấm (không tự chuyển). */
export interface SpeakingPosition {
  index: number;
  isFinished: boolean;
}

export const startPosition = (): SpeakingPosition => ({ index: 0, isFinished: false });

export function nextPosition(position: SpeakingPosition, total: number): SpeakingPosition {
  if (total === 0) return { index: 0, isFinished: true };
  return position.index + 1 >= total ? { index: position.index, isFinished: true } : { index: position.index + 1, isFinished: false };
}

export function previousPosition(position: SpeakingPosition): SpeakingPosition {
  if (position.isFinished) return { index: position.index, isFinished: false };
  return { index: Math.max(0, position.index - 1), isFinished: false };
}

/** Vị trí đọc từ URL (?cau=3 → câu thứ 3), kẹp trong số câu hiện có. */
export function positionFromParam(value: string | undefined, total: number): SpeakingPosition {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && total > 0 ? { index: Math.min(number, total) - 1, isFinished: false } : startPosition();
}
