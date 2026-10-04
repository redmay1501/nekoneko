import {
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonPageHeader,
  SkeletonPillTabs,
  SkeletonScreen,
  SkeletonText,
  SkeletonTileCard,
} from './Skeleton';

/**
 * Bộ khung từng loại màn hình — dùng trong các file loading.tsx.
 * Mỗi bộ khung bắt chước bố cục của màn hình thật để người học thấy ngay "đang mở đúng chỗ, đang tải".
 */

const repeat = (count: number) => Array.from({ length: count }, (_, index) => index);

/** Trang chủ (bảng điều khiển): lời chào · Học hôm nay + Gặp lại · 5 kiểu học · lộ trình + tiến bộ. */
export function HomeSkeleton() {
  return (
    <SkeletonScreen label="Đang mở trang chủ…">
      <div className="dash">
        <div className="dash-hero">
          <Skeleton width={260} height={34} radius={12} />
          <Skeleton width={300} height={14} radius={6} className="mt-3" />
          <Skeleton width={340} height={46} radius={20} className="mt-4" />
        </div>
        <div className="dash-top">
          <Skeleton height={190} radius={26} />
          <Skeleton height={190} radius={26} />
        </div>
        <div className="dash-modes">
          {repeat(5).map((index) => <Skeleton key={index} height={68} radius={20} />)}
        </div>
        <div className="dash-lower">
          <div className="dash-col"><Skeleton height={230} radius={26} /><Skeleton height={170} radius={26} /></div>
          <div className="dash-col"><Skeleton height={260} radius={26} /><Skeleton height={120} radius={26} /></div>
        </div>
      </div>
    </SkeletonScreen>
  );
}

/** Màn hình dạng "tiêu đề + lưới thẻ" (Học tập, Luyện tập, Thành tích…). */
export function CardGridSkeleton({ label, cards = 6, hasChip = false }: { label: string; cards?: number; hasChip?: boolean }) {
  return (
    <SkeletonScreen label={label}>
      <SkeletonPageHeader hasChip={hasChip} />
      <div className="grid two">
        {repeat(cards).map((index) => <SkeletonTileCard key={index} />)}
      </div>
    </SkeletonScreen>
  );
}

/** Kho kiến thức dạng danh sách (Kanji, Từ vựng, Ngữ pháp, Bộ thủ, Sắp quên…). */
export function KnowledgeListSkeleton({ label, hasFilters = true, rows = 9 }: { label: string; hasFilters?: boolean; rows?: number }) {
  return (
    <SkeletonScreen label={label}>
      <SkeletonPageHeader hasChip />
      {hasFilters ? <SkeletonPillTabs count={5} /> : null}
      <div className="mt-3"><SkeletonList rows={rows} isGrid /></div>
    </SkeletonScreen>
  );
}

/** Bảng chữ Hiragana / Katakana. */
export function KanaGridSkeleton({ label }: { label: string }) {
  return (
    <SkeletonScreen label={label}>
      <SkeletonPageHeader hasChip />
      <SkeletonPillTabs count={3} />
      <div className="mt-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {repeat(25).map((index) => <Skeleton key={index} height={64} radius="var(--r-m)" />)}
      </div>
    </SkeletonScreen>
  );
}

/** Chi tiết một kiến thức (Kanji, Từ vựng, Ngữ pháp, Bộ thủ) — cả trang lẫn khay trượt. */
export function KnowledgeDetailBodySkeleton() {
  return (
    <>
      <div className="row" style={{ gap: 16 }}>
        <Skeleton width={88} height={88} radius={22} />
        <span className="stack" style={{ flex: 1, gap: 8 }}>
          <Skeleton width="50%" height={20} radius={8} />
          <Skeleton width="70%" height={13} radius={6} />
          <Skeleton width={110} height={24} radius={999} />
        </span>
      </div>
      <SkeletonText lines={3} className="mt-4" />
      <Skeleton width="35%" height={16} radius={8} className="mt-4" />
      <div className="stack mt-2.5" style={{ gap: 8 }}>
        {repeat(2).map((index) => <Skeleton key={index} height={54} radius="var(--r-m)" />)}
      </div>
    </>
  );
}

export function KnowledgeDetailSkeleton() {
  return (
    <SkeletonScreen label="Đang mở chi tiết kiến thức…">
      <div className="session">
        <Skeleton width={90} height={16} radius={6} />
        <SkeletonCard className="mt-2"><KnowledgeDetailBodySkeleton /></SkeletonCard>
      </div>
    </SkeletonScreen>
  );
}

/** Lộ trình 90 ngày: tiêu đề · bản đồ · bốn chặng. */
export function RoadmapSkeleton() {
  return (
    <SkeletonScreen label="Đang mở lộ trình…">
      <SkeletonPageHeader hasChip descriptionLines={2} />
      <Skeleton height={520} radius="var(--r-l)" style={{ maxWidth: 560, margin: '0 auto' }} />
      <Skeleton width={180} height={20} radius={8} className="mt-5 mb-3" />
      <div className="grid two">
        {repeat(4).map((index) => <SkeletonTileCard key={index} />)}
      </div>
    </SkeletonScreen>
  );
}

