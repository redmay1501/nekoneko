import { describe, expect, it } from 'vitest';
import { createGrammarRunnerState, grammarRunnerReducer } from './grammar-exercise-runner-state';

describe('luồng GrammarExerciseRunner', () => {
  it('luyện tập: chỉ mở phản hồi sau khi trả lời, chuyển câu và kết thúc bài', () => {
    let state = createGrammarRunnerState(2);
    expect(state.answers).toEqual([null, null]);
    state = grammarRunnerReducer(state, { type: 'answer', value: 'đáp án', reveal: true });
    expect(state.isRevealed).toBe(true);
    expect(state.answers[0]).toBe('đáp án');
    expect(grammarRunnerReducer(state, { type: 'answer', value: 'đáp án khác', reveal: true }).answers[0]).toBe('đáp án');
    state = grammarRunnerReducer(state, { type: 'next', length: 2, training: true });
    expect(state.index).toBe(1);
    expect(state.isRevealed).toBe(false);
    state = grammarRunnerReducer(state, { type: 'answer', value: 'câu 2', reveal: true });
    state = grammarRunnerReducer(state, { type: 'next', length: 2, training: true });
    expect(state.isFinished).toBe(true);
  });

  it('kiểm tra: giữ kín phản hồi, lưu câu trả lời khi chuyển qua lại, nộp và làm lại', () => {
    let state = createGrammarRunnerState(2);
    state = grammarRunnerReducer(state, { type: 'answer', value: 'A', reveal: false });
    expect(state.isRevealed).toBe(false);
    state = grammarRunnerReducer(state, { type: 'next', length: 2, training: false });
    state = grammarRunnerReducer(state, { type: 'answer', value: 'B', reveal: false });
    state = grammarRunnerReducer(state, { type: 'previous' });
    expect(state.index).toBe(0);
    expect(state.answers).toEqual(['A', 'B']);
    state = grammarRunnerReducer(state, { type: 'submit' });
    expect(state.isSubmitted).toBe(true);
    expect(grammarRunnerReducer(state, { type: 'restart', length: 2 })).toEqual(createGrammarRunnerState(2));
  });
});
