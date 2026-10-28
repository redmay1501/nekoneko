/**
 * Ghi âm trong trình duyệt (MediaRecorder) + chuyển bản ghi về PCM 16 kHz mono cho Whisper.
 * Chỉ xin quyền micro khi người học bấm ghi âm. Bản ghi chỉ nằm trong bộ nhớ trang (Blob) — không lưu, không gửi đi.
 */
export const ASR_SAMPLE_RATE = 16000;

export type RecorderFailure = 'unsupported' | 'permission_denied' | 'no_microphone' | 'failed';

export interface ActiveRecording {
  /** Mức âm lượng hiện tại 0..1 (cho thanh mức). */
  level: () => number;
  stop: () => Promise<Blob>;
  cancel: () => void;
}

export function canRecord(): boolean {
  return typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof window.MediaRecorder !== 'undefined';
}

export function canRunOnDeviceAsr(): boolean {
  return typeof window !== 'undefined' && typeof WebAssembly === 'object' && typeof Worker !== 'undefined'
    && typeof (window.AudioContext ?? (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext) !== 'undefined';
}

export function recorderFailureOf(error: unknown): RecorderFailure {
  const name = error instanceof DOMException || error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'permission_denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'no_microphone';
  return 'failed';
}

const audioContextClass = () => window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

/** Chọn định dạng trình duyệt ghi được (Chrome / Firefox: webm-opus; Safari: mp4-aac). */
function pickMimeType(): string | undefined {
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return undefined;
}

export async function startRecording(): Promise<ActiveRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  const context = new (audioContextClass())();
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  context.createMediaStreamSource(stream).connect(analyser);
  const buffer = new Uint8Array(analyser.fftSize);
  const release = () => { stream.getTracks().forEach((track) => track.stop()); void context.close().catch(() => {}); };
  recorder.start();
  return {
    level() {
      analyser.getByteTimeDomainData(buffer);
      let peak = 0;
      for (const value of buffer) peak = Math.max(peak, Math.abs(value - 128) / 128);
      return Math.min(1, peak * 1.6);
    },
    stop: () => new Promise<Blob>((resolve) => {
      recorder.onstop = () => { release(); resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })); };
      if (recorder.state !== 'inactive') recorder.stop(); else recorder.onstop?.(new Event('stop'));
    }),
    cancel() { try { recorder.stop(); } catch { /* đã dừng */ } release(); },
  };
}

/** Giải mã bản ghi → PCM mono 16 kHz (Float32) — đầu vào của Whisper và của phân tích âm thanh. */
export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const context = new (audioContextClass())();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const length = Math.max(1, Math.ceil(decoded.duration * ASR_SAMPLE_RATE));
    const offline = new OfflineAudioContext(1, length, ASR_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0).slice();
  } finally {
    void context.close().catch(() => {});
  }
}
