import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { loadSeedContent } from '@/lib/data/seed-content';
import { buildGrammarQuestionBank } from '@/features/learning/grammar-exercises';
import { GrammarExerciseResults } from './GrammarExerciseRunner';

const exercises = buildGrammarQuestionBank(loadSeedContent().grammar).slice(0, 3);

describe('GrammarExerciseResults', () => {
  it('hiển thị điểm, đáp án chính xác và giải thích; cho phép làm lại', () => {
    const markup = renderToStaticMarkup(createElement(GrammarExerciseResults, {
      mode: 'kiem-tra', exercises, answers: ['sai', exercises[1].answer, null], onRestart: vi.fn(),
    }));

    expect(markup).toContain('1/3 câu đúng');
    expect(markup).toContain('Đáp án chính xác:');
    expect(markup).toContain(exercises[0].answer);
    expect(markup).toContain(exercises[0].explanation);
    expect(markup).toContain('Làm lại');
    expect(markup).toContain('1 câu bỏ trống');
  });
});
