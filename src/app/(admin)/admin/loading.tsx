/** Khung chờ khi trang admin đang tải dữ liệu từ server. */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Đang tải">
      <div className="adm-skel" style={{ height: 14, width: 160 }} />
      <div className="adm-skel" style={{ height: 30, width: 260, margin: '12px 0 18px' }} />
      <div className="adm-grid">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="adm-skel" style={{ height: 86 }} />)}
      </div>
      <div className="adm-skel" style={{ height: 320, marginTop: 16 }} />
    </div>
  );
}
