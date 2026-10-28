/**
 * Phân tích bản ghi đọc to — chạy hoàn toàn trên thiết bị, thuần số học (test được, không cần trình duyệt).
 *
 * CHỈ đo những gì đo được chắc chắn từ tín hiệu: thời lượng, phần có tiếng (năng lượng theo khung 20 ms so với nền ồn),
 * âm lượng, cắt tiếng (clipping), im lặng — và tốc độ nói = số mora của câu mẫu / thời gian có tiếng.
 * KHÔNG suy ra âm vị, trường âm, âm ngắt っ, ん hay cao độ: đo năng lượng / thời lượng không đủ cơ sở để kết luận những điều đó.
 */

export interface AudioStats {
  /** Tổng thời lượng bản ghi (giây). */
  durationSec: number;
  /** Từ khung có tiếng đầu tiên tới khung cuối (giây) — "thời gian nói". */
  speechSec: number;
  /** Tổng thời lượng các khung có tiếng (giây). */
  voicedSec: number;
  /** Biên độ lớn nhất (0..1). */
  peak: number;
  /** Tỉ lệ mẫu chạm trần (|x| ≥ 0.99) — cao = tiếng bị rè vì quá to / sát mic. */
  clippedRatio: number;
  /** Âm lượng trung bình phần có tiếng (dBFS). */
  speechDb: number;
  /** Nền ồn (dBFS, khung yên tĩnh nhất). */
  noiseDb: number;
}

export type AudioVerdict = 'ok' | 'silent' | 'too_short' | 'too_quiet' | 'too_long' | 'too_noisy';

export interface AudioCheck {
  verdict: AudioVerdict;
  /** Cảnh báo không chặn (vẫn nhận diện được). */
  warnings: Array<'clipped' | 'noisy' | 'quiet'>;
}

const FRAME_SEC = 0.02;
export const MAX_RECORDING_SEC = 15;
const MIN_VOICED_SEC = 0.18;
const MIN_SPEECH_PEAK = 0.03;

const toDb = (value: number) => (value > 0 ? 20 * Math.log10(value) : -120);

export function analyzeAudio(samples: Float32Array, sampleRate: number): AudioStats {
  const frame = Math.max(1, Math.round(sampleRate * FRAME_SEC));
  const frames: number[] = [];
  let peak = 0;
  let clipped = 0;
  for (let start = 0; start < samples.length; start += frame) {
    let sum = 0;
    const end = Math.min(samples.length, start + frame);
    for (let index = start; index < end; index += 1) {
      const value = Math.abs(samples[index]);
      sum += value * value;
      if (value > peak) peak = value;
      if (value >= 0.99) clipped += 1;
    }
    frames.push(Math.sqrt(sum / Math.max(1, end - start)));
  }
  const sorted = [...frames].sort((left, right) => left - right);
  // Nền ồn = khung yên tĩnh (bách phân vị 10); ngưỡng "có tiếng" = gấp 2.5 lần nền ồn (≈ +8 dB), không dưới mức rất nhỏ.
  const noise = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const threshold = Math.max(noise * 2.5, 0.01);
  const voiced = frames.map((rms) => rms >= threshold);
  const first = voiced.indexOf(true);
  const last = voiced.lastIndexOf(true);
  const voicedFrames = frames.filter((_, index) => voiced[index]);
  const speechRms = voicedFrames.length ? Math.sqrt(voicedFrames.reduce((sum, rms) => sum + rms * rms, 0) / voicedFrames.length) : 0;
  return {
    durationSec: samples.length / sampleRate,
    speechSec: first < 0 ? 0 : ((last - first + 1) * frame) / sampleRate,
    voicedSec: (voicedFrames.length * frame) / sampleRate,
    peak,
    clippedRatio: samples.length ? clipped / samples.length : 0,
    speechDb: toDb(speechRms),
    noiseDb: toDb(noise),
  };
}

/** Cổng chất lượng: bản ghi không đủ dữ liệu thì KHÔNG nhận diện (Whisper hay "bịa" chữ khi chỉ có im lặng / tiếng ồn). */
export function checkAudio(stats: AudioStats): AudioCheck {
  const warnings: AudioCheck['warnings'] = [];
  if (stats.clippedRatio > 0.002) warnings.push('clipped');
  if (stats.speechDb - stats.noiseDb < 12 && stats.voicedSec > 0) warnings.push('noisy');
  if (stats.speechDb < -38 && stats.voicedSec > 0) warnings.push('quiet');
  if (stats.durationSec > MAX_RECORDING_SEC + 0.5) return { verdict: 'too_long', warnings };
  // Nền ồn to ngang tiếng nói: không tách được phần có tiếng — báo "quá ồn" (không phải "không nghe thấy").
  if (stats.voicedSec < MIN_VOICED_SEC && stats.noiseDb > -32) return { verdict: 'too_noisy', warnings };
  if (stats.peak < MIN_SPEECH_PEAK && stats.voicedSec < MIN_VOICED_SEC) return { verdict: 'silent', warnings };
  if (stats.peak < MIN_SPEECH_PEAK) return { verdict: 'too_quiet', warnings };
  if (stats.voicedSec < MIN_VOICED_SEC) return { verdict: stats.voicedSec === 0 ? 'silent' : 'too_short', warnings };
  return { verdict: 'ok', warnings };
}

const SMALL_KANA = new Set([...'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ']);
const IS_KANA = /[ぁ-ゖァ-ヺー]/;

/**
 * Số mora của một cách đọc kana: mỗi kana một mora, trừ kana nhỏ ghép (ゃ ゅ ょ ぁ…) — っ, ん, ー đều là một mora.
 * Có ký tự không phải kana (Kanji, chữ Latin…) → null: không đếm đoán.
 */
export function countMora(reading: string): number | null {
  const text = reading.replace(/[\s　、。・,.!?！？「」『』（）()〜~]/g, '');
  if (!text) return null;
  let count = 0;
  for (const character of text) {
    if (!IS_KANA.test(character)) return null;
    if (!SMALL_KANA.has(character)) count += 1;
  }
  return count;
}

/** Tốc độ nói (mora / giây) — chỉ khi đếm được mora và có đủ thời gian nói. */
export function moraRate(reading: string, stats: AudioStats): number | null {
  const mora = countMora(reading);
  if (!mora || stats.speechSec < 0.25) return null;
  return Math.round((mora / stats.speechSec) * 10) / 10;
}
