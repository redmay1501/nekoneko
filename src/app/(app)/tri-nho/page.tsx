import { redirect } from 'next/navigation';

/** Đường dẫn cũ — Theo dõi nay gộp một trang có tab (/theo-doi). Giữ để link / bookmark cũ vẫn chạy. */
export default function Page() {
  redirect('/theo-doi?tab=tri-nho');
}
