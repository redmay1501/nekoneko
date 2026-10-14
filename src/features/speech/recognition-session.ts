/**
 * Một lượt nhận diện giọng nói bằng Web Speech API của TRÌNH DUYỆT (SpeechRecognition / webkitSpeechRecognition, ja-JP).
 * Không dùng dịch vụ trả phí, không gửi âm thanh lên máy chủ NekoNeko. Lưu ý: tuỳ trình duyệt, bộ nhận diện có thể chạy
 * trên máy chủ của hãng (Chrome gửi âm thanh lên dịch vụ của Google — MDN), xem docs/SPEECH_RECOGNITION.md.
 *
 * Tách khỏi React để test bằng lớp giả: nhận constructor, trả về kết quả cuối qua onOutcome đúng MỘT lần.
 */

export type RecognitionFailure = 'not_recognized' | 'unsupported' | 'permission_denied' | 'error';

export type RecognitionOutcome =
  | { kind: 'transcript'; transcript: string }
  | { kind: 'failure'; status: RecognitionFailure; reason: RecognitionFailureReason };

export type RecognitionFailureReason =
  | 'no-api' | 'language-not-supported' | 'not-allowed' | 'service-not-allowed' | 'no-speech' | 'timeout' | 'empty'
  | 'audio-capture' | 'network' | 'aborted' | 'start-failed' | 'unknown';

/** Phần tối thiểu của SpeechRecognition mà phiên cần (kiểu DOM chưa có trong lib của TypeScript). */
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onnomatch?: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionConstructor(scope: unknown = typeof window === 'undefined' ? undefined : window): SpeechRecognitionConstructor | null {
  const host = scope as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor } | undefined;
  return host?.SpeechRecognition ?? host?.webkitSpeechRecognition ?? null;
}

const ERROR_STATUS: Record<string, { status: RecognitionFailure; reason: RecognitionFailureReason }> = {
  'not-allowed': { status: 'permission_denied', reason: 'not-allowed' },
  'service-not-allowed': { status: 'permission_denied', reason: 'service-not-allowed' },
  'language-not-supported': { status: 'unsupported', reason: 'language-not-supported' },
  'no-speech': { status: 'not_recognized', reason: 'no-speech' },
  'audio-capture': { status: 'error', reason: 'audio-capture' },
  network: { status: 'error', reason: 'network' },
  aborted: { status: 'error', reason: 'aborted' },
};

export interface RecognitionSessionOptions {
  Recognition: SpeechRecognitionConstructor | null;
  lang?: string;
  /** Không có kết quả cuối sau chừng này ms → dừng và báo "không nhận ra" (lý do timeout). */
  timeoutMs?: number;
  onInterim?: (text: string) => void;
  onOutcome: (outcome: RecognitionOutcome) => void;
}

export interface RecognitionSession {
  stop(): void;
  /** Huỷ không báo kết quả (rời trang / chuyển câu). */
  cancel(): void;
}

export const DEFAULT_TIMEOUT_MS = 12_000;

export function startRecognitionSession(options: RecognitionSessionOptions): RecognitionSession {
  const { Recognition, lang = 'ja-JP', timeoutMs = DEFAULT_TIMEOUT_MS, onInterim, onOutcome } = options;
  let isSettled = false;
  // Hẹn giờ tạo sau, nhưng settle() có thể chạy trước (không có API) → giữ trong một ô để luôn đọc được.
  const timer: { id?: ReturnType<typeof setTimeout> } = {};
  const settle = (outcome: RecognitionOutcome) => {
    if (isSettled) return;
    isSettled = true;
    clearTimeout(timer.id);
    onOutcome(outcome);
  };
  const fail = (status: RecognitionFailure, reason: RecognitionFailureReason) => settle({ kind: 'failure', status, reason });

  if (!Recognition) {
    fail('unsupported', 'no-api');
    return { stop: () => undefined, cancel: () => undefined };
  }

  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalText = '';
  let pendingFailure: { status: RecognitionFailure; reason: RecognitionFailureReason } | null = null;
  let timedOut = false;

  recognition.onresult = (event) => {
    let interim = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0]?.transcript ?? '';
      if (result.isFinal) finalText += text;
      else interim += text;
    }
    onInterim?.(finalText + interim);
  };
  recognition.onerror = (event) => {
    pendingFailure = ERROR_STATUS[event.error] ?? { status: 'error', reason: 'unknown' };
  };
  recognition.onnomatch = () => {
    pendingFailure ??= { status: 'not_recognized', reason: 'empty' };
  };
  recognition.onend = () => {
    if (finalText.trim()) settle({ kind: 'transcript', transcript: finalText.trim() });
    else if (pendingFailure && !(timedOut && pendingFailure.reason === 'aborted')) fail(pendingFailure.status, pendingFailure.reason);
    else fail('not_recognized', timedOut ? 'timeout' : 'empty');
  };

  timer.id = setTimeout(() => {
    timedOut = true;
    try { recognition.stop(); } catch { /* đã dừng */ }
  }, timeoutMs);

  try {
    recognition.start();
  } catch {
    fail('error', 'start-failed');
  }

  return {
    stop: () => { try { recognition.stop(); } catch { /* đã dừng */ } },
    cancel: () => {
      isSettled = true;
      clearTimeout(timer.id);
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* đã dừng */ }
    },
  };
}
