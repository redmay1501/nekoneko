'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { canRecord, canRunOnDeviceAsr } from '@/lib/speech/recorder';
import { OnDeviceReadAloud } from './OnDeviceReadAloud';
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
export function SpeakingSession({ sentences, initialSentence, otherSetHref, kanaDictionary = [] }: {
  sentences: SpeakingSentence[];
  /** Dạng viết ↔ kana của kho từ vựng — so bản nhận diện viết bằng Kanji với mẫu viết bằng kana. */
  kanaDictionary?: Array<[string, string]>;
  initialSentence?: string;
  /** "Câu khác" (bộ câu ngẫu nhiên khác) — không có khi đang luyện cả một bài. */
  otherSetHref: string | null;
}) {
  const [position, setPosition] = useState<SpeakingPosition>(() => positionFromParam(initialSentence, sentences.length));
  /** Cách nhận diện: AI trên máy (mặc định khi thiết bị chạy được) hoặc nhận diện của trình duyệt (dự phòng). */
  const [engine, setEngine] = useState<'device' | 'browser' | null>(null);
  const [isDeviceCapable, setIsDeviceCapable] = useState(false);
  useEffect(() => {
    const capable = canRunOnDeviceAsr() && canRecord();
    setIsDeviceCapable(capable);
    setEngine(capable ? 'device' : 'browser');
  }, []);
  const total = sentences.length;
  const sentence = sentences[position.index];
  const otherHref = otherSetHref;

  useEffect(() => { writeUrl(position); }, [position]);

  if (!total) return <p className="card tight sm soft mt-3">Phạm vi này chưa có câu để luyện nói.</p>;

  return (
    <section aria-label="Luyện nói">
      <div style={{ margin: '10px 0 12px' }}>
        <p className="soft sm">Nghe mẫu, ghi âm rồi đọc to. Neko nhận diện lời bạn đọc và so chữ với mẫu — đây <b>chưa phải chấm phát âm</b>.</p>
        {isDeviceCapable ? (
          <div className="segmented mt-2" role="radiogroup" aria-label="Cách nhận diện giọng nói">
            <button type="button" role="radio" aria-checked={engine === 'device'} className={`segmented-option${engine === 'device' ? ' is-selected' : ''}`} onClick={() => setEngine('device')}>🧠 AI trên máy</button>
            <button type="button" role="radio" aria-checked={engine === 'browser'} className={`segmented-option${engine === 'browser' ? ' is-selected' : ''}`} onClick={() => setEngine('browser')}>🌐 Nhận diện của trình duyệt</button>
          </div>
        ) : null}
        <p className="tiny muted mt-1.5">
          {engine === 'device'
            ? 'AI trên máy: mô hình Whisper chạy ngay trong trình duyệt — bản ghi không rời thiết bị, không được lưu; nghe lại được bản ghi của mình.'
            : 'Nhận diện của trình duyệt: Chrome gửi âm thanh lên dịch vụ nhận diện của Google, Safari dùng bộ nhận diện của Apple. NekoNeko không lưu âm thanh.'}
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
          {engine === 'device' ? (
            <OnDeviceReadAloud key={`d:${sentence.id}`} lessonLabel={sentence.lessonLabel} sentenceJp={sentence.jp} reading={sentence.reading}
              meaningVi={sentence.vi} chipClass="pink" kanaDictionary={kanaDictionary} />
          ) : engine === 'browser' ? (
            <ReadAloudPrompt key={`b:${sentence.id}`} lessonLabel={sentence.lessonLabel} sentenceJp={sentence.jp} reading={sentence.reading}
              meaningVi={sentence.vi} chipClass="pink" />
          ) : <div className="card mb-3" style={{ minHeight: 220 }} aria-hidden="true" />}
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
