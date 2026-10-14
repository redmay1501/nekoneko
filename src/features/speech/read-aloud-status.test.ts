import { describe, expect, it } from 'vitest';
import { FAILURE_MESSAGES, toReadAloudResult } from './read-aloud-status';

const FORMS = ['これは 本です。', 'これは ほんです。'];

describe('kết quả đọc theo mẫu', () => {
  it('chữ nhận diện khớp → matched; khác → different kèm phần khác', () => {
    expect(toReadAloudResult({ kind: 'transcript', transcript: 'これは本です' }, FORMS).status).toBe('matched');
    const different = toReadAloudResult({ kind: 'transcript', transcript: 'それは本です' }, FORMS);
    expect(different.status).toBe('different');
    expect(different.comparison?.segments.some((segment) => segment.kind !== 'same')).toBe(true);
  });

  it('thất bại giữ nguyên trạng thái và lý do; mọi lý do đều có lời giải thích', () => {
    expect(toReadAloudResult({ kind: 'failure', status: 'permission_denied', reason: 'not-allowed' }, FORMS))
      .toEqual({ status: 'permission_denied', transcript: null, comparison: null, reason: 'not-allowed' });
    for (const message of Object.values(FAILURE_MESSAGES)) expect(message.length).toBeGreaterThan(10);
  });
});