/** Một ngày học: dải ngày · thẻ ngày · kiến thức + dòng thời gian. */
export function JourneyDaySkeleton() {
  return (
    <SkeletonScreen label="Đang mở ngày học…">
      <Skeleton width={90} height={16} radius={6} />
      <div className="daystrip mt-2">
        {repeat(9).map((index) => <Skeleton key={index} width={52} height={50} radius={14} style={{ flex: '0 0 auto' }} />)}
      </div>
      <Skeleton height={170} radius="var(--r-l)" className="mt-1" />
      <div className="daygrid mt-4">
        <div>
          <Skeleton width="50%" height={20} radius={8} className="mb-3" />
          <div className="stack" style={{ gap: 9 }}>
            {repeat(4).map((index) => <Skeleton key={index} height={62} radius="var(--r-m)" />)}
          </div>
        </div>
        <div className="mt-4 xl:mt-0">
          <SkeletonCard>
            {repeat(5).map((index) => (
              <div key={index} className="row" style={{ marginTop: index ? 14 : 0 }}>
                <Skeleton width={30} height={30} radius={999} />
                <span style={{ flex: 1 }}><SkeletonText lines={2} lineHeight={11} /></span>
              </div>
            ))}
          </SkeletonCard>
        </div>
      </div>
      <Skeleton height={48} radius={999} className="mt-4" />
    </SkeletonScreen>
  );
}

/** Tổng quan trí nhớ: vòng sức khoẻ · theo loại · danh sách. */
export function MemoryOverviewSkeleton() {
  return (
    <SkeletonScreen label="Đang mở trí nhớ…">
      <SkeletonPageHeader />
      <SkeletonCard>
        <div className="ringwrap">
          <Skeleton width={110} height={110} radius={999} />
          <span style={{ flex: 1 }}>
            <Skeleton width="60%" height={18} radius={8} />
            <SkeletonText lines={2} className="mt-2.5" />
          </span>
        </div>
        <Skeleton height={14} radius={999} className="mt-4" />
        <div className="row wrap mt-3" style={{ gap: 7 }}>
          {repeat(5).map((index) => <Skeleton key={index} width={84} height={26} radius={999} />)}
        </div>
      </SkeletonCard>
      <Skeleton width={200} height={20} radius={8} className="mt-5 mb-3" />
      <div className="grid two">
        {repeat(4).map((index) => <SkeletonTileCard key={index} hasProgress />)}
      </div>
      <Skeleton width={120} height={20} radius={8} className="mt-5 mb-3" />
      <SkeletonList rows={3} />
    </SkeletonScreen>
  );
}

/** Phiên học / luồng cứu kiến thức: thanh trên · tiến độ · thẻ câu hỏi · lựa chọn. */
export function SessionSkeleton({ label = 'Noko đang chọn bài cho bạn…' }: { label?: string }) {
  return (
    <SkeletonScreen label={label}>
      <div className="session">
        <div className="between mb-3">
          <Skeleton width={70} height={16} radius={6} />
          <Skeleton width={120} height={26} radius={999} />
        </div>
        <Skeleton height={6} radius={999} className="mb-3" />
        <SessionCardSkeleton />
      </div>
    </SkeletonScreen>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="s-card">
      <Skeleton width={130} height={26} radius={999} style={{ margin: '0 auto' }} />
      <Skeleton width={110} height={64} radius={16} style={{ margin: '18px auto 8px' }} />
      <Skeleton width="55%" height={13} radius={6} style={{ margin: '0 auto' }} />
      <div className="s-opt">
        {repeat(4).map((index) => <Skeleton key={index} height={52} radius={16} />)}
      </div>
    </div>
  );
}

/** Màn hình kết thúc phiên (Khoảnh khắc tiến bộ, Nghỉ một chút). */
export function SessionResultSkeleton({ label }: { label: string }) {
  return (
    <SkeletonScreen label={label}>
      <div className="session center">
        <Skeleton width={96} height={96} radius={999} style={{ margin: '10px auto 0' }} />
        <Skeleton width="60%" height={24} radius={8} style={{ margin: '14px auto 0' }} />
        <Skeleton width="80%" height={13} radius={6} style={{ margin: '10px auto 0' }} />
        <Skeleton height={150} radius="var(--r-l)" className="mt-4" />
        <Skeleton height={48} radius={999} className="mt-4" />
      </div>
    </SkeletonScreen>
  );
}

/** Vườn tri thức: ô vườn · nhóm cây. */
export function GardenSkeleton() {
  return (
    <SkeletonScreen label="Đang mở vườn tri thức…">
      <SkeletonPageHeader hasChip />
      <Skeleton height={240} radius="var(--r-l)" />
      <div className="grid two mt-4">
        {repeat(4).map((index) => (
          <SkeletonCard key={index} className="tight">
            <Skeleton width="45%" height={14} radius={6} />
            <div className="row wrap mt-2.5" style={{ gap: 6 }}>
              {repeat(6).map((chip) => <Skeleton key={chip} width={44} height={28} radius={999} />)}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </SkeletonScreen>
  );
}

/** Màn hình dạng "danh sách thẻ xếp dọc" (Tiến độ, Hồ sơ, Cài đặt, Luyện nghe/nói/đọc/viết). */
export function StackedCardsSkeleton({ label, cards = 4, hasAvatar = false }: { label: string; cards?: number; hasAvatar?: boolean }) {
  return (
    <SkeletonScreen label={label}>
      {hasAvatar ? (
        <div className="center mb-4">
          <Skeleton width={90} height={90} radius={999} style={{ margin: '0 auto' }} />
          <Skeleton width={140} height={20} radius={8} style={{ margin: '12px auto 0' }} />
        </div>
      ) : <SkeletonPageHeader />}
      <div className="stack">
        {repeat(cards).map((index) => (
          <SkeletonCard key={index} className="tight">
            <div className="between"><Skeleton width="45%" height={14} radius={6} /><Skeleton width={40} height={12} radius={6} /></div>
            <SkeletonText lines={2} lineHeight={11} className="mt-2.5" />
          </SkeletonCard>
        ))}
      </div>
    </SkeletonScreen>
  );
}
