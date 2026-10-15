'use client';

/** Lỗi khi tải trang admin — báo rõ, cho thử lại; không lộ chi tiết kỹ thuật. */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="adm-notice error" role="alert">
      <span aria-hidden="true">⚠️</span>
      <div>
        <b>Không tải được trang này.</b> Có thể Supabase đang chậm hoặc dữ liệu chưa sẵn sàng. Chi tiết đã ghi ở log server.
        <div style={{ marginTop: 10 }}><button type="button" className="adm-btn sm" onClick={reset}>Thử lại</button></div>
      </div>
    </div>
  );
}
