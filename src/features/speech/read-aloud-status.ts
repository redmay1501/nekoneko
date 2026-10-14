import type { RecognitionFailureReason, RecognitionOutcome } from './recognition-session';
import { type TranscriptComparison, compareTranscript } from './transcript-compare';

/** Trạng thái hiển thị của một lượt đọc theo mẫu. */
export type ReadAloudStatus = 'matched' | 'different' | 'not_recognized' | 'unsupported' | 'permission_denied' | 'error';

export interface ReadAloudResult {
  status: ReadAloudStatus;
  transcript: string | null;
  comparison: TranscriptComparison | null;
  reason: RecognitionFailureReason | null;
}

/** Ghép kết quả nhận diện với câu mẫu (các dạng chấp nhận: câu có Kanji và cách đọc kana). */
export function toReadAloudResult(outcome: RecognitionOutcome, referenceForms: readonly string[]): ReadAloudResult {
  if (outcome.kind === 'failure') return { status: outcome.status, transcript: null, comparison: null, reason: outcome.reason };
  const comparison = compareTranscript(outcome.transcript, referenceForms);
  return { status: comparison.isMatch ? 'matched' : 'different', transcript: outcome.transcript, comparison, reason: null };
}

/** Lời giải thích cho người học theo lý do — nói điều đã biết, không đoán thêm. */
export const FAILURE_MESSAGES: Record<RecognitionFailureReason, string> = {
  'no-api': 'Trình duyệt này chưa có tính năng nhận diện giọng nói. Hãy dùng Chrome, Edge hoặc Safari bản mới — hoặc cứ nghe mẫu rồi đọc theo.',
  'language-not-supported': 'Trình duyệt này chưa nhận diện được tiếng Nhật. Bạn vẫn có thể nghe mẫu rồi đọc theo.',
  'not-allowed': 'Trình duyệt chưa cho dùng micro. Bấm biểu tượng ổ khoá / micro cạnh thanh địa chỉ → Cho phép, rồi thử lại.',
  'service-not-allowed': 'Trình duyệt đang chặn dịch vụ nhận diện giọng nói. Trên iPhone / iPad / Mac cần bật Siri; với trình duyệt khác, kiểm tra quyền micro.',
  'no-speech': 'Chưa nghe thấy tiếng nói. Nói to, rõ hơn và để micro gần miệng nhé.',
  timeout: 'Hết thời gian chờ mà chưa nhận ra câu nào. Bấm "Bắt đầu nói" rồi đọc ngay nhé.',
  empty: 'Trình duyệt chưa nhận ra câu nào. Thử đọc lại chậm và rõ hơn.',
  'audio-capture': 'Không mở được micro (không có micro hoặc ứng dụng khác đang dùng).',
  network: 'Cần kết nối mạng — trình duyệt này nhận diện giọng nói qua máy chủ trực tuyến.',
  aborted: 'Lượt nghe bị dừng giữa chừng. Thử lại nhé.',
  'start-failed': 'Chưa bắt đầu nghe được. Đợi một chút rồi thử lại.',
  unknown: 'Trình duyệt báo lỗi khi nhận diện. Thử lại nhé.',
};
