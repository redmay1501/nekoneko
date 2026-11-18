/**
 * Khi nào tự đưa con trỏ vào ô gõ (luyện nghe – gõ, gõ kana, gõ câu):
 *  - chỉ khi đang chờ nhập câu MỚI (chưa chấm, chưa xong bài, có câu);
 *  - máy có chuột / bàn phím thật: focus ngay cả lần mở đầu;
 *  - màn cảm ứng: chỉ sau khi người học đã thao tác trong bài (đổi chế độ, chấm, sang câu) — tránh tự bật bàn phím ảo
 *    lúc vừa mở trang.
 * Việc focus làm SAU khi câu mới đã vẽ (requestAnimationFrame) để không focus vào ô của câu cũ.
 */
export function shouldFocusAnswerInput(input: {
  hasItems: boolean; isAnswered: boolean; isDone: boolean; hasInteracted: boolean; hasFinePointer: boolean;
}): boolean {
  if (!input.hasItems || input.isAnswered || input.isDone) return false;
  return input.hasInteracted || input.hasFinePointer;
}
