import { redirect } from 'next/navigation';
import { PRACTICE_LINKS } from '@/components/layout/navigation-items';

/**
 * Luyện tập không còn trang tổng quan: các kiểu học (5 phút, cứu từ…) nằm ở khay "Học ngay", kỹ năng và Ghép thẻ ở menu.
 * Đường dẫn cũ /luyen-tap chuyển sang kỹ năng đầu tiên để không link nào hỏng.
 */
export default function PracticeHubPage() {
  redirect(PRACTICE_LINKS[0].href);
}
