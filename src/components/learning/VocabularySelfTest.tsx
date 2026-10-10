'use client';

import { type FormEvent, useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { KnowledgeChipButton } from './KnowledgeChipButton';
import { answerVocabularyCheck } from '@/features/memory/memory-api';
import { compareJapanese } from '@/lib/utils/japanese-text';
import { lessonNumber } from '@/lib/utils/lesson';
import type { VocabularyRowData } from './LessonVocabularyList';

type Ask = 'meaning' | 'reading';
const OPTION_COUNT = 4;
const QUESTION_COUNTS = [10, 20, 30] as const;
/** Khoảng bài gợi ý — vẫn chọn tự do "từ bài … đến bài …". */
const KANA_PERIOD = 0;

interface Question {
  row: VocabularyRowData;
  options: string[];
}

interface Answered {
  row: VocabularyRowData;
  answer: string;
  isCorrect: boolean;
}

const lessonOf = (row: VocabularyRowData) => (Number.isFinite(lessonNumber(row.lesson)) ? lessonNumber(row.lesson) : KANA_PERIOD);
function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/**
 * Tự kiểm tra từ vựng theo khoảng bài: nhìn chữ → chọn nghĩa, hoặc xem nghĩa → gõ cách đọc.
 * Chấm ngay trên máy (phản hồi tức thì); từ đã học thì gửi server chấm lại và ghi vào trí nhớ (tối đa 1 lần / từ / ngày).
 */
export function VocabularySelfTest({ rows }: { rows: VocabularyRowData[] }) {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [ask, setAsk] = useState<Ask>('meaning');
  const [count, setCount] = useState<number>(QUESTION_COUNTS[0]);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [current, setCurrent] = useState<Answered | null>(null);
  const [answered, setAnswered] = useState<Answered[]>([]);

  const lessons = [...new Set(rows.map(lessonOf))].sort((left, right) => left - right);
  const inRange = rows.filter((row) => selectedLessons.includes(lessonOf(row)));
  const lessonLabel = (lesson: number) => (lesson === KANA_PERIOD ? 'Chữ cái' : `Bài ${lesson}`);

  function start() {
    if (!inRange.length) return;
    const picked = shuffle(inRange).slice(0, count);
    const meanings = [...new Set(inRange.map((row) => row.title))];
    setQuestions(picked.map((row) => ({
      row,
      options: shuffle([row.title, ...shuffle(meanings.filter((meaning) => meaning !== row.title)).slice(0, OPTION_COUNT - 1)]),
    })));
    setIndex(0);
    setAnswered([]);
    setCurrent(null);
    setTyped('');
  }

  function toggleLesson(lesson: number) {
    setSelectedLessons((selected) => selected.includes(lesson)
      ? selected.filter((item) => item !== lesson)
      : [...selected, lesson]);
  }

  function submit(answer: string) {
    if (!questions || current) return;
    const { row } = questions[index];
    const isCorrect = ask === 'meaning'
      ? answer === row.title
      : compareJapanese(answer, [row.subtitle ?? '', row.face], { foldKatakana: true }).isCorrect;
    const result = { row, answer, isCorrect };
    setCurrent(result);
    setAnswered((list) => [...list, result]);
    // Từ chưa học: server từ chối (không ghi trí nhớ) — bài tự kiểm tra vẫn chấm điểm bình thường.
    if (row.status !== 'new') answerVocabularyCheck(row.contentKey, answer, ask).catch(() => undefined);
  }

  function next() {
    setCurrent(null);
    setTyped('');
    setIndex((value) => value + 1);
  }

  if (!questions) {
    return (
      <div className="card self-test">
        <button type="button" className="btn ghost block" aria-expanded={isSetupOpen}
          onClick={() => setIsSetupOpen((open) => !open)}>
          🧪 {isSetupOpen ? 'Đóng chọn từ' : 'Kiểm tra từ vựng'}
        </button>
        {isSetupOpen ? (
          <div className="vocab-test-setup">
            <p className="sm soft">Chọn bài bằng ô tích. Từ bạn đã học sẽ được tính vào trí nhớ.</p>
            <div className="row wrap mt-2" style={{ gap: 8, alignItems: 'center' }}>
              <span className="tiny muted">Đã chọn {inRange.length} từ</span>
              <button type="button" className="link tiny" onClick={() => setSelectedLessons(lessons)}>Chọn tất cả</button>
              <button type="button" className="link tiny" onClick={() => setSelectedLessons([])}>Bỏ chọn</button>
            </div>
            <div className="vocab-test-lessons" aria-label="Chọn bài kiểm tra">
              {lessons.map((lesson) => (
                <label key={lesson} className="vocab-test-lesson">
                  <input type="checkbox" checked={selectedLessons.includes(lesson)} onChange={() => toggleLesson(lesson)} />
                  <span>{lessonLabel(lesson)}</span>
                </label>
              ))}
            </div>
            <fieldset className="radio-group mt-3">
              <legend className="sm">Kiểu câu hỏi</legend>
              <label><input type="radio" name="ask" checked={ask === 'meaning'} onChange={() => setAsk('meaning')} /> Nhìn chữ → chọn nghĩa</label>
              <label><input type="radio" name="ask" checked={ask === 'reading'} onChange={() => setAsk('reading')} /> Xem nghĩa → gõ cách đọc</label>
            </fieldset>
            <fieldset className="radio-group mt-2">
              <legend className="sm">Số câu (tối đa {inRange.length})</legend>
              {QUESTION_COUNTS.map((value) => (
                <label key={value}><input type="radio" name="count" checked={count === value} disabled={value > inRange.length}
                  onChange={() => setCount(value)} /> {value}</label>
              ))}
            </fieldset>
            <button type="button" className="btn block mt-3" onClick={start} disabled={!inRange.length}>Bắt đầu kiểm tra</button>
          </div>
        ) : null}
      </div>
    );
  }

  if (index >= questions.length) {
    const correct = answered.filter((item) => item.isCorrect).length;
    const wrong = answered.filter((item) => !item.isCorrect);
    return (
      <div className="card self-test center" aria-live="polite">
        <p className="chip mint">Xong bài kiểm tra</p>
        <p style={{ fontSize: 30, fontWeight: 700, margin: '10px 0 2px' }}>{Math.round((correct / answered.length) * 100)}%</p>
        <p className="sm soft">{correct} đúng · {wrong.length} sai · {selectedLessons.map(lessonLabel).join(', ')}</p>
        {wrong.length ? (
          <div className="mt-3" style={{ textAlign: 'left' }}>
            <b className="sm">Ôn lại những từ này</b>
            <div className="stack mt-2" style={{ gap: 6 }}>
              {wrong.map(({ row }) => (
                <KnowledgeChipButton key={row.contentKey} contentKey={row.contentKey} className="list-row" style={{ padding: '8px 12px' }}>
                  <span className="mid"><b className="jp">{row.face}</b><span><span className="jp">{row.subtitle}</span> · {row.title}</span></span>
                  <span className="end tiny muted">→</span>
                </KnowledgeChipButton>
              ))}
            </div>
          </div>
        ) : <p className="sm mt-2">Không sai câu nào — giỏi lắm! 🌸</p>}
        <div className="row mt-3" style={{ gap: 8 }}>
          <button type="button" className="btn quiet" style={{ flex: 1 }} onClick={() => { setQuestions(null); setIsSetupOpen(true); }}>Đổi bài</button>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={start}>Làm lại</button>
        </div>
      </div>
    );
  }

  const { row, options } = questions[index];
  const onType = (event: FormEvent) => { event.preventDefault(); if (typed.trim()) submit(typed); };
  return (
    <div className="card self-test" aria-live="polite">
      <div className="between">
        <span className="tiny muted">Câu {index + 1}/{questions.length} · {answered.filter((item) => item.isCorrect).length} đúng</span>
        <button type="button" className="link tiny" onClick={() => setQuestions(null)}>Dừng</button>
      </div>
      {ask === 'meaning' ? (
        <>
          <div className="center" style={{ margin: '14px 0' }}>
            <p className="jp glyph" style={{ fontSize: 36 }}>{row.face}</p>
            <AudioButton text={row.subtitle ?? row.face} className="btn ghost sm mt-1" label="🔊" />
          </div>
          <div className="s-opt" style={{ gap: 7 }}>
            {options.map((option) => {
              const state = current ? (option === row.title ? 'quiz-correct' : option === current.answer ? 'quiz-wrong' : '') : '';
              return <button key={option} type="button" className={`opt ${state}`} disabled={Boolean(current)} onClick={() => submit(option)}>{option}</button>;
            })}
          </div>
        </>
      ) : (
        <form onSubmit={onType} className="mt-3">
          <p className="center" style={{ fontSize: 22, fontWeight: 700 }}>{row.title}</p>
          <p className="tiny muted center">Gõ cách đọc bằng Hiragana (hoặc chữ Kanji)</p>
          <input className="input mt-2.5 jp" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={Boolean(current)}
            lang="ja" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label="Cách đọc" autoFocus />
          {!current ? <button type="submit" className="btn block mt-2.5" disabled={!typed.trim()}>Kiểm tra</button> : null}
        </form>
      )}
      {current ? (
        <div className={`feedback ${current.isCorrect ? '' : 'miss'}`}>
          <p>{current.isCorrect ? 'Đúng rồi! 🌸' : 'Chưa đúng — nhìn kỹ lại nhé.'}</p>
          <p className="sm mt-1"><b className="jp">{row.face}</b> <span className="jp">({row.subtitle})</span> = {row.title}</p>
          <button type="button" className="btn block mt-2.5" onClick={next} autoFocus>{index + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp'}</button>
        </div>
      ) : null}
    </div>
  );
}
