import { describe, expect, it } from 'vitest';
import { analyzeAudio, checkAudio, countMora, moraRate } from './audio-quality';

const RATE = 16000;
/** Tín hiệu thử: im lặng (nhiễu rất nhỏ) + đoạn "tiếng" (sóng sin) ở giữa. */
function signal({ seconds, voiceFrom = 0, voiceTo = 0, amplitude = 0.3, noise = 0.001 }: { seconds: number; voiceFrom?: number; voiceTo?: number; amplitude?: number; noise?: number }) {
  const samples = new Float32Array(Math.round(seconds * RATE));
  let seed = 7;
  for (let index = 0; index < samples.length; index += 1) {
    seed = (seed * 16807) % 2147483647;
    const t = index / RATE;
    const voice = t >= voiceFrom && t < voiceTo ? amplitude * Math.sin(2 * Math.PI * 220 * t) : 0;
    samples[index] = voice + noise * ((seed / 2147483647) * 2 - 1);
  }
  return samples;
}

describe('phân tích bản ghi đọc to', () => {
  it('đo đúng thời gian có tiếng và thời lượng', () => {
    const stats = analyzeAudio(signal({ seconds: 3, voiceFrom: 0.5, voiceTo: 2.0 }), RATE);
    expect(stats.durationSec).toBeCloseTo(3, 1);
    expect(stats.speechSec).toBeGreaterThan(1.4);
    expect(stats.speechSec).toBeLessThan(1.6);
    expect(checkAudio(stats).verdict).toBe('ok');
  });

  it('chỉ có im lặng / nhiễu nhỏ → "silent" (không đưa vào nhận diện)', () => {
    expect(checkAudio(analyzeAudio(signal({ seconds: 2 }), RATE)).verdict).toBe('silent');
  });

  it('tiếng quá ngắn → "too_short"; quá nhỏ → "too_quiet"; quá dài → "too_long"', () => {
    expect(checkAudio(analyzeAudio(signal({ seconds: 2, voiceFrom: 1, voiceTo: 1.08 }), RATE)).verdict).toBe('too_short');
    expect(checkAudio(analyzeAudio(signal({ seconds: 2, voiceFrom: 0.2, voiceTo: 1.5, amplitude: 0.02, noise: 0.0005 }), RATE)).verdict).toBe('too_quiet');
    expect(checkAudio(analyzeAudio(signal({ seconds: 16.5, voiceFrom: 1, voiceTo: 3 }), RATE)).verdict).toBe('too_long');
  });

  it('tiếng bị rè (chạm trần) → cảnh báo "clipped", vẫn nhận diện', () => {
    const check = checkAudio(analyzeAudio(signal({ seconds: 2, voiceFrom: 0.2, voiceTo: 1.6, amplitude: 1.4 }).map((value) => Math.max(-1, Math.min(1, value))), RATE));
    expect(check.verdict).toBe('ok');
    expect(check.warnings).toContain('clipped');
  });

  it('nền ồn to ngang tiếng nói → "too_noisy" (không báo nhầm là im lặng); ồn vừa → cảnh báo "noisy"', () => {
    expect(checkAudio(analyzeAudio(signal({ seconds: 2, voiceFrom: 0.3, voiceTo: 1.5, amplitude: 0.08, noise: 0.08 }), RATE)).verdict).toBe('too_noisy');
    const moderate = checkAudio(analyzeAudio(signal({ seconds: 2, voiceFrom: 0.3, voiceTo: 1.5, amplitude: 0.05, noise: 0.02 }), RATE));
    expect(moderate.verdict).toBe('ok');
    expect(moderate.warnings).toContain('noisy');
  });
});

describe('đếm mora', () => {
  it('kana nhỏ ghép không tính; っ, ん, ー mỗi cái một mora', () => {
    expect(countMora('きょう')).toBe(2);
    expect(countMora('がっこう')).toBe(4);
    expect(countMora('せんせい')).toBe(4);
    expect(countMora('コーヒー')).toBe(4);
    expect(countMora('わたしは がくせいです。')).toBe(10);
  });

  it('có Kanji / chữ Latin → null (không đếm đoán)', () => {
    expect(countMora('学生')).toBeNull();
    expect(countMora('abc')).toBeNull();
    expect(countMora('')).toBeNull();
  });

  it('tốc độ nói = mora / thời gian nói', () => {
    const stats = analyzeAudio(signal({ seconds: 2, voiceFrom: 0.5, voiceTo: 1.5 }), RATE);
    expect(moraRate('がっこう', stats)).toBeCloseTo(4, 0);
    expect(moraRate('学校', stats)).toBeNull();
  });
});
