/**
 * Giao tiếp trang ↔ Web Worker nhận diện giọng nói trên thiết bị (asr.worker.ts).
 * Mô hình: Whisper base đa ngôn ngữ (OpenAI, Apache-2.0) bản ONNX lượng tử hoá của onnx-community, chạy bằng Transformers.js
 * (Apache-2.0). Tải ~77 MB một lần từ Hugging Face, trình duyệt lưu cache; âm thanh KHÔNG rời thiết bị.
 * Whisper CHỈ nhận diện nội dung lời nói — không chấm phát âm.
 */
export const ASR_MODEL_ID = 'onnx-community/whisper-base';
export const ASR_MODEL_LABEL = 'Whisper base (OpenAI · Apache-2.0)';
/** Dung lượng mô hình (bản q8: encoder 23 MB + decoder 54 MB, đo trên Hugging Face). */
export const ASR_MODEL_MB = 77;
/** Tổng tải lần đầu: mô hình + bộ chạy ONNX Runtime WebAssembly (~26 MB, phục vụ từ chính app). */
export const ASR_FIRST_DOWNLOAD_MB = 103;

export type AsrDevice = 'webgpu' | 'wasm';

export type AsrRequest =
  | { type: 'load' }
  | { type: 'transcribe'; id: number; audio: Float32Array };

export type AsrResponse =
  | { type: 'progress'; loadedMb: number; totalMb: number; percent: number }
  | { type: 'ready'; device: AsrDevice; loadMs: number }
  | { type: 'result'; id: number; text: string; ms: number }
  | { type: 'error'; id?: number; stage: 'load' | 'transcribe'; reason: 'memory' | 'network' | 'unsupported' | 'unknown'; message: string };

/** Phân loại lỗi để báo người học đúng nguyên nhân (thiếu bộ nhớ / mạng / thiết bị không hỗ trợ). */
export function classifyAsrError(error: unknown): 'memory' | 'network' | 'unsupported' | 'unknown' {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (/memory|OOM|allocation|RangeError/i.test(message)) return 'memory';
  if (/fetch|network|Failed to load|404|ERR_|offline|timed? ?out/i.test(message)) return 'network';
  if (/WebAssembly|wasm|webgpu|not supported|unsupported/i.test(message)) return 'unsupported';
  return 'unknown';
}
