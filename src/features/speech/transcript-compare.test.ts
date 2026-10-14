import { describe, expect, it } from 'vitest';
import { compareTranscript, diffSegments } from './transcript-compare';

const FORMS = ['わたしは 学生じゃ ありません。', 'わたしは がくせいじゃ ありません。'];

describe('so khớp văn bản nhận diện với câu mẫu', () => {
  it('khớp khi chỉ khác dấu câu, khoảng trắng, Katakana / Hiragana, độ rộng ký tự', () => {
    expect(compareTranscript('わたしは学生じゃありません', FORMS).isMatch).toBe(true);
    expect(compareTranscript('わたしは がくせいじゃ ありません', FORMS).isMatch).toBe(true);
    expect(compareTranscript('ワタシハ ガクセイジャ アリマセン', FORMS).isMatch).toBe(true);
    expect(compareTranscript('ミラーさんは　アメリカ人ですか？', ['ミラーさんは アメリカ人ですか。']).isMatch).toBe(true);
    expect(compareTranscript('４時５分です', ['4時5分です。']).isMatch).toBe(true);
  });

  it('không khớp khi thiếu hoặc khác chữ; chỉ ra đoạn thiếu / thừa', () => {
    const missing = compareTranscript('わたしは学生です', FORMS);
    expect(missing.isMatch).toBe(false);
    expect(missing.segments.filter((segment) => segment.kind === 'missing').map((segment) => segment.text).join('')).toContain('じゃありません');
    const extra = compareTranscript('わたしは学生じゃありませんよ', FORMS);
    expect(extra.segments.at(-1)).toEqual({ kind: 'extra', text: 'よ' });
  });

  it('giữ dấu kéo dài: コーヒー khác コヒー (trường âm có thể hiện ra ở chữ nhận diện)', () => {
    expect(compareTranscript('コヒー', ['コーヒー']).isMatch).toBe(false);
    expect(compareTranscript('コヒー', ['コーヒー']).segments).toEqual([{ kind: 'same', text: 'こ' }, { kind: 'missing', text: 'ー' }, { kind: 'same', text: 'ひー' }]);
  });

  it('gợi ý "có thể chỉ khác cách viết" khi phần khác có Kanji', () => {
    const result = compareTranscript('私は学生じゃありません', FORMS);
    expect(result.isMatch).toBe(false);
    expect(result.mayBeScriptDifference).toBe(true);
    expect(compareTranscript('わたしはがくせいです', ['わたしはせんせいです']).mayBeScriptDifference).toBe(false);
    // Đọc thiếu nửa câu (phần thiếu có Kanji) KHÔNG phải khác cách viết.
    expect(compareTranscript('9時から5時', ['9時から 5時まで 働きます。']).mayBeScriptDifference).toBe(false);
    expect(compareTranscript('9時から 5時よ', ['9時から 5時まで 働きます。']).mayBeScriptDifference).toBe(false);
    expect(compareTranscript('わたしはがくせいじゃありません', ['私は学生じゃありません']).mayBeScriptDifference).toBe(true);
  });

  it('bản nhận diện rỗng không bao giờ là khớp', () => {
    expect(compareTranscript('', FORMS).isMatch).toBe(false);
    expect(compareTranscript('。', FORMS).isMatch).toBe(false);
  });

  it('diff gộp các ký tự liền nhau cùng loại', () => {
    expect(diffSegments('abcd', 'abxd')).toEqual([{ kind: 'same', text: 'ab' }, { kind: 'missing', text: 'c' }, { kind: 'extra', text: 'x' }, { kind: 'same', text: 'd' }]);
  });
});
