import Link from 'next/link';
import { NokoMessage } from '@/components/common/NokoMessage';
import { ProgressBar } from '@/components/common/ProgressBar';
import { HealthRing } from '@/components/memory/HealthRing';
import { RadarList } from '@/components/memory/RadarItem';
import { getLearnerContext } from '@/features/learning/learner-context';
import { toKnowledgeListEntries } from '@/features/learning/knowledge-list';
import { LEARNED_STATUS_ORDER, STATUS_PRESENTATION } from '@/features/memory/memory-rules';
import { buildMemoryOverview, describeMemoryHealth, joinWithKnowledge, viewsWithStatus } from '@/features/memory/memory-overview';
import { percentOf } from '@/lib/utils/text';
import { EmojiIcon } from '@/components/common/EmojiIcon';

const SECTION_PREVIEW = 5;

/** SC-28 · Tổng quan trí nhớ — Neko Neko theo dõi từng thứ, người học không cần tự quản lý lịch ôn. */
export async function MemoryPanel() {
  const { catalog, memoryViews } = await getLearnerContext();
  const overview = buildMemoryOverview(memoryViews);
  const sectionEntries = (status: 'fading' | 'weak') =>
    toKnowledgeListEntries(joinWithKnowledge(catalog, viewsWithStatus(memoryViews, status).slice(0, SECTION_PREVIEW)).map((entry) => entry.item), memoryViews);

  return (
    <>
      <p className="soft sm" style={{ margin: '4px 0 14px' }}>
        Bạn không cần tự quản lý lịch ôn. Neko Neko theo dõi từng thứ và tự chọn cái cần gặp lại.
      </p>
      <div className="card">
        <div className="ringwrap">
          <HealthRing value={overview.health} />
          <div style={{ flex: 1 }}>
            <h3>Sức khoẻ trí nhớ</h3>
            <p className="sm soft mt-1">{describeMemoryHealth(overview.health)}</p>
            <p className="sm soft mt-2">
              {overview.needsAttentionCount > 0 ? (
                <><b style={{ color: 'var(--sakura-deep)' }}>{overview.needsAttentionCount} kiến thức</b> đang đến lúc nên gặp lại.</>
              ) : 'Hiện tại chưa có gì cần cứu 🌸'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', margin: '16px 0 12px' }} aria-hidden="true">
          {LEARNED_STATUS_ORDER.map((status) => (
            <span key={status} style={{ width: `${percentOf(overview.counts[status], overview.learnedCount)}%`, background: STATUS_PRESENTATION[status].color }} />
          ))}
        </div>
        <div className="row wrap" style={{ gap: 7 }}>
          {LEARNED_STATUS_ORDER.map((status) => (
            <span key={status} className="chip" style={{ background: STATUS_PRESENTATION[status].background, color: STATUS_PRESENTATION[status].color }}>
              <EmojiIcon emoji={STATUS_PRESENTATION[status].emoji} size={16} /> {STATUS_PRESENTATION[status].label} {overview.counts[status]}
            </span>
          ))}
          <span className="chip"><EmojiIcon emoji="🫧" size={16} /> Chưa học {overview.notLearnedCount}</span>
        </div>
        {overview.needsAttentionCount > 0 ? (
          <Link className="btn block mt-3.5" href="/tri-nho/sap-quen">🧠 Xem {overview.needsAttentionCount} thứ sắp quên</Link>
        ) : null}
      </div>

      <details className="card tight mt-3.5 memory-explain">
        <summary><b className="sm">Trí nhớ của bạn được tính thế nào?</b></summary>
        <ul className="sm mt-2" style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 6 }}>
          <li>🟢 <b>Nhớ tốt</b> — gọi ra được dễ dàng, lâu lâu mới cần gặp lại.</li>
          <li>🟡 <b>Nên ôn lại</b> — đang nhớ nhưng còn lung lay, hoặc vừa mới học.</li>
          <li>🔴 <b>Đang quên</b> — lâu rồi chưa gặp lại, hoặc trả lời sai gần đây.</li>
        </ul>
        <p className="sm soft mt-2.5">Neko dựa vào:</p>
        <ul className="sm soft mt-1" style={{ paddingLeft: 18, listStyle: 'disc' }}>
          <li>những lần bạn trả lời đúng hay sai;</li>
          <li>bạn học và gặp lại nó lúc nào — càng lâu không gặp càng dễ quên;</li>
          <li>số lần bạn đã gặp lại nó;</li>
          <li>kết quả luyện tập (luyện nghe, tự kiểm tra, nghe – gõ).</li>
        </ul>
        <p className="sm soft mt-2">Bạn không cần nhớ lịch ôn — Neko tự đưa đúng thứ sắp quên vào phần “Gặp lại” mỗi ngày.</p>
      </details>

      <NokoMessage state="forgotten" className="mt-3.5"
        text={`Mình đang để mắt tới ${overview.needsAttentionCount} thứ. Khi nào bạn rảnh, ghé cứu vài cái thôi cũng được.`} />

      <div className="sec-h"><h2>Theo loại kiến thức</h2></div>
      <div className="grid two">
        {overview.byType.map((summary) => (
          <div key={summary.type} className="card tight">
            <div className="between"><b className="sm">{summary.label}</b><span className="tiny muted">{summary.learned}/{summary.total}</span></div>
            <ProgressBar percent={summary.averageScore} variant="thin-mint" label={`Sức nhớ trung bình ${summary.label}`} className="my-2" />
            <span className="tiny muted">Sức nhớ trung bình {summary.averageScore}/100</span>
          </div>
        ))}
      </div>

      <div className="sec-h"><h2>Sắp quên</h2><Link className="link" href="/tri-nho/sap-quen">Xem tất cả →</Link></div>
      <RadarList entries={sectionEntries('fading')} emptyText="Không có gì sắp quên 🌸" />
      <div className="sec-h"><h2>Chưa vững</h2><Link className="link" href="/tri-nho/chua-vung">Xem tất cả →</Link></div>
      <RadarList entries={sectionEntries('weak')} emptyText="Không có gì chưa vững." />
    </>
  );
}
