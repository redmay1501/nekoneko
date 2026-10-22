'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import type { GrammarContent } from '@/types/content';
import type { MemoryStatus } from '@/features/memory/memory-types';
import { lessonNumber } from '@/lib/utils/lesson';
import { hasKana, patternRomaji, sentenceRomaji } from '@/lib/utils/romaji';
import { AudioButton } from '@/components/common/AudioButton';

export interface GrammarNotebookItem {
  grammar: GrammarContent;
  status: MemoryStatus;
}

const STATUS_LABEL: Record<MemoryStatus, string> = {
  new: 'Chưa học', weak: 'Cần ôn', fading: 'Sắp quên', learning: 'Đang học', strong: 'Đã nhớ', mastered: 'Đã thuộc',
};

export function GrammarNotebook({ items, learned, total }: { items: GrammarNotebookItem[]; learned: number; total: number }) {
  const [selectedId, setSelectedId] = useState(items[0]?.grammar.id ?? 0);
  const [rightTab, setRightTab] = useState<'examples' | 'practice'>('examples');
  const [headerHost, setHeaderHost] = useState<HTMLElement | null>(null);
  const [openLessons, setOpenLessons] = useState<Set<string>>(() => new Set(items[0] ? [items[0].grammar.lesson] : []));
  const selectedIndex = Math.max(0, items.findIndex((item) => item.grammar.id === selectedId));
  const selected = items[selectedIndex];
  const groups = useMemo(() => {
    const map = new Map<string, GrammarNotebookItem[]>();
    for (const item of items) map.set(item.grammar.lesson, [...(map.get(item.grammar.lesson) ?? []), item]);
    return [...map.entries()].sort(([a], [b]) => lessonNumber(a) - lessonNumber(b));
  }, [items]);

  useEffect(() => {
    setHeaderHost(document.querySelector<HTMLElement>('.topbar-knowledge-slot'));
  }, []);

  if (!selected) return <p className="grammar-empty">Chưa có mẫu ngữ pháp để hiển thị.</p>;

  function select(id: number, lesson: string) {
    setSelectedId(id);
    setRightTab('examples');
    setOpenLessons((current) => new Set(current).add(lesson));
  }
  function move(offset: number) {
    const next = Math.min(items.length - 1, Math.max(0, selectedIndex + offset));
    const item = items[next];
    if (item) select(item.grammar.id, item.grammar.lesson);
  }

  return (
    <section className="grammar-notebook" aria-label="Sổ tay ngữ pháp N5">
      {headerHost ? createPortal(<div className="grammar-header-content">
        <div className="grammar-header-title"><span className="grammar-eyebrow">SỔ TAY</span><strong>Ngữ pháp N5</strong><span className="grammar-header-count">{learned}/{total}</span></div>
      </div>, headerHost) : null}

      <div className="grammar-workspace">
        <aside className="grammar-lessons" aria-label="Danh sách bài học">
          <div className="grammar-lessons-heading"><div><b>Các bài học</b><span>{groups.reduce((count, [, rows]) => count + rows.length, 0)} mẫu câu</span></div></div>
          <div className="grammar-lessons-list">
            {groups.map(([lesson, rows]) => {
              const open = openLessons.has(lesson);
              const done = rows.filter(({ status }) => status === 'strong' || status === 'mastered').length;
              return <section className={`grammar-lesson${open ? ' is-open' : ''}`} key={lesson}>
                <button type="button" className="grammar-lesson-toggle" aria-expanded={open} onClick={() => setOpenLessons((current) => {
                  const next = new Set(current); if (next.has(lesson)) next.delete(lesson); else next.add(lesson); return next;
                })}>
                  <span className="grammar-lesson-number">{String(lessonNumber(lesson) || '•').padStart(2, '0')}</span>
                  <span className="grammar-lesson-name"><b>{lesson}</b><small>{rows.length} mẫu · {done} đã nhớ</small></span><span className="grammar-lesson-chevron">⌄</span>
                </button>
                {open ? <div className="grammar-pattern-list">{rows.map(({ grammar, status }, index) => <button type="button" key={grammar.id} className={`grammar-pattern${grammar.id === selected.grammar.id ? ' is-current' : ''}`} aria-current={grammar.id === selected.grammar.id ? 'true' : undefined} onClick={() => select(grammar.id, lesson)}>
                  <span className={`grammar-status status-${status}`} title={STATUS_LABEL[status]} aria-label={STATUS_LABEL[status]} />
                  <span><b lang="ja">{grammar.pattern}</b><small>{patternRomaji(grammar.pattern) || grammar.usage}</small></span><small className="grammar-pattern-index">{index + 1}</small>
                </button>)}</div> : null}
              </section>;
            })}
          </div>
        </aside>

        <section className="grammar-book" aria-label={`Mẫu ${selected.grammar.pattern}`}>
          <div className="grammar-book-binding" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="grammar-spread">
            <article className="grammar-page grammar-page-formula">
              <div className="grammar-page-inner">
                <div className="grammar-page-kicker"><span>BÀI {String(lessonNumber(selected.grammar.lesson)).padStart(2, '0')}</span><span className={`grammar-status-label status-${selected.status}`}>{STATUS_LABEL[selected.status]}</span></div>
                <h2 lang="ja">{selected.grammar.pattern}</h2>
                {patternRomaji(selected.grammar.pattern) ? <p className="grammar-pattern-reading">{patternRomaji(selected.grammar.pattern)}</p> : null}
                <div className="grammar-paper-rule" />
                <h3><span>✿</span> Cách dùng</h3>
                <p className="grammar-usage">{selected.grammar.usage}</p>
                {selected.grammar.whenToUse ? <div className="grammar-when"><b>Khi nào dùng?</b><p>{selected.grammar.whenToUse}</p></div> : null}
                {selected.grammar.commonMistake ? <div className="grammar-when grammar-common-mistake"><b>Lỗi thường gặp</b><p>{selected.grammar.commonMistake}</p></div> : null}
              </div>
            </article>

            <article className="grammar-page grammar-page-content">
              <div className="grammar-tabs" role="tablist" aria-label="Ví dụ và luyện tập">
                <button type="button" role="tab" id="grammar-tab-examples" aria-selected={rightTab === 'examples'} aria-controls="grammar-tab-panel" onClick={() => setRightTab('examples')}>Ví dụ</button>
                <button type="button" role="tab" id="grammar-tab-practice" aria-selected={rightTab === 'practice'} aria-controls="grammar-tab-panel" onClick={() => setRightTab('practice')}>Luyện tập</button>
              </div>
              <div className="grammar-panel" id="grammar-tab-panel" role="tabpanel" aria-labelledby={`grammar-tab-${rightTab}`} key={rightTab}>
                {rightTab === 'examples' ? <>
                  <h3 className="grammar-section-title">Gặp trong câu</h3>
                  <GrammarExample japanese={selected.grammar.exampleJp} reading={selected.grammar.exampleReading} vietnamese={selected.grammar.exampleVi} numbered />
                  {selected.grammar.example2Jp ? <GrammarExample japanese={selected.grammar.example2Jp} reading={selected.grammar.example2Reading} vietnamese={selected.grammar.example2Vi} numbered number={2} /> : null}
                </> : <div className="grammar-practice-box">
                  <h3 className="grammar-section-title">Luyện tập mẫu này</h3>
                  <p>Ôn lại mẫu câu qua câu hỏi dựa trên ví dụ và nội dung của bài.</p>
                  <Link className="grammar-practice-link primary" href={`/hoc-tap/ngu-phap/luyen-tap?mau=${selected.grammar.id}`}>Luyện tập mẫu này <span>→</span></Link>
                  <Link className="grammar-practice-link" href={`/hoc-tap/ngu-phap/bai-tap?mau=${selected.grammar.id}`}>Bài tập luyện tập <span>→</span></Link>
                </div>}
              </div>
            </article>
          </div>
          <footer className="grammar-book-footer">
            <button type="button" onClick={() => move(-1)} disabled={selectedIndex === 0} aria-label="Mẫu trước">‹ <span>Mẫu trước</span></button>
            <span className="grammar-counter">{selectedIndex + 1} <i>/</i> {items.length}</span>
            <button type="button" onClick={() => move(1)} disabled={selectedIndex === items.length - 1} aria-label="Mẫu tiếp theo"><span>Mẫu tiếp</span> ›</button>
          </footer>
        </section>
      </div>
    </section>
  );
}

function GrammarExample({ japanese, reading, vietnamese, numbered = false, number = 1 }: { japanese: string; reading: string; vietnamese: string; numbered?: boolean; number?: number }) {
  if (!japanese) return null;
  return <article className="grammar-example-card">
    {numbered ? <span className="grammar-example-number">{String(number).padStart(2, '0')}</span> : null}
    <div>
      <p lang="ja">{japanese}</p>
      {reading && reading !== japanese ? <small lang="ja">{reading}</small> : null}
      {hasKana(reading || japanese) ? <em className="grammar-example-romaji">{sentenceRomaji(reading || japanese)}</em> : null}
      <p>{vietnamese}</p>
    </div>
    <AudioButton text={japanese} label="Nghe câu ví dụ" />
  </article>;
}
