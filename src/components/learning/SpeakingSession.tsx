'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ReadAloudPrompt } from './ReadAloudPrompt';
import { type SpeakingPosition, nextPosition, positionFromParam, previousPosition } from '@/features/speech/speaking-session';

export interface SpeakingSentence {
  id: number;
  lessonLabel: string;
  jp: string;
  reading: string;
  vi: string;
}

function writeUrl(position: SpeakingPosition) {
  const url = new URL(window.location.href);
  url.searchParams.delete('che-do'); // link cũ (?che-do=tu-goi-y | doc-theo-mau) vẫn mở được — chỉ còn một chế độ
  url.searchParams.set('cau', String(position.index + 1));
  window.history.replaceState(window.history.state, '', url);
}

/**
 * Luyện nói = ĐỌC THEO MẪU, mỗi lần một câu: nghe mẫu, đọc to, trình duyệt nhận diện rồi so chữ với câu mẫu (không chấm phát âm).
 * Chế độ "nói từ gợi ý tiếng Việt" đã bỏ — cùng bộ câu, chỉ thiếu nhận diện nên trùng với chế độ này.
 * Vị trí "3/10", Câu trước / Câu tiếp, màn kết thúc; URL ghi ?cau= để tải lại vẫn đúng chỗ. Không ghi trí nhớ.
 */
export function SpeakingSession({ sentences, initialSentence, otherSetHref }: {
  sentences: SpeakingSentence[];
  initialSentence?: string;
  /** "Câu khác" (bộ câu ngẫu nhiên khác) — không có khi đang luyện cả một bài. */
  otherSetHref: string | null;
}) {
  const [position, setPosition] = useState<SpeakingPosition>(() => positionFromParam(initialSentence, sentences.length));
  const total = sentences.length;
  const sentence = sentences[position.index];
  const otherHref = otherSetHref;

  useEffect(() => { writeUrl(position); }, [position]);

  if (!total) return <p className="card tight sm soft mt-3">Phạm vi này chưa có câu để luyện nói.</p>;

  return (
    <section aria-label="Luyện nói">
      <div style={{ margin: '10px 0 12px' }}>
        <p className="soft sm">Nghe mẫu, bấm 🎙️ rồi đọc to. Trình duyệt nhận diện câu bạn nói và so chữ với câu mẫu — đây <b>chưa phải chấm phát âm</b>.</p>
        <p className="tiny muted mt-1">
          Âm thanh do trình duyệt xử lý (Chrome gửi lên dịch vụ nhận diện trực tuyến của Google; Safari dùng bộ nhận diện của Siri).
          NekoNeko không ghi âm, không lưu và không gửi âm thanh lên máy chủ của mình.
        </p>
      </div>

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
          <ReadAloudPrompt key={sentence.id} lessonLabel={sentence.lessonLabel} sentenceJp={sentence.jp} reading={sentence.reading}
            meaningVi={sentence.vi} chipClass="pink" />
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
