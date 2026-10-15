'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ReadAloudPrompt } from './ReadAloudPrompt';
import { SpeakingPrompt } from './SpeakingPrompt';
import { type SpeakingPosition, nextPosition, positionFromParam, previousPosition } from '@/features/speech/speaking-session';

export interface SpeakingSentence {
  id: number;
  lessonLabel: string;
  jp: string;
  reading: string;
  vi: string;
}

export const SPEAKING_MODES = [
  { id: 'tu-goi-y', label: '🗣️ Nói tiếng Nhật từ gợi ý tiếng Việt' },
  { id: 'doc-theo-mau', label: '🎙️ Đọc theo mẫu' },
] as const;
export type SpeakingMode = (typeof SPEAKING_MODES)[number]['id'];

function writeUrl(mode: SpeakingMode, position: SpeakingPosition) {
  const url = new URL(window.location.href);
  url.searchParams.set('che-do', mode);
  url.searchParams.set('cau', String(position.index + 1));
  window.history.replaceState(window.history.state, '', url);
}

/**
 * Luyện nói MỖI LẦN MỘT CÂU: vị trí "3/10", Câu trước / Câu tiếp, màn kết thúc. Không tự chuyển câu.
 * Đổi chế độ ngay trong trang (giữ câu đang luyện); URL ghi lại ?che-do=&cau= để tải lại vẫn đúng chỗ.
 */
export function SpeakingSession({ sentences, initialMode, initialSentence, otherSetHref }: {
  sentences: SpeakingSentence[];
  initialMode: SpeakingMode;
  initialSentence?: string;
  /** "Câu khác" (bộ câu ngẫu nhiên khác) — không có khi đang luyện cả một bài. */
  otherSetHref: string | null;
}) {
  const [mode, setMode] = useState<SpeakingMode>(initialMode);
  const [position, setPosition] = useState<SpeakingPosition>(() => positionFromParam(initialSentence, sentences.length));
  const total = sentences.length;
  const sentence = sentences[position.index];
  // Link do server dựng theo chế độ lúc tải trang → thay bằng chế độ đang chọn.
  const otherHref = otherSetHref ? otherSetHref.replace(/che-do=[^&]*/, `che-do=${mode}`) : null;

  useEffect(() => { writeUrl(mode, position); }, [mode, position]);

  if (!total) return <p className="card tight sm soft mt-3">Phạm vi này chưa có câu để luyện nói.</p>;

  return (
    <section aria-label="Luyện nói">
      <div className="pill-tabs mt-2" role="tablist" aria-label="Chế độ luyện nói">
        {SPEAKING_MODES.map((option) => (
          <button key={option.id} type="button" role="tab" aria-selected={option.id === mode} className={`tab ${option.id === mode ? 'on' : ''}`}
            onClick={() => setMode(option.id)}>{option.label}</button>
        ))}
      </div>
      {mode === 'tu-goi-y' ? (
        <p className="soft sm" style={{ margin: '10px 0 12px' }}>Đọc câu tiếng Việt, tự nói câu tiếng Nhật tương ứng thành tiếng, rồi mới xem đáp án.</p>
      ) : (
        <div style={{ margin: '10px 0 12px' }}>
          <p className="soft sm">Nghe mẫu, bấm 🎙️ rồi đọc to. Trình duyệt nhận diện câu bạn nói và so chữ với câu mẫu — đây <b>chưa phải chấm phát âm</b>.</p>
          <p className="tiny muted mt-1">
            Âm thanh do trình duyệt xử lý (Chrome gửi lên dịch vụ nhận diện trực tuyến của Google; Safari dùng bộ nhận diện của Siri).
            NekoNeko không ghi âm, không lưu và không gửi âm thanh lên máy chủ của mình.
          </p>
        </div>
      )}

      {position.isFinished ? (
        <div className="card center speaking-done">
          <p className="chip mint">Xong {total} câu</p>
          <p className="mt-2">Bạn đã luyện hết các câu của lượt này.</p>
          <div className="row wrap mt-3" style={{ gap: 8, justifyContent: 'center' }}>
            <button type="button" className="btn ghost" onClick={() => setPosition({ index: 0, isFinished: false })}>↻ Luyện lại từ câu 1</button>
            {otherHref ? <Link className="btn" href={otherHref} scroll={false}>Bộ câu khác →</Link> : null}
          </div>
        </div>
      ) : (
        <>
          <div className="between speaking-progress">
            <span className="sm"><b>{position.index + 1}</b>/{total}</span>
            <div className="study-progress" style={{ flex: 1, marginTop: 0 }} aria-hidden="true"><span style={{ width: `${((position.index + 1) / total) * 100}%` }} /></div>
          </div>
          {mode === 'tu-goi-y' ? (
            <SpeakingPrompt key={`${mode}:${sentence.id}`} lessonLabel={sentence.lessonLabel} promptVi={sentence.vi} answerJp={sentence.jp} chipClass="pink" />
          ) : (
            <ReadAloudPrompt key={`${mode}:${sentence.id}`} lessonLabel={sentence.lessonLabel} sentenceJp={sentence.jp} reading={sentence.reading}
              meaningVi={sentence.vi} chipClass="pink" />
          )}
          <div className="speaking-nav">
            <button type="button" className="btn ghost" onClick={() => setPosition(previousPosition(position))} disabled={position.index === 0}>← Câu trước</button>
            <button type="button" className="btn" onClick={() => setPosition(nextPosition(position, total))}>
              {position.index + 1 === total ? 'Xong ✓' : 'Câu tiếp →'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
