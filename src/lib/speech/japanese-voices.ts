/**
 * Chọn giọng đọc tiếng Nhật có sẵn trên máy (Web Speech API) theo giới tính người học muốn nghe.
 *
 * Trình duyệt không cho biết giới tính của giọng, nên nhận diện theo TÊN các giọng tiếng Nhật đã biết của
 * Microsoft (Edge/Windows), Apple (macOS/iOS) và Google (Chrome). Giọng lạ → "không rõ".
 * Hàm thuần — test được không cần trình duyệt.
 */

export type VoiceGender = 'female' | 'male';
export type DetectedGender = VoiceGender | 'unknown';

/** Phần thông tin cần dùng của SpeechSynthesisVoice (để test không cần trình duyệt). */
export interface VoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
}

const FEMALE_VOICE_NAMES = ['nanami', 'aoi', 'mayu', 'shiori', 'haruka', 'ayumi', 'sayaka', 'kyoko', 'o-ren', 'google 日本語'];
const MALE_VOICE_NAMES = ['keita', 'daichi', 'naoki', 'ichiro', 'otoya', 'hattori'];

export function detectVoiceGender(voice: VoiceLike): DetectedGender {
  const name = voice.name.toLowerCase();
  // Xét "female" trước "male" vì chuỗi "female" chứa "male".
  if (name.includes('female') || FEMALE_VOICE_NAMES.some((known) => name.includes(known))) return 'female';
  if (name.includes('male') || MALE_VOICE_NAMES.some((known) => name.includes(known))) return 'male';
  return 'unknown';
}

/** Giọng thần kinh (neural) nghe tự nhiên hơn hẳn giọng tổng hợp cũ. */
function qualityScore(voice: VoiceLike): number {
  const name = voice.name.toLowerCase();
  if (name.includes('natural') || name.includes('online') || name.includes('premium')) return 3; // Microsoft Natural, Apple Premium
  if (name.includes('enhanced') || name.includes('google')) return 2; // Apple Enhanced, Google
  return 1;
}

export function isJapaneseVoice(voice: VoiceLike): boolean {
  return voice.lang.toLowerCase().replace('_', '-').startsWith('ja');
}

export interface VoiceChoice<TVoice extends VoiceLike> {
  voice: TVoice;
  gender: DetectedGender;
  /** false = máy không có giọng đúng loại người học chọn, đang dùng giọng tiếng Nhật khác. */
  matchesPreference: boolean;
}

/** Giọng tiếng Nhật tốt nhất cho lựa chọn nam/nữ; null nếu máy không có giọng tiếng Nhật nào. */
export function pickJapaneseVoice<TVoice extends VoiceLike>(voices: readonly TVoice[], preferred: VoiceGender): VoiceChoice<TVoice> | null {
  const ranked = voices
    .filter(isJapaneseVoice)
    .map((voice) => {
      const gender = detectVoiceGender(voice);
      // Đúng giới tính quan trọng nhất; giọng "không rõ" còn hơn giọng chắc chắn sai giới tính.
      const genderScore = gender === preferred ? 10 : gender === 'unknown' ? 5 : 0;
      return { voice, gender, score: genderScore + qualityScore(voice) };
    })
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  return best ? { voice: best.voice, gender: best.gender, matchesPreference: best.gender === preferred } : null;
}
