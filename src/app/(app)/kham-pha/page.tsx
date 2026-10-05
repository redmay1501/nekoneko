import { redirect } from 'next/navigation';
import { SESSION_MODES } from '@/features/learning/session-modes';

/** SC-06 · Khám phá kiến thức mới — đường dẫn cũ, giữ để link/bookmark cũ vẫn chạy: mọi phiên học nay ở /hoc/<chế độ>. */
export default function Page() {
  redirect(`/hoc/${SESSION_MODES.DISCOVER}`);
}
