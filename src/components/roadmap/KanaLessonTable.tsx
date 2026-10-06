import { KnowledgeChipButton } from '@/components/learning/KnowledgeChipButton';
import type { KanaLesson } from '@/features/roadmap/kana-lesson';

/** Bảng chữ cái của ngày: hàng âm / âm gốc → âm đục (kèm mẹo nhớ) / âm ghép. Chạm một chữ để xem kỹ và nghe. */
export function KanaLessonTable({ lesson }: { lesson: KanaLesson }) {
  return (
    <div className="kana-lesson">
      {lesson.kind === 'dakuten' ? (
        <div className="card tight kana-tip">
          <b className="sm">💡 Mẹo nhớ</b>
          <p className="sm soft mt-1">Thêm hai chấm nhỏ (が = か + <span className="jp">゛</span>) thì phụ âm “nặng” hơn; thêm vòng tròn nhỏ vào hàng は (ぱ = は + <span className="jp">゜</span>) thì thành P.</p>
          <ul className="kana-rules">
            {lesson.rows.map((row) => <li key={row.label}><b>{row.label.split(' → ')[0]} → {row.label.split(' → ')[1]}</b> {row.rule?.split('·')[1]?.trim()}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="kana-table" role="table" aria-label="Bảng chữ cái của ngày" data-reveal-stagger>
        {lesson.rows.map((row) => (
          <div key={row.label} className="kana-row" role="row">
            <span className="kana-row-label" role="rowheader">{row.label}</span>
            <div className="kana-cells">
              {row.cells.map((cell) => (
                <KnowledgeChipButton key={cell.item.key} contentKey={cell.item.key} className="kana-cell">
                  {cell.base ? <span className="kana-base jp">{cell.base} →</span> : null}
                  <span className="kana-face jp">{cell.item.face}</span>
                  <span className="kana-read">{cell.baseReading ? `${cell.baseReading} → ${cell.item.reading}` : cell.item.reading}</span>
                </KnowledgeChipButton>
              ))}
            </div>
          </div>
        ))}
      </div>
      {lesson.kind === 'dakuten' ? (
        <div className="card tight mt-2.5" style={{ background: 'var(--cream)', borderColor: 'transparent' }}>
          <b className="sm">⚠️ Cần nhớ riêng</b>
          <ul className="sm soft mt-1" style={{ paddingLeft: 18, listStyle: 'disc' }}>
            {lesson.exceptions.map((note) => <li key={note} className="jp-mixed">{note}</li>)}
          </ul>
        </div>
      ) : null}
      {lesson.kind === 'youon' ? (
        <p className="tiny muted mt-2">ゃ ゅ ょ viết NHỎ và đọc liền với chữ trước: き + ゃ → きゃ (kya), không phải “ki-ya”.</p>
      ) : null}
    </div>
  );
}
