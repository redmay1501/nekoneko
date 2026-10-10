import { describe, expect, it } from 'vitest';
import type { PublicSessionStep, StepAnswerFeedback } from '@/features/learning/session-types';
import { autoplayTextFor } from './SessionAudio';

const feedback = (correctAnswer: string): StepAnswerFeedback => ({ isCorrect: true, correctAnswer, memory: null });
const recall = { type: 'recall', stepIndex: 1, contentKey: 'kanji-1', face: '日', question: 'Chữ này đọc là gì?', options: [] } as unknown as PublicSessionStep;
const meaningRecall = { ...recall, face: 'がっこう', question: 'Nó nghĩa là gì?' } as PublicSessionStep;
const discover = { type: 'discover', stepIndex: 0, contentKey: 'vocabulary-1', card: { audioText: 'がっこう' } } as unknown as PublicSessionStep;

describe('tự phát âm trong phiên học', () => {
  it('thẻ giới thiệu từ mới: đọc ngay', () => {
    expect(autoplayTextFor(discover, null)).toBe('がっこう');
  });

  it('câu hỏi: không đọc trước khi trả lời (không lộ đáp án)', () => {
    expect(autoplayTextFor(recall, null)).toBeNull();
  });

  it('trả lời xong: đọc đáp án tiếng Nhật, hoặc mặt chữ khi đáp án là nghĩa tiếng Việt', () => {
    expect(autoplayTextFor(recall, feedback('にち'))).toBe('にち');
    expect(autoplayTextFor(meaningRecall, feedback('Trường học'))).toBe('がっこう');
  });

  it('có cách đọc chuẩn (audioText) thì đọc cách đọc — không để giọng máy đoán cách đọc chữ Hán', () => {
    const kanjiWord = { ...meaningRecall, face: '学校', audioText: 'がっこう' } as PublicSessionStep;
    expect(autoplayTextFor(kanjiWord, null)).toBeNull();
    expect(autoplayTextFor(kanjiWord, feedback('Trường học'))).toBe('がっこう');
  });
});
