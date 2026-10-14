import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type RecognitionOutcome, type SpeechRecognitionLike, getSpeechRecognitionConstructor, startRecognitionSession } from './recognition-session';

/** SpeechRecognition giả: test điều khiển sự kiện như trình duyệt thật (result → end, error → end…). */
class FakeRecognition implements SpeechRecognitionLike {
  static last: FakeRecognition | null = null;
  static throwOnStart = false;
  lang = '';
  continuous = true;
  interimResults = false;
  maxAlternatives = 0;
  onresult: SpeechRecognitionLike['onresult'] = null;
  onerror: SpeechRecognitionLike['onerror'] = null;
  onend: SpeechRecognitionLike['onend'] = null;
  onnomatch: SpeechRecognitionLike['onnomatch'] = null;
  started = false;
  stopped = false;
  aborted = false;
  constructor() { FakeRecognition.last = this; }
  start() { if (FakeRecognition.throwOnStart) throw new Error('InvalidStateError'); this.started = true; }
  stop() { this.stopped = true; this.end(); }
  abort() { this.aborted = true; this.emitError('aborted'); this.end(); }
  emitResult(text: string, isFinal: boolean) {
    const result = Object.assign([{ transcript: text }], { isFinal });
    this.onresult?.({ resultIndex: 0, results: [result] });
  }
  emitError(error: string) { this.onerror?.({ error }); }
  end() { this.onend?.(); }
}

function run(timeoutMs = 5000) {
  const outcomes: RecognitionOutcome[] = [];
  const interims: string[] = [];
  const session = startRecognitionSession({ Recognition: FakeRecognition, timeoutMs, onOutcome: (outcome) => outcomes.push(outcome), onInterim: (text) => interims.push(text) });
  return { session, outcomes, interims, fake: FakeRecognition.last! };
}

describe('phiên nhận diện giọng nói (SpeechRecognition giả)', () => {
  beforeEach(() => { vi.useFakeTimers(); FakeRecognition.throwOnStart = false; });
  afterEach(() => { vi.useRealTimers(); });

  it('cấu hình ja-JP, một lượt, có kết quả tạm', () => {
    const { fake } = run();
    expect(fake).toMatchObject({ lang: 'ja-JP', continuous: false, interimResults: true, maxAlternatives: 1, started: true });
  });

  it('kết quả cuối → transcript (đúng một lần), kết quả tạm được báo', () => {
    const { fake, outcomes, interims } = run();
    fake.emitResult('わたしは', false);
    fake.emitResult('わたしは学生です', true);
    fake.end();
    fake.end();
    expect(interims).toEqual(['わたしは', 'わたしは学生です']);
    expect(outcomes).toEqual([{ kind: 'transcript', transcript: 'わたしは学生です' }]);
  });

  it('không có lời nói → not_recognized', () => {
    const { fake, outcomes } = run();
    fake.emitError('no-speech');
    fake.end();
    expect(outcomes).toEqual([{ kind: 'failure', status: 'not_recognized', reason: 'no-speech' }]);
  });

  it('kết thúc mà không có chữ nào → not_recognized (empty)', () => {
    const { fake, outcomes } = run();
    fake.end();
    expect(outcomes[0]).toMatchObject({ status: 'not_recognized', reason: 'empty' });
  });

  it('hết giờ → dừng nhận diện và báo not_recognized (timeout)', () => {
    const { fake, outcomes } = run(3000);
    vi.advanceTimersByTime(3000);
    expect(fake.stopped).toBe(true);
    expect(outcomes).toEqual([{ kind: 'failure', status: 'not_recognized', reason: 'timeout' }]);
  });

  it('từ chối quyền micro → permission_denied', () => {
    const { fake, outcomes } = run();
    fake.emitError('not-allowed');
    fake.end();
    expect(outcomes[0]).toMatchObject({ status: 'permission_denied', reason: 'not-allowed' });
  });

  it('không có micro / mất mạng → error với lý do', () => {
    const first = run();
    first.fake.emitError('audio-capture');
    first.fake.end();
    expect(first.outcomes[0]).toMatchObject({ status: 'error', reason: 'audio-capture' });
    const second = run();
    second.fake.emitError('network');
    second.fake.end();
    expect(second.outcomes[0]).toMatchObject({ status: 'error', reason: 'network' });
  });

  it('trình duyệt không hỗ trợ tiếng Nhật → unsupported', () => {
    const { fake, outcomes } = run();
    fake.emitError('language-not-supported');
    fake.end();
    expect(outcomes[0]).toMatchObject({ status: 'unsupported', reason: 'language-not-supported' });
  });

  it('không có API → unsupported ngay, không tạo gì', () => {
    const outcomes: RecognitionOutcome[] = [];
    startRecognitionSession({ Recognition: null, onOutcome: (outcome) => outcomes.push(outcome) });
    expect(outcomes).toEqual([{ kind: 'failure', status: 'unsupported', reason: 'no-api' }]);
    expect(getSpeechRecognitionConstructor({})).toBeNull();
    expect(getSpeechRecognitionConstructor({ webkitSpeechRecognition: FakeRecognition })).toBe(FakeRecognition);
  });

  it('start() lỗi → error (start-failed)', () => {
    FakeRecognition.throwOnStart = true;
    const { outcomes } = run();
    expect(outcomes[0]).toMatchObject({ status: 'error', reason: 'start-failed' });
  });

  it('huỷ (rời câu) → không báo kết quả nào', () => {
    const { fake, outcomes, session } = run();
    session.cancel();
    expect(fake.aborted).toBe(true);
    vi.advanceTimersByTime(10_000);
    expect(outcomes).toEqual([]);
  });

  it('người học bấm dừng sau khi nói → dùng kết quả cuối', () => {
    const { fake, outcomes, session } = run();
    fake.emitResult('これは本です', true);
    session.stop();
    expect(outcomes).toEqual([{ kind: 'transcript', transcript: 'これは本です' }]);
  });
});
