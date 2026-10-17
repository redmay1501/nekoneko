'use client';

import { useState } from 'react';
import { KANA_GROUPS } from '@/features/learning/knowledge-filters';
import type { KanaCell, KanaPracticeData, KanaWritingChoice } from '@/features/learning/kana-practice';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { ScrollToElementOnChange } from '@/components/common/ScrollToElementOnChange';
import { AssessmentQuiz } from './AssessmentQuiz';
import { KnowledgeChipButton } from './KnowledgeChipButton';
import { WritingPad } from './WritingPad';

const TABS = [
  { id: 'learn', label: 'Học' },
  { id: 'write', label: 'Luyện viết' },
  { id: 'listen', label: 'Luyện nghe' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function cellClass(cell: KanaCell): string {
  if (cell.status === 'new') return 's-new';
  if (cell.status === 'fading' || cell.status === 'weak') return 's-weak';
  return 's-strong';
}

function KanaBoard({ cells }: { cells: KanaCell[] }) {
  return (
    <>
      {KANA_GROUPS.map((group) => {
        const groupCells = cells.slice(group.from, group.to);
        return (
          <div key={group.label}>
            <div className="sec-h"><h2>{group.label}</h2><span className="tiny muted">{groupCells.length} chữ</span></div>
            <div className="kana-grid">
              {groupCells.map((cell) => (
                <KnowledgeChipButton key={cell.contentKey} contentKey={cell.contentKey} className={`kana-c ${cellClass(cell)}`}
                  label={`${cell.character} (${cell.romaji}) — ${STATUS_PRESENTATION[cell.status].label}`}>
                  <span className="dot" style={{ background: STATUS_PRESENTATION[cell.status].color }} />
                  <span className="ch">{cell.character}</span>
                  <span className="ro">{cell.romaji}</span>
                </KnowledgeChipButton>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

/** Chọn chữ để luyện viết — mọi chữ đơn, không chỉ chữ được gợi ý. */
function WritingPicker({ choices, selected, onSelect }: { choices: KanaWritingChoice[]; selected: string; onSelect: (character: string) => void }) {
  return (
    <details className="card tight mb-3">
      <summary className="sm"><b>Chọn chữ khác để luyện</b> <span className="muted">· đang luyện {selected}</span></summary>
      <div className="writing-picker mt-2.5" role="radiogroup" aria-label="Chữ luyện viết">
        {choices.map((choice) => (
          <button key={choice.character} type="button" role="radio" aria-checked={choice.character === selected}
            className={`chip jp glyph ${choice.character === selected ? 'pink' : ''}`} onClick={() => onSelect(choice.character)}>
            {choice.character}
          </button>
        ))}
      </div>
    </details>
  );
}

/**
 * Màn Hiragana / Katakana với bốn thẻ — chuyển thẻ là trạng thái giao diện cục bộ.
 * `initialWriting` (từ ?viet=そ, nút "Luyện viết" ở trang chi tiết chữ) mở thẳng thẻ Luyện viết với chữ đó.
 */
export function KanaPractice({ data, initialWriting }: { data: KanaPracticeData; initialWriting?: string }) {
  const requested = data.writingChoices.find((choice) => choice.character === initialWriting);
  const [tab, setTab] = useState<TabId>(requested ? 'write' : 'learn');
  const [writing, setWriting] = useState<KanaWritingChoice>(requested ?? data.writing);
  return (
    <>
      <div className="pill-tabs" role="tablist" aria-label="Cách học">
        {TABS.map((option) => (
          <button key={option.id} type="button" role="tab" aria-selected={tab === option.id}
            className={`tab ${tab === option.id ? 'on' : ''}`} onClick={() => setTab(option.id)}>{option.label}</button>
        ))}
      </div>
      <div className="mt-3.5">
        {tab === 'learn' ? <KanaBoard cells={data.cells} /> : null}
        {tab === 'write' ? (
          <>
            <WritingPicker choices={data.writingChoices} selected={writing.character}
              onSelect={(character) => setWriting(data.writingChoices.find((choice) => choice.character === character) ?? writing)} />
            <WritingPad key={writing.character} character={writing.character} reading={writing.romaji} expectedStrokes={writing.strokes}
              note={writing.tip?.trim() ? `Mẹo nhớ: ${writing.tip}` : undefined} />
          </>
        ) : null}
        {tab === 'listen' ? <KanaListening cells={data.cells} /> : null}
      </div>
    </>
  );
}

const LISTENING_COUNT = 8;
const LISTENING_OPTIONS = 4;

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

/**
 * Luyện nghe chữ cái — chọn phạm vi (tất cả, từng nhóm, chữ đã học), KHÔNG cần học tới: nghe âm, chọn chữ.
 * Mỗi lần "Bài khác" là một bộ câu mới; phương án nhiễu lấy trong cùng phạm vi (あ/お, ぬ/め phải phân biệt thật).
 */
function KanaListening({ cells }: { cells: KanaCell[] }) {
  const learned = cells.filter((cell) => cell.status !== 'new');
  const ranges = [
    { id: 'all', label: 'Tất cả', cells },
    ...KANA_GROUPS.map((group) => ({ id: group.label, label: group.label, cells: cells.slice(group.from, group.to) })),
    ...(learned.length >= 2 ? [{ id: 'learned', label: `Đã học (${learned.length})`, cells: learned }] : []),
  ];
  const [rangeId, setRangeId] = useState('all');
  const [round, setRound] = useState(0);
  const range = ranges.find((option) => option.id === rangeId) ?? ranges[0];
  const [questions, setQuestions] = useState(() => buildListening(range.cells));

  function choose(id: string) {
    setRangeId(id);
    setQuestions(buildListening((ranges.find((option) => option.id === id) ?? ranges[0]).cells));
    setRound((value) => value + 1);
  }

  return (
    <>
      <div className="study-parts mb-3" role="radiogroup" aria-label="Phạm vi luyện nghe">
        {ranges.map((option) => (
          <button key={option.id} type="button" role="radio" aria-checked={option.id === range.id}
            className={`chip ${option.id === range.id ? 'pink' : ''}`} onClick={() => choose(option.id)}>{option.label}</button>
        ))}
      </div>
      <ScrollToElementOnChange targetId="kana-listening-quiz" trigger={rangeId} />
      <div id="kana-listening-quiz">
        <AssessmentQuiz key={round} title="Luyện nghe" description="Nghe âm, chọn chữ bạn nghe được. Cuối bài có điểm và nút làm lại."
          questions={questions} emptyMessage="Phần này chưa đủ chữ để luyện nghe." audioLabel="Nghe chữ Nhật" />
      </div>
      <p className="center mt-2.5">
        <button type="button" className="btn ghost sm" onClick={() => choose(range.id)}>↻ Bài khác</button>
      </p>
    </>
  );
}

function buildListening(pool: readonly KanaCell[]) {
  if (pool.length < 2) return [];
  return shuffled(pool).slice(0, LISTENING_COUNT).map((cell) => {
    const others = shuffled(pool.filter((other) => other.character !== cell.character)).slice(0, LISTENING_OPTIONS - 1);
    return { audioText: cell.character, answer: cell.character, options: shuffled([cell, ...others].map((option) => option.character)) };
  });
}
