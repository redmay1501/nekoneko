/**
 * Noko — bạn đồng hành. 11 trạng thái, mỗi trạng thái một câu.
 * Giữ nguyên lời thoại của prototype (sheet "7. Văn bản giao diện").
 * Noko không bao giờ trách người học.
 */
export const NOKO_MESSAGES = {
  welcome: 'Bạn không cần nhớ tất cả hôm nay. Mình sẽ đưa lại đúng lúc bạn sắp quên.',
  idle: 'Mình đang trông vườn giúp bạn. Khi nào rảnh thì ghé nhé.',
  studying: 'Cứ từ từ thôi. Ít mà đều thì ở lại lâu hơn.',
  thinking: 'Nghĩ chậm cũng được. Nhớ ra được mới là cái quan trọng.',
  correct: 'Ồ! Bạn vẫn nhớ! 🌸',
  wrong: 'Không sao. Mình gặp lại nó thêm một lần nữa nhé.',
  forgotten: 'Mình tìm thấy một thứ bạn sắp quên. Ghé qua một chút thôi.',
  recovered: 'Ôn xong rồi! Lần này nó sẽ ở lại lâu hơn.',
  achievement: 'Bạn vừa đi qua một cột mốc nhỏ. Mình có thấy đấy 🌸',
  rest: 'Đủ rồi đó. Để kiến thức ở lại một chút nhé.',
  comeback: 'Bạn quay lại rồi 🌸 Không cần học bù đâu.',
} as const;

export type NokoState = keyof typeof NOKO_MESSAGES;
