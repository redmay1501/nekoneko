-- ─────────────────────────────────────────────────────────────
-- Neko Neko — Kỷ lục trò chơi ôn tập (Ghép thẻ…), lưu cùng cài đặt cá nhân — KHÔNG phải dữ liệu trí nhớ:
-- điểm game không bao giờ làm tăng memory_score (đoán nhanh đúng ≠ nhớ vững).
-- { "match:tu-vung:tat-ca": { "bestAccuracy": 100, "bestTimeMs": 41200, "plays": 3, "lastPlayedAt": "…" }, … }
-- Người học tự ghi được (policy "own settings editable" đã có).
-- ─────────────────────────────────────────────────────────────

alter table public.user_settings add column if not exists game_records jsonb not null default '{}'::jsonb;
