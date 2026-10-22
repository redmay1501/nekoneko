import { shuffleDeterministic } from '@/lib/utils/deterministic-random';
import type { GrammarExercise } from '@/features/learning/grammar-exercises';

export interface GrammarRunnerState {
  index: number;
  answers: Array<string | null>;
  isRevealed: boolean;
  isSubmitted: boolean;
  isFinished: boolean;
}

export type GrammarRunnerAction =
  | { type: 'answer'; value: string | null; reveal: boolean }
  | { type: 'next'; length: number; training: boolean }
  | { type: 'previous' }
  | { type: 'submit' }
  | { type: 'restart'; length: number };

export function createGrammarRunnerState(length: number): GrammarRunnerState {
  return { index: 0, answers: Array.from({ length }, () => null), isRevealed: false, isSubmitted: false, isFinished: false };
}

export function grammarRunnerReducer(state: GrammarRunnerState, action: GrammarRunnerAction): GrammarRunnerState {
  switch (action.type) {
    case 'answer': {
      if (state.isRevealed || state.isSubmitted || state.isFinished) return state;
      const answers = [...state.answers];
      answers[state.index] = action.value;
      return { ...state, answers, isRevealed: action.reveal };
    }
    case 'next':
      if (state.index + 1 >= action.length) {
        return action.training ? { ...state, isFinished: true } : state;
      }
      return { ...state, index: state.index + 1, isRevealed: false };
    case 'previous':
      return { ...state, index: Math.max(0, state.index - 1), isRevealed: false };
    case 'submit':
      return { ...state, isSubmitted: true };
    case 'restart':
      return createGrammarRunnerState(action.length);
  }
}

/** Chọn một lượt mới từ câu chưa gặp; câu hiện tại và lịch sử đã gặp không bị lặp nếu còn lựa chọn. */
export function selectNewGrammarRound(
  pool: readonly GrammarExercise[],
  currentIds: readonly string[],
  seenIds: readonly string[],
  count: number,
  seed: string,
): GrammarExercise[] {
  const excluded = new Set([...currentIds, ...seenIds]);
  return shuffleDeterministic(pool.filter((exercise) => !excluded.has(exercise.id)), `grammar-round:${seed}`).slice(0, count);
}
