import { describe, expect, it } from 'vitest';
import { nextPosition, positionFromParam, previousPosition, startPosition } from './speaking-session';

describe('điều hướng luyện nói từng câu', () => {
  it('tiến từng câu, tới câu cuối thì kết thúc (không vượt quá)', () => {
    let position = startPosition();
    position = nextPosition(position, 3);
    expect(position).toEqual({ index: 1, isFinished: false });
    position = nextPosition(nextPosition(position, 3), 3);
    expect(position).toEqual({ index: 2, isFinished: true });
  });

  it('lùi về câu trước; từ màn kết thúc lùi về câu cuối; không lùi quá câu đầu', () => {
    expect(previousPosition({ index: 2, isFinished: true })).toEqual({ index: 2, isFinished: false });
    expect(previousPosition({ index: 1, isFinished: false })).toEqual({ index: 0, isFinished: false });
    expect(previousPosition({ index: 0, isFinished: false })).toEqual({ index: 0, isFinished: false });
  });

  it('không có câu → kết thúc ngay; vị trí từ URL được kẹp', () => {
    expect(nextPosition(startPosition(), 0).isFinished).toBe(true);
    expect(positionFromParam('3', 5)).toEqual({ index: 2, isFinished: false });
    expect(positionFromParam('99', 5)).toEqual({ index: 4, isFinished: false });
    expect(positionFromParam('abc', 5)).toEqual({ index: 0, isFinished: false });
  });
});
