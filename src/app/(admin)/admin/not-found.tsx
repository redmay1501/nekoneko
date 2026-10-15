import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="adm-empty">
      <span style={{ fontSize: 28 }} aria-hidden="true">🔎</span>
      <b>Không tìm thấy mục này</b>
      <Link className="adm-btn ghost sm" href="/admin">Về Dashboard</Link>
    </div>
  );
}
