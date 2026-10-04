# Memory Engine

> Trái tim của Neko Neko. Quyết định **cái gì** quay lại, **khi nào**, và **vì sao**.
> Code: `src/features/memory/memory-engine.ts` · Hằng số: `memory-rules.ts` · Test: `memory-engine.test.ts`

## Nguyên tắc

1. **Tất định** — cùng đầu vào, cùng đầu ra. Không AI, không `Math.random()`. Mọi "ngẫu nhiên" đi qua seed
   (`src/lib/utils/deterministic-random.ts`).
2. **Thuần** — không đọc/ghi database. `memory-service.ts` lo việc lưu.
3. **Một chỗ** — `calculateMemoryUpdate()` là hàm DUY NHẤT tính kết quả một lần gặp lại.
4. **Chỉ có hiệu lực ở server** — trình duyệt không được ghi điểm (bị chặn bởi quyền + RLS).

## Trạng thái (sheet 5, mục A)

| Trạng thái | Điểm | Hiển thị | Ý nghĩa |
|---|---|---|---|
| `mastered` | ≥ 90 | 🌸 Đã thành thạo | Gần như không quên |
| `strong` | 74–89 | 🌳 Đã nhớ tốt | Gọi ra không cần nghĩ lâu |
| `learning` | 56–73 | 🌿 Đang học | Nhớ nhưng còn lung lay |
| `fading` | 40–55 | 🍂 Sắp quên | Đã đến lúc gặp lại |
| `weak` | < 40 | 🌱 Chưa vững | Mới học hoặc từng sai |
| `new` | — | 🫧 Mới | Chưa tới ngày học |

Trạng thái **không bao giờ lưu rời** để làm quyết định — luôn suy ra từ điểm thực tế bằng `getMemoryStatus()`.
(Cột `status` trong DB chỉ để báo cáo bằng SQL.)

## Điểm thực tế & đường cong quên

```text
điểm thực tế = điểm đã lưu − 0.45 × số ngày kể từ last_seen_at (hoặc created_at nếu chưa gặp lại)
             (kẹp trong khoảng 10…99)
```

Tính lúc đọc → không cần cron job. Vì sao mốc là `last_seen_at`: điểm lưu đã bao gồm phần trôi tới lần gặp
trước; dùng `last_recalled_at` sẽ trừ hai lần sau một câu trả lời sai.

## Một lần gặp lại — `calculateMemoryUpdate()`

| Sự kiện | Điểm | Gặp lại sau |
|---|---|---|
| Khám phá (`discover`) | không đổi | 1 ngày |
| Đúng (`recall`, `surprise` "Tôi nhớ", `use`) | +14 (tối đa 99) | `max(1, round(điểm / 18))` ngày |
| Sai | −6 (tối thiểu 10) | 1 ngày |
| Cứu xong (`rescue`) | như đúng, `rescued_count + 1` | như đúng |

Trước khi cộng/trừ, phần trôi được "chốt" vào điểm. Thưởng lớn hơn phạt: mục tiêu là quay lại, không phải trừng phạt.

## Chọn kiến thức

- **Ra-đa sắp quên** — `getForgettingRadar()`: trạng thái `fading`/`weak`, ≥ 2 ngày không gặp, yếu nhất lên đầu,
  tối đa 24. Vừa gặp trong 1 ngày qua thì **không bao giờ** bị báo sắp quên.
- **Gặp lại kiến thức (bất ngờ)** — `pickMemorySurprise()`: từ vựng/kanji, điểm 58–86, ≥ 3 ngày không gặp.
  Vùng vàng này tạo cảm giác "ồ, mình vẫn nhớ".
- **Ưu tiên gặp lại** — `getReviewPriority()`: đến hạn trước, rồi điểm thấp trước.
- **Sức khoẻ trí nhớ** — trung bình điểm của mọi kiến thức đã học.
- **Lý do** — `describeMemoryReason()`: luôn là câu tiếng Việt đời thường ("Bạn từng trả lời sai", "Đã đến lúc gặp lại"…).

## Gieo kiến thức theo lộ trình

`loadLearnerMemory()` (memory-service) tạo bản ghi cho mọi kiến thức có `day ≤ ngày đang học` (`profiles.current_day`) mà chưa có,
với `encounter_count = 0` — "đã gieo nhưng chưa gặp". Ngày đang học xong khi mọi kiến thức của ngày đó có
`encounter_count ≥ 1` (hoặc người học tự bấm hoàn thành) — xem `docs/architecture.md` mục 3b.
với điểm `INITIAL_MEMORY_SCORE = 35`. **Giả định** của đội phát triển (đặc tả chưa ghi) — xem `memory-rules.ts`.

## Muốn chỉnh công thức?

1. Sửa hằng số trong `memory-rules.ts` (không sửa rải rác ở màn hình).
2. Cập nhật test trong `memory-engine.test.ts`.
3. `npm test`.
4. Ghi lại thay đổi vào file này.

Đây là bản đơn giản hoá cho MVP, chưa phải SM-2 chuẩn (câu hỏi Q-08). Khi có dữ liệu thật, `review_events` đủ để
hiệu chỉnh lại các hệ số.
