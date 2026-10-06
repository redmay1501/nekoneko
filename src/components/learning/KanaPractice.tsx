'use client';

import { useState } from 'react';
import { KANA_GROUPS } from '@/features/learning/knowledge-filters';
import type { KanaCell, KanaPracticeData } from '@/features/learning/kana-practice';
import { STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { AssessmentQuiz } from './AssessmentQuiz';
import { KnowledgeChipButton } from './KnowledgeChipButton';
import { WritingPad } from './WritingPad';

const TABS = [
  { id: 'learn', label: 'Học' },
  { id: 'write', label: 'Luyện viết' },
  { id: 'listen', label: 'Luyện nghe' },
  { id: 'quiz', label: 'Kiểm tra' },
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

/** Màn Hiragana / Katakana với bốn thẻ — chuyển thẻ là trạng thái giao diện cục bộ. */
export function KanaPractice({ data }: { data: KanaPracticeData }) {
  const [tab, setTab] = useState<TabId>('learn');
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
        {tab === 'write' ? <WritingPad character={data.writing.character} reading={data.writing.romaji} expectedStrokes={data.writing.strokes}
          note={data.writing.tip?.trim() ? `Mẹo nhớ: ${data.writing.tip}` : undefined} /> : null}
        {tab === 'listen' ? (
          <AssessmentQuiz title="Luyện nghe" description="Nghe âm, chọn chữ bạn nghe được. Cuối bài sẽ có điểm và nút làm lại."
            questions={data.listening.map((question) => ({ audioText: question.character, answer: question.answer, options: question.options }))}
            emptyMessage="Học ít nhất hai chữ trong bảng trước, rồi Neko sẽ tạo bài nghe từ những chữ đó." audioLabel="Nghe chữ Nhật" />
        ) : null}
        {tab === 'quiz' ? (
          <AssessmentQuiz title="Kiểm tra" description="Nhìn chữ đã học và chọn cách đọc. Làm xong xem kết quả hoặc thử lại."
            questions={data.quiz.map((question) => ({ prompt: question.character, promptIsJapanese: true, answer: question.answer, options: question.options }))}
            emptyMessage="Học ít nhất hai chữ trong bảng trước; bài kiểm tra sẽ chỉ lấy chữ bạn đã học." />
        ) : null}
      </div>
    </>
  );
}
