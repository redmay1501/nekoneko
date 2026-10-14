import { redirect } from 'next/navigation';
import { LEARNING_LINKS } from '@/components/layout/navigation-items';

/**
 * Học tập không còn trang tổng quan (người dùng thấy thừa) — menu mở thẳng từng kho. Đường dẫn cũ /hoc-tap (còn được vài
 * nút dùng) chuyển sang kho đầu tiên để không link nào hỏng.
 */
export default function LearningHubPage() {
  redirect(LEARNING_LINKS[0].href);
}
