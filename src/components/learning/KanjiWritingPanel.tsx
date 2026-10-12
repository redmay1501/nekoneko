'use client';

import { useState } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { RangePicker } from './RangePicker';
import { WritingPad } from './WritingPad';

export interface WritingKanji {
  id: number;
  character: string;
  hanViet: string;
  meaning: string;
  strokes: number | null;
  onReading: string;
  kunReading: string;
  tip: string;
}

/** Viết tay Kanji: chọn nhóm 10 chữ rồi chọn chữ — đổi ngay trong trình duyệt (mọi chữ đã có sẵn), URL ghi ?chu=<id>. */
export function KanjiWritingPanel({ kanji, groups, initialId }: {
  kanji: WritingKanji[];
  groups: Array<{ id: string; label: string; ids: number[] }>;
  initialId: number;
}) {
  const [focusId, setFocusId] = useState(initialId);
  const focus = kanji.find((item) => item.id === focusId) ?? kanji[0];
  const group = groups.find((candidate) => candidate.ids.includes(focus.id)) ?? groups[0];
  const byId = new Map(kanji.map((item) => [item.id, item]));

  function focusOn(id: number) {
    setFocusId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('chu', String(id));
    url.searchParams.delete('nhom');
    window.history.replaceState(window.history.state, '', url);
  }

  return (
    <>
      <RangePicker title="Nhóm Kanji" current={group.id} param="nhom"
        onSelect={(id) => focusOn((groups.find((candidate) => candidate.id === id) ?? groups[0]).ids[0])}
        options={groups.map((candidate) => ({ id: candidate.id, label: candidate.label, caption: `${byId.get(candidate.ids[0])?.character ?? ''}…`, group: 'Mỗi nhóm 10 chữ' }))} />
      <div className="row wrap mb-3.5" style={{ gap: 7 }} role="radiogroup" aria-label="Chọn chữ để viết">
        {group.ids.map((id) => {
          const item = byId.get(id);
          if (!item) return null;
          return (
            <button key={id} type="button" role="radio" aria-checked={id === focus.id} onClick={() => focusOn(id)}
              className={`chip jp glyph ${id === focus.id ? 'pink' : ''}`} style={{ fontSize: 18, padding: '9px 13px' }}>
              {item.character}
            </button>
          );
        })}
      </div>
      <div className="card tight mb-3.5">
        <div className="row">
          <span className="jp glyph" style={{ fontSize: 34 }}>{focus.character}</span>
          <div style={{ flex: 1 }}>
            <b>{focus.hanViet} · {focus.meaning}</b>
            <div className="tiny muted">{focus.strokes} nét · {focus.onReading}・{focus.kunReading || '—'}</div>
          </div>
          <AudioButton text={focus.kunReading || focus.onReading || focus.character} />
        </div>
      </div>
      <WritingPad key={focus.character} character={focus.character} reading={focus.kunReading || focus.onReading}
        expectedStrokes={focus.strokes ?? undefined} note={focus.tip} />
    </>
  );
}
