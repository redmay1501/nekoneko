# Audit & thiết kế chấm phát âm tiếng Nhật N5 — NekoNeko

> Ngày kiểm tra: **2026-10-15**. Giai đoạn: **audit — chưa triển khai code**. Không có chức năng Luyện nói nào bị sửa.
> Mọi kết luận về dịch vụ bên ngoài có link nguồn; điều tài liệu không nói được ghi là **chưa xác minh**.
> **Chưa chạy thử API nào bằng audio thật** (dự án chưa có khoá Azure / SpeechSuper) — mọi bộ test dưới đây là **kế hoạch chưa thực thi**.

---

## 0. Tóm tắt cho người quyết định

1. **Luyện nói hiện tại không thu âm, không nhận dạng, không chấm.** Không có gì để "sửa" — chấm phát âm là tính năng mới hoàn toàn.
2. **Azure AI Speech — Pronunciation Assessment** hỗ trợ `ja-JP` (đã xác minh). Với tiếng Nhật trả về: điểm chính xác (cả câu, theo từ),
   độ trôi chảy, độ đầy đủ, lỗi bỏ / thêm / phát âm sai theo từ, mốc thời gian. **Không** có tên âm vị, **không** chấm ngữ điệu
   (prosody chỉ `en-US`), **không** chấm pitch accent (đã xác minh trong tài liệu + câu trả lời của nhân viên Microsoft).
3. **SpeechSuper** có API tiếng Nhật trả điểm **theo từng mora (bằng hiragana)** và **điểm "tone" (cao độ)**, nhịp, phát hiện đọc
   bỏ / lặp, cảnh báo audio nhiễu / nhỏ. Đây là điều Azure không có — nhưng **chất lượng các điểm này cho người Việt học N5
   chưa có bằng chứng độc lập**; tài liệu của hãng không công bố độ tương quan với giám khảo cho tiếng Nhật.
4. **Không dịch vụ nào đã kiểm tra đủ căn cứ để tự động khẳng định** người học sai trường âm / âm ngắt / ん / pitch accent.
   Các tiêu chí này chỉ được bật sau khi chạy bộ test có nhãn của người chấm (mục 9).
5. **Khuyến nghị (mục 12):** MVP chỉ làm **Chế độ A — đọc theo câu mẫu**, dùng **Azure Pronunciation Assessment (scripted, ja-JP)**
   qua API route trên server, hiển thị **điểm theo từ + độ đầy đủ + độ trôi chảy**, có **cổng "chưa đủ dữ liệu"** trước và sau khi
   gọi dịch vụ, **không** chấm pitch accent / âm vị, **không** đổi điểm trí nhớ. Trước khi mở cho người dùng: một **đợt pilot**
   chạy bộ test N5 trên Azure (tầng miễn phí) và SpeechSuper (dùng thử 14 ngày) để quyết định số liệu ngưỡng.

---

## 1. Kiến trúc Luyện nói hiện tại (đọc từ code)

| Hạng mục | Thực tế trong code | Vị trí |
|---|---|---|
| Route | `/luyen-tap/noi` (server component) | `src/app/(app)/luyen-tap/noi/page.tsx` |
| Nội dung | 1 bài = vài câu ví dụ ngữ pháp (`exampleJp`, `exampleVi`); chọn phạm vi theo bài; "Câu khác" đổi ngẫu nhiên | `buildSpeakingPractice` — `src/features/learning/skill-practice.ts` |
| Tương tác | Hiện câu tiếng Việt → người học **tự nói to** → bấm "Xem đáp án" để thấy câu tiếng Nhật | `src/components/learning/SpeakingPrompt.tsx` |
| Ghi âm | **Không có** (`getUserMedia`, `MediaRecorder` không xuất hiện trong `src/`) | — |
| Nhận dạng giọng nói | **Không có** (`SpeechRecognition` / dịch vụ ASR không xuất hiện) | — |
| "Audio chuẩn" | **Giọng đọc của trình duyệt** `speechSynthesis`, `ja-JP`, tốc độ 0.85, giọng tuỳ máy | `src/hooks/useSpeech.ts`, `src/lib/speech/japanese-voices.ts` |
| Audio người thật | **Không có** tệp audio nào trong `public/` | — |
| Cách đọc | Câu ngữ pháp có `exampleReading` (kana, cách nhau theo cụm) cho 112/112 mẫu; từ vựng có `kana` | `content/seed/grammar-notes.json`, `n5-content.json` |
| Pitch accent tham chiếu | **Không có dữ liệu** (không trường trọng âm nào) | — |
| Lưu kết quả / trí nhớ | Luyện nói **không ghi** gì (không API, không memory event) | — |
| Secrets | Chỉ khoá Supabase ở server (`SUPABASE_SERVICE_ROLE_KEY`); chưa có khoá dịch vụ giọng nói | `src/lib/supabase/*`, `.env.local` |
| Hạ tầng | Next.js 15 App Router trên Vercel (function ở `iad1`), Supabase Postgres + RLS | — |

**Lỗi / rủi ro hiện có liên quan:**
- "Nghe mẫu" phụ thuộc giọng trình duyệt: máy không có giọng tiếng Nhật thì không có mẫu; **pitch accent của TTS trình duyệt không
  đáng tin để làm chuẩn** (không dùng làm tham chiếu chấm).
- Chế độ hiện tại là **nói tự do từ nghĩa tiếng Việt** — người học có thể nói câu khác vẫn đúng. Vì vậy nó **không phải** chế độ
  đọc theo câu mẫu; chấm phát âm phải là một chế độ mới (hoặc bước "đọc lại đáp án" sau khi xem đáp án).

---

## 2. Công nghệ đã nghiên cứu (nguồn chính thức, kiểm tra 2026-10-15)

| # | Giải pháp | Nguồn |
|---|---|---|
| A | Azure AI Speech — Pronunciation Assessment | [How to use](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment) · [Ngôn ngữ hỗ trợ](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=pronunciation-assessment) · [REST short audio](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short) · [Giá & điểm tính tiền](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool#pricing) · [Giới hạn](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/speech-service/pronunciation-assessment/characteristics-and-limitations-pronunciation-assessment) · [Dữ liệu](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security) · [Q&A: phoneme tiếng Nhật rỗng](https://learn.microsoft.com/en-us/answers/questions/1659203/pronunciation-assessment-results-in-japanese-have) |
| B | SpeechSuper — Japanese `word.eval.jp`, `sent.eval.jp`, `para.eval.jp` | [Tổng quan API](https://docs.speechsuper.com/) · [sent.eval.jp](https://docs.speechsuper.com/Languages/Japanese/sent.eval.jp.md) · [word.eval.jp](https://docs.speechsuper.com/Languages/Japanese/word.eval.jp.md) · [Cảnh báo](https://docs.speechsuper.com/Warnings.md) · [Máy chủ](https://docs.speechsuper.com/server.md) · [Minh bạch](https://docs.speechsuper.com/transparency.md) · [Giá](https://www.speechsuper.com/pricing.html) · [Quyền riêng tư](https://www.speechsuper.com/privacy.html) |
| C | Speechace | [Capabilities](https://api-docs.speechace.com/llms-full.txt) — dialect: en-us, en-gb, es-es, es-mx, fr-fr, fr-ca → **không có tiếng Nhật** |
| D | Google Cloud Speech-to-Text | [Ngôn ngữ](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages) — có nhận dạng `ja-JP`; **không tìm thấy** tính năng chấm phát âm trong tài liệu đã kiểm tra → chỉ là ASR |
| E | Web Speech API (`SpeechRecognition` trong trình duyệt) | [caniuse](https://caniuse.com/speech-recognition) — chỉ ASR; phụ thuộc trình duyệt (Chrome gửi lên máy chủ hãng, Safari iOS hỗ trợ một phần, Firefox không có); không có điểm phát âm |
| F | Mã nguồn mở: pyopenjtalk (G2P, nhãn full-context có thông tin trọng âm, ước lượng accent bằng `marine`) | [pyopenjtalk](https://github.com/r9y9/pyopenjtalk) (MIT; kèm giấy phép OpenJTalk / HTS) |
| G | Mã nguồn mở: Montreal Forced Aligner (căn chỉnh âm vị, có tiếng Nhật) | [MFA](https://montreal-forced-aligner.readthedocs.io/) · [bài báo 2026](https://arxiv.org/pdf/2606.18466) |

---

## 3. Bảng so sánh khả năng chấm phát âm tiếng Nhật

Ký hiệu: ✅ tài liệu chính thức xác nhận · ⚠️ có nhưng giới hạn / chỉ thấy ở ví dụ, demo · ❌ tài liệu nói không có · ❓ chưa xác minh.

| Câu hỏi (mục 3 của đề bài) | Azure PA | SpeechSuper | Google STT | Web Speech API |
|---|---|---|---|---|
| 1. Hỗ trợ `ja-JP` | ✅ (33 locale, có Japanese) | ✅ (8 ngôn ngữ, có Japanese) | ✅ (chỉ ASR) | ⚠️ tuỳ trình duyệt |
| 2. Chấm phát âm hay chỉ ASR | ✅ chấm (scripted & unscripted) | ✅ chấm (chỉ scripted cho tiếng Nhật) | ❌ chỉ ASR | ❌ chỉ ASR |
| 3. Bỏ sót / thêm / khác mục tiêu | ✅ `Omission`, `Insertion`, `Mispronunciation` theo từ (`EnableMiscue`, ≤ 30 s) | ✅ `readtype_diagnosis` (bỏ / lặp) | ❌ | ❌ |
| 4. Điểm tổng / từ / âm | ✅ câu, từ; ⚠️ âm tiết thấy trong Q&A (không có trong tài liệu cho ja); ❌ **tên âm vị cho ja** | ✅ câu, từ, **từng mora (hiragana)** | ❌ | ❌ |
| 5. Loại điểm thật sự có cho tiếng Nhật | Accuracy, Fluency, Completeness, PronScore (gộp có trọng số — **không công bố trọng số**) | overall, pronunciation, fluency, integrity (đầy đủ), rhythm, **tone**, speed, `rear_tone` | — | — |
| 6. Trường âm / âm ngắt / ん | ❓ không có chỉ tiêu riêng; chỉ phản ánh gián tiếp qua điểm từ / âm tiết | ❓ có điểm từng mora (có thể gồm っ / ー / ん) nhưng **chưa xác minh** độ nhạy | ❌ | ❌ |
| 7. Pitch accent | ❌ prosody chỉ `en-US`; không có trường cao độ cho ja | ⚠️ có `tone` (cao / thấp chuẩn mỗi mora), `tone_score` theo từ, `ref_tone` — **độ đúng chưa có bằng chứng** | ❌ | ❌ |
| 8. Mốc thời gian | ✅ `Offset`, `Duration` (đơn vị 100 ns) theo từ | ✅ `span` (đơn vị 10 ms) theo từ và mora | ✅ (từ) | ❌ |
| 9. Giới hạn audio | REST: **≤ 30 s** cho chấm; WAV PCM / OGG Opus 16 kHz mono; SDK cho dài hơn (khi đó không có miscue) | refText ≤ 400 ký tự (câu); WAV / MP3…; máy chủ có ở **Việt Nam, Nhật** | — | — |
| 10. Chi phí | Tính như speech-to-text Standard (accuracy, fluency, completeness, miscue nằm trong giá gốc); tầng F0 miễn phí **5 giờ audio / tháng**; giá theo giờ audio thay đổi theo region — **xác nhận trên trang giá trước khi bật** | **$0.006 / lượt câu**, $0.004 / lượt từ; tối thiểu **$20 / tháng**; dùng thử 14 ngày | theo phút | miễn phí (nhưng không chấm) |
| 11. Dữ liệu giọng nói | Real-time & pronunciation assessment: **không lưu** ("No data trace"), xử lý trong bộ nhớ | "audio … promptly and permanently discarded" (chính sách quyền riêng tư) | theo điều khoản Google Cloud | do hãng trình duyệt xử lý — app không kiểm soát |
| 12. SDK / REST hợp stack | ✅ REST gọi từ API route Next.js (khoá ở server); hoặc Speech SDK JS + token 10 phút | ✅ REST / WebSocket; ký `sig` bằng khoá → phải gọi từ server | ✅ | ✅ (client) |
| Độ tương quan với giám khảo | Hãng công bố **> 0.5 Pearson** (chung, không riêng tiếng Nhật) | Không công bố số cho tiếng Nhật | — | — |

**Ghi chú quan trọng về Azure + tiếng Nhật** (nguồn: Q&A Microsoft, 2024-04-23, nhân viên Microsoft trả lời):
JSON tiếng Nhật trả `"Phoneme": ""` cho mọi âm, chỉ có `AccuracyScore` theo từng chữ (âm tiết). Muốn có âm vị cho ngôn ngữ khác
`en-US` phải qua "internal gating review" (khoảng 1K lượt / tháng hoặc mua commitment tier). → **Không thiết kế dựa vào âm vị Azure.**

---

## 4. Những tiêu chí CÓ THỂ đánh giá đáng tin (ở mức tài liệu cho phép — vẫn phải kiểm chứng ở pilot)

| Tiêu chí | Nguồn tín hiệu | Điều kiện để hiển thị |
|---|---|---|
| Người học có đọc **đúng / đủ câu mẫu** không | Completeness + miscue theo từ (Azure) / `integrity` + `readType` (SpeechSuper) | Audio qua cổng chất lượng; câu ≤ 30 s |
| **Từ nào** phát âm kém rõ | `AccuracyScore` theo từ + `ErrorType = Mispronunciation` (Azure đặt khi < 60) | Chỉ đánh dấu khi điểm từ thấp **và** audio đạt chất lượng; nói "chưa rõ / cần luyện", không nói "sai âm X" |
| **Độ trôi chảy** (ngắt nghỉ) | `FluencyScore` (Azure: dựa trên khoảng lặng giữa từ) | Hiển thị riêng, có giải thích "đo khoảng ngắt, không đo ngữ điệu" |
| **Chất lượng audio đủ / không đủ** | Kiểm tra ở client (thời lượng, âm lượng, cắt tiếng, tỉ lệ im lặng) + trạng thái dịch vụ (`NoMatch`, `InitialSilenceTimeout`, `BabbleTimeout`, `SNR`) / cảnh báo 1001–1005 (SpeechSuper) | Luôn chạy, trước khi hiển thị bất cứ điểm nào |

## 5. Những tiêu chí CHƯA thể đánh giá / cần nghiên cứu thêm

| Tiêu chí | Lý do |
|---|---|
| **Lỗi theo âm vị** ("bạn đọc つ thành ちゅ") | Azure không trả tên âm vị cho ja; SpeechSuper trả điểm mora nhưng **không trả âm thực sự đã nói** → không biết người học đọc thành âm nào. Chỉ biết "mora này điểm thấp". |
| **Trường âm 長音 / âm ngắt 促音 / ん** như tiêu chí riêng | Không dịch vụ nào có chỉ tiêu riêng. Có thể phản ánh gián tiếp (điểm mora / từ thấp, hoặc ASR nhận ra từ khác như おばさん thay vì おばあさん) — **phải đo bằng cặp tối thiểu** (mục 9) trước khi dùng. |
| **Pitch accent** | Azure: không hỗ trợ. SpeechSuper: có trường `tone` nhưng chưa có bằng chứng độ đúng. Tự làm: cần F0 (pYIN / Praat) + căn chỉnh mora (MFA) + mẫu chuẩn (pyopenjtalk / UniDic `aType`) → giới hạn: phương ngữ, câu (accent phrase) làm đổi trọng âm từ, F0 không ổn định với giọng nhỏ / nhiễu; người Việt có thanh điệu riêng → sai số. **Giai đoạn sau, chỉ làm sau pilot.** |
| **Nhịp mora** chính xác | Không có phương pháp đã kiểm chứng; `rhythm` của SpeechSuper là chỉ số tổng hợp chưa rõ cách tính. |
| **Ngữ điệu (prosody)** cho ja | Azure: chỉ en-US. |
| **Chế độ B — nói tự do** | Azure unscripted không có content score cho ja (chỉ en-US); SpeechSuper không có unscripted cho ja. Không tách được "nói câu khác nhưng đúng" với "phát âm sai" → **không làm ở giai đoạn đầu**. |
| **Nhiều người nói / tiếng nền có người** | Cả hai dịch vụ: không hỗ trợ nhiều người; không có cờ phát hiện rõ ràng → chỉ dặn người học, không tự kết luận. |

---

## 6. Phương án đề xuất cho NekoNeko N5

**Chế độ A — Đọc theo câu mẫu** (ưu tiên duy nhất ở MVP):
- Nội dung: câu ví dụ ngữ pháp (đã có `exampleJp` + `exampleReading`), từ vựng (có `kana`), sau đó câu bài đọc.
- Thêm vào trang Luyện nói thành một chế độ riêng "🎙️ Đọc theo mẫu" (giữ nguyên chế độ nói tự do hiện có).
- `ReferenceText` gửi đi: **câu gốc có kanji** (để nhận dạng đúng nghĩa) — cần kiểm chứng ở pilot xem gửi kana hay kanji cho
  kết quả ổn định hơn (mục 9, nhóm T-REF).
- Chỉ hiển thị: kết quả đọc đủ / thiếu; từ cần luyện lại; độ trôi chảy; nút nghe mẫu, nghe bản ghi, ghi lại.
- **Không** hiển thị PronScore gộp như "điểm phát âm" (Azure không công bố trọng số) — nếu có, ghi rõ "điểm tổng hợp của Azure".

**Chế độ B — Nói tự do:** hoãn. Điều kiện mở lại: có dịch vụ chấm unscripted cho ja **và** pilot cho thấy tách được nội dung với phát âm.

---

## 7. Pipeline chấm phát âm (Chế độ A)

```
[Client]                                                     [Server: POST /api/pronunciation/assess]          [Azure]
1. Lấy câu mục tiêu + cách đọc (đã có trong catalog)
2. Xin quyền micro (lần đầu: hiện thông báo & đồng ý)
3. Ghi âm (Web Audio → PCM 16 kHz mono WAV, tối đa 15 s)
4. Cổng chất lượng ở client:                               
   - thời lượng nói < 0,4 s hoặc > 15 s  → "chưa đủ dữ liệu"
   - âm lượng (RMS) quá nhỏ / cắt tiếng (clipping) quá nhiều
   - gần như toàn im lặng
   → không gửi, báo lý do, mời ghi lại
5. Gửi audio + contentKey  ───────────────────────────────▶ 6. Xác thực người dùng, kiểm tra quota / ngày,
                                                               lấy ReferenceText từ catalog (không tin text client)
                                                            7. Gọi REST short audio + header Pronunciation-Assessment ──▶ 8. Chấm
                                                               (timeout ~10 s, 1 lần thử lại khi lỗi mạng / 5xx)
                                                            9. Chuẩn hoá kết quả → PronunciationResult (mục 8):
                                                               - RecognitionStatus ≠ Success / SNR thấp / Completeness
                                                                 rất thấp mà nhận dạng ra câu khác hẳn → "insufficient"
                                                                 hoặc "off_target" (không phải "phát âm sai")
                                                            10. Không lưu audio. (Tuỳ chọn) lưu bản tóm tắt điểm.
11. Hiển thị theo status; nghe mẫu / nghe lại bản ghi (blob trong trình duyệt) / ghi lại
```

**Vì sao REST qua server thay vì Speech SDK trong trình duyệt:** khoá chỉ ở server; server tự lấy câu mục tiêu (không thể gian lận);
dễ giới hạn lượt và ghi log lỗi; câu N5 ngắn (< 30 s) nằm trong giới hạn REST. WAV 15 s × 16 kHz × 16 bit ≈ 480 KB, dưới giới hạn
body của function Vercel (4,5 MB). Đổi nhà cung cấp chỉ cần thay **một hàm** chuẩn hoá (`assessWithAzure` → `assessWithX`) trả cùng
`PronunciationResult` — không làm hệ thống plugin.

---

## 8. Rubric, cấu trúc response và quy tắc "chưa đủ dữ liệu"

### 8.1 Response chuẩn cho frontend

```ts
type AssessmentStatus =
  | 'assessed'          // có kết quả đáng tin để hiển thị
  | 'insufficient'      // chưa đủ dữ liệu: im lặng, quá nhỏ, nhiễu, quá ngắn / dài, dịch vụ không nhận ra tiếng
  | 'off_target'        // nghe ra nội dung khác hẳn câu mẫu → "bạn đọc khác câu mẫu", KHÔNG phải "phát âm sai"
  | 'service_error';    // lỗi / timeout dịch vụ → không kết luận gì

interface PronunciationResult {
  status: AssessmentStatus;
  provider: 'azure';                       // để đổi / so sánh nhà cung cấp sau này
  referenceText: string;                   // câu mục tiêu (server lấy từ catalog)
  recognizedText: string | null;           // nội dung dịch vụ nhận ra (null nếu không có)
  contentMatch: {                          // đối chiếu nội dung (miscue)
    completeness: number | null;           // 0–100, nguồn: CompletenessScore
    omittedWords: string[];                // ErrorType = Omission
    insertedWords: string[];               // ErrorType = Insertion
  } | null;
  pronunciationScore: number | null;       // AccuracyScore cả câu — null nếu không có
  fluencyScore: number | null;             // FluencyScore — null nếu không có
  wordResults: Array<{
    text: string; accuracy: number | null;
    errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
    offsetMs: number | null; durationMs: number | null;
  }> | null;
  phonemeResults: null;                    // KHÔNG đánh giá (Azure không trả âm vị cho ja)
  pitchAccentResult: null;                 // KHÔNG đánh giá
  issues: Array<{ kind: 'omission' | 'insertion' | 'low_accuracy_word' | 'low_fluency'; word?: string; evidence: string }>;
  confidence: { snr: number | null; recognitionConfidence: number | null }; // nguyên giá trị nguồn, không tự gán
  limitations: string[];                   // vd "Chưa chấm âm vị và cao độ cho tiếng Nhật", lý do insufficient
}
```

### 8.2 Quy tắc

| Tình huống | Status | Hiển thị cho người học | Ghi trí nhớ / tiến độ |
|---|---|---|---|
| Micro bị chặn / không có tiếng | `insufficient` | "Chưa nghe thấy giọng bạn — kiểm tra micro và thử lại" | Không |
| Quá nhỏ / cắt tiếng / quá ngắn / quá dài (client) | `insufficient` | Lý do cụ thể + mẹo (gần micro, nói bình thường) | Không |
| `InitialSilenceTimeout` / `BabbleTimeout` / `NoMatch` | `insufficient` | "Chưa nhận ra tiếng Nhật trong bản ghi — thử lại ở chỗ yên tĩnh" | Không |
| SNR dưới ngưỡng (ngưỡng **xác định ở pilot**, chưa đặt số) | `insufficient` | "Nhiều tiếng ồn" | Không |
| Nhận ra nội dung khác hẳn (completeness rất thấp, phần lớn từ Omission, recognizedText khác) | `off_target` | "Bạn đọc khác câu mẫu" + hiện câu nhận ra | Không |
| Lỗi mạng / 5xx / timeout sau 1 lần thử lại | `service_error` | "Chưa chấm được lúc này" | Không |
| Có kết quả | `assessed` | Đủ / thiếu câu, từ cần luyện, trôi chảy; không đưa lời khuyên về âm cụ thể | **MVP: không đổi điểm trí nhớ** (đọc lại câu mẫu ≠ nhớ được kiến thức). Có thể ghi "đã luyện đọc" riêng ở giai đoạn sau. |

- **Không bao giờ** gán 0 điểm cho `insufficient` / `service_error`.
- **Không dùng** `Confidence` của ASR làm điểm phát âm.
- Ngưỡng "từ cần luyện" ban đầu dùng mốc của Azure (`Mispronunciation` khi accuracy < 60) — **là mốc của hãng, chưa kiểm chứng cho người
  Việt học N5**; pilot quyết định có cần nâng / hạ không.
- Nếu sau này dùng LLM để diễn giải: chỉ được diễn giải các trường có trong `PronunciationResult`, không thêm lỗi / điểm.

---

## 9. Bộ test và kế hoạch kiểm chứng (CHƯA THỰC THI)

### 9.1 Bộ câu / cặp tối thiểu N5

| Nhóm | Mục tiêu | Cặp / câu | Kết quả mong đợi của hệ thống tốt |
|---|---|---|---|
| T-LONG trường âm | Phân biệt độ dài nguyên âm | おばさん / おばあさん · おじさん / おじいさん · ゆき / ゆうき · とり / とおり · え / ええ · ここ / こうこう · びよういん / びょういん | Đọc おばさん khi mẫu là おばあさん → từ đó bị đánh dấu (điểm thấp hoặc Mispronunciation) hoặc nhận ra từ khác |
| T-GEM âm ngắt | Có / không có っ | きて / きって · いた / いった · さか / さっか · おと / おっと · かこ / かっこ | Bỏ っ → bị đánh dấu |
| T-N âm mũi | Bỏ / thêm ん | きねん / きんえん · かに / かんい · ほんや / ほや · せんせい (đọc せせい) | Bỏ ん → bị đánh dấu |
| T-VN lỗi người Việt hay gặp | Phụ âm / nguyên âm | つ / ちゅ (つくえ) · ざ / じゃ · ら行 (l / r) · ふ (fu / hu) · う không tròn môi · し / ひ · か / が (vô thanh / hữu thanh) | Chỉ ghi nhận điểm từ; **không kỳ vọng** hệ thống gọi tên lỗi |
| T-SENT câu | Ngắn → dài | わたしは がくせいです。 · これは にほんごの ほんです。 · まいにち でんしゃで かいしゃへ いきます。 · câu 3 mệnh đề trong bài đọc | Completeness đúng khi bỏ một cụm |
| T-RATE tốc độ | Chậm / bình thường | Cùng một câu đọc 2 tốc độ | Điểm không đổi nhiều khi phát âm đúng |
| T-NOISE nhiễu | Rõ / ồn / xa micro / có người khác nói | Cùng một câu | Ồn nặng → `insufficient`, **không** phải điểm thấp |
| T-OFF lệch nội dung | Đọc câu khác | Đọc câu bài 2 khi mẫu là bài 1 | `off_target` |
| T-REF dạng câu mẫu | Kanji / kana | Gửi `ReferenceText` dạng kanji và dạng kana cho cùng audio | Xem dạng nào ổn định hơn |
| T-PITCH (chỉ đo, không bật) | Cao độ | はし (橋 / 箸) · あめ (雨 / 飴) · かみ (紙 / 神) | Chỉ ghi nhận trường `tone` của SpeechSuper so với nhãn người chấm |

### 9.2 Dữ liệu có nhãn
- **Người nói:** 2–3 người bản ngữ (mẫu chuẩn) + 10–15 người Việt học N5 (trình độ khác nhau), mỗi người đọc mỗi mục 2 lần, 2 điều kiện (yên tĩnh / có ồn).
- **Lỗi cố ý:** người bản ngữ / giáo viên đọc thêm phiên bản sai có chủ đích (bỏ っ, rút ngắn trường âm…) để có nhãn chắc chắn.
- **Người chấm:** ≥ 2 người có chuyên môn tiếng Nhật, chấm mù (không thấy điểm máy): mỗi bản ghi "đúng / sai / không đánh giá được", mỗi từ "đạt / cần luyện", loại lỗi nếu có. Đo đồng thuận giữa 2 người chấm (Cohen's κ) trước khi so với máy.
- **Đồng ý:** người tham gia ký đồng ý cho ghi âm & lưu để thử nghiệm; xoá sau khi kết thúc pilot.

### 9.3 Chỉ số
- **Tỉ lệ chấp nhận sai** (người chấm: sai — máy: đạt) theo từng nhóm lỗi.
- **Tỉ lệ bác bỏ sai** (người chấm: đúng — máy: cần luyện) — quan trọng nhất cho trải nghiệm người mới.
- **Tỉ lệ `insufficient`** ở điều kiện yên tĩnh (quá cao = gây khó chịu) và ở điều kiện ồn (quá thấp = chấm liều).
- **Độ nhất quán** giữa 2 lần đọc của cùng người cùng câu.
- **Khả năng phát hiện** từng nhóm T-LONG / T-GEM / T-N (recall), so với người chấm.
- κ giữa máy và người chấm (sau khi đưa điểm về nhãn đạt / cần luyện); Pearson cho điểm câu.

**Không đặt ngưỡng trước.** Ngưỡng (SNR, điểm từ, completeness cho `off_target`) chọn từ đường cong chấp nhận sai / bác bỏ sai trên dữ liệu
pilot, ưu tiên **bác bỏ sai thấp** (thà nói "chưa đủ dữ liệu" còn hơn bảo người học sai khi họ đúng). Nhóm lỗi nào không đạt mức phát
hiện chấp nhận được → **không hiển thị** tiêu chí đó.

### 9.4 Kết quả thực tế
| Mục | Trạng thái |
|---|---|
| Chạy Azure trên bộ test | **Chưa thực thi** (chưa có khoá) |
| Chạy SpeechSuper trên bộ test | **Chưa thực thi** (chưa đăng ký dùng thử) |
| Ghi âm người bản ngữ / người học | **Chưa có** |
| Chấm của chuyên gia | **Chưa có** |

---

## 10. Chi phí, bảo mật, cấu hình

| Hạng mục | Đề xuất |
|---|---|
| Khoá | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` chỉ ở server (Vercel env); không `NEXT_PUBLIC_*`. |
| Region Azure | Chọn region có speech-to-text gần Vercel `iad1` (vd East US) — độ trễ server→Azure thấp; audio người dùng đi VN → Vercel → Azure. |
| Audio gửi ra ngoài | Có — gửi đến Azure. Azure: không lưu (real-time / pronunciation assessment). NekoNeko: **không lưu audio** (xử lý trong bộ nhớ của request; bản nghe lại là blob trong trình duyệt). |
| Thông báo & đồng ý | Lần đầu bấm ghi âm: hộp thoại nói rõ "giọng của bạn được gửi tới Microsoft Azure để chấm, không được lưu"; lưu lựa chọn đồng ý trong `user_settings`. Có cách dùng Luyện nói **không** cần ghi âm (chế độ cũ). |
| Giới hạn | Tối đa 15 s / bản ghi (câu N5 ngắn); giới hạn lượt / người / ngày (vd vài chục) — đặt số sau khi biết chi phí thật; chặn spam (1 request đang chạy / người). |
| Timeout / retry | Timeout ~10 s; thử lại 1 lần với lỗi mạng / 5xx; 4xx không thử lại. |
| Chi phí | Azure tính theo thời lượng audio như speech-to-text Standard; tầng **F0: 5 giờ audio / tháng miễn phí** ≈ 3.600 lượt đọc câu 5 s. Pilot chạy được trong tầng miễn phí. Giá trả phí theo giờ phụ thuộc region — **xác nhận trên [trang giá](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services) trước khi bật**. SpeechSuper (để so sánh): $0.006 / câu, tối thiểu $20 / tháng. |
| Đổi nhà cung cấp | Một kiểu `PronunciationResult` chung + một hàm chuẩn hoá cho mỗi nhà cung cấp. Không làm plugin. |

---

## 11. File dự kiến thay đổi (khi được duyệt triển khai)

| File | Việc |
|---|---|
| `src/features/pronunciation/assessment-types.ts` (mới) | `PronunciationResult`, `AssessmentStatus` |
| `src/features/pronunciation/audio-quality.ts` (mới) + test | Cổng chất lượng ở client (thời lượng, RMS, clipping, tỉ lệ im lặng) — hàm thuần, test bằng mẫu PCM tổng hợp |
| `src/features/pronunciation/azure-assessment.ts` (mới) + test | Gọi REST, chuẩn hoá JSON Azure → `PronunciationResult` (test bằng JSON mẫu của tài liệu + JSON thật từ pilot) |
| `src/app/api/pronunciation/assess/route.ts` (mới) | Xác thực, quota, lấy câu mẫu từ catalog, gọi Azure, trả kết quả |
| `src/hooks/useRecorder.ts` (mới) | Xin micro, ghi PCM 16 kHz mono, xuất WAV, phát lại |
| `src/components/learning/ReadAloudPrompt.tsx` (mới) | Giao diện đọc theo mẫu + hiển thị kết quả theo status |
| `src/app/(app)/luyen-tap/noi/page.tsx` | Thêm chế độ "Đọc theo mẫu" (giữ chế độ cũ) |
| `src/features/progress/settings-*` / `user_settings` | Lưu đồng ý ghi âm (nếu cần cột mới → migration nhỏ) |
| `.env.example`, `docs/` | Biến môi trường, hướng dẫn |

---

## 12. Rủi ro và giới hạn

1. **Chấm sai tự tin** — rủi ro lớn nhất: người mới bị báo sai khi đúng → mất động lực. Giảm bằng cổng `insufficient` / `off_target`, chỉ hiện tiêu chí đã qua pilot.
2. **Phụ thuộc ASR:** điểm Azure dựa trên nhận dạng ("The performance of pronunciation assessment depends on Azure Speech-To-Text transcription accuracy") — giọng người Việt có thể bị nhận dạng kém → điểm thấp không do phát âm.
3. **Không có âm vị / cao độ cho ja ở Azure** → không thể giải thích "sai âm nào"; chỉ nói "từ nào cần luyện".
4. **Tách từ tiếng Nhật** do dịch vụ tự làm → kết quả theo "từ" có thể không khớp cách NekoNeko chia cụm; cần ánh xạ (T-REF).
5. **Mẫu chuẩn là TTS trình duyệt** — chất lượng và pitch accent không đảm bảo; nên chuyển sang audio người thật hoặc TTS neural cố định ở giai đoạn sau.
6. **Chi phí tăng theo người dùng** — cần quota.
7. **Quyền riêng tư:** giọng nói là dữ liệu cá nhân (có thể là sinh trắc theo một số luật) → cần thông báo & đồng ý.
8. **SpeechSuper:** nhà cung cấp nhỏ hơn, tài liệu hãng tự công bố, không có số tương quan cho tiếng Nhật; tối thiểu $20 / tháng.

---

## 13. Phân loại mức độ chắc chắn

| Nhận định | Mức |
|---|---|
| Luyện nói hiện tại không ghi âm, không ASR, không chấm; mẫu là TTS trình duyệt | **Đã kiểm chứng** (đọc code) |
| Azure PA hỗ trợ ja-JP (33 locale) | **Đã xác minh bằng tài liệu chính thức** |
| Azure: prosody chỉ en-US; tên âm vị chỉ en-US (IPA) / en-US, zh-CN (SAPI); âm tiết / spoken phoneme chỉ en-US | **Đã xác minh bằng tài liệu chính thức** |
| Azure ja trả phoneme rỗng, có điểm theo chữ | **Đã xác minh** (Q&A Microsoft, nhân viên MS trả lời) — chưa tự thử |
| Azure REST: chấm ≤ 30 s, WAV PCM / OGG Opus 16 kHz mono; miscue không có ở continuous mode | **Đã xác minh bằng tài liệu chính thức** |
| Azure không lưu audio real-time / PA | **Đã xác minh bằng tài liệu chính thức** |
| Azure F0 5 giờ / tháng; giá theo giờ audio | **Đã xác minh một phần** (giá cụ thể theo region phải xem lại lúc bật) |
| SpeechSuper ja trả mora + tone + rhythm + readType + cảnh báo; $0.006 / câu; xoá audio | **Đã xác minh bằng tài liệu của hãng** — chưa tự thử |
| Speechace không có tiếng Nhật | **Đã xác minh bằng tài liệu chính thức** |
| Google STT không có chấm phát âm | **Chưa xác minh đầy đủ** (không tìm thấy trong tài liệu đã kiểm tra) |
| Azure / SpeechSuper phát hiện được trường âm, âm ngắt, ん | **Chưa có dữ liệu để kết luận** |
| Điểm `tone` của SpeechSuper phản ánh đúng pitch accent của người Việt | **Chưa có dữ liệu để kết luận** |
| Ngưỡng SNR / điểm từ / off_target | **Chỉ là đề xuất** — xác định ở pilot |
| Pipeline, response, rubric ở mục 7–8 | **Chỉ là đề xuất** |

---

## 14. Quyết định khuyến nghị cho giai đoạn đầu

**Một phương án:** *Chế độ A — Đọc theo câu mẫu*, chấm bằng **Azure AI Speech Pronunciation Assessment (scripted, `ja-JP`, REST short
audio gọi từ API route của NekoNeko)*, hiển thị **độ đầy đủ, từ cần luyện, độ trôi chảy**, có **cổng "chưa đủ dữ liệu" / "đọc khác câu
mẫu"**, **không** chấm âm vị và pitch accent, **không** đổi điểm trí nhớ. Mở cho người dùng **sau khi** pilot (mục 9) cho thấy tỉ lệ bác
bỏ sai chấp nhận được.

**Vì sao Azure mà không phải SpeechSuper cho MVP:**
- Hỗ trợ ja-JP và các giới hạn được ghi trong **tài liệu chính thức** của một nhà cung cấp lớn, có công bố tương quan với giám khảo
  (> 0.5 Pearson, chung) và hướng dẫn tự đánh giá; tài liệu nói rõ cái **không** có cho tiếng Nhật — dễ thiết kế trung thực.
- **Tầng miễn phí 5 giờ / tháng** → pilot và giai đoạn đầu gần như không tốn tiền; SpeechSuper tối thiểu $20 / tháng.
- Chính sách **không lưu audio** rõ ràng; region / hạ tầng Azure ổn định.
- Những thứ SpeechSuper có thêm (mora, tone) chính là các tiêu chí **chưa có bằng chứng** — MVP không hiển thị chúng dù dùng nhà nào.

**SpeechSuper vẫn chạy trong pilot** (dùng thử 14 ngày) như phép so sánh: nếu dữ liệu có nhãn cho thấy điểm mora phát hiện được trường
âm / âm ngắt / ん tốt hơn rõ rệt, hoặc `tone` khớp người chấm, thì đó là căn cứ để đổi / bổ sung ở giai đoạn 2 — nhờ lớp chuẩn hoá chung
(`PronunciationResult`) việc đổi chỉ chạm một file.

**Việc cần anh / chị quyết trước khi triển khai:**
1. Đồng ý dùng Azure (tạo Speech resource, tầng F0) và cấp `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION`.
2. Có tổ chức được đợt ghi âm + người chấm cho pilot (mục 9.2) không — nếu không, MVP chỉ nên mở dạng "thử nghiệm" có ghi chú rõ giới hạn.
3. Có đăng ký dùng thử SpeechSuper để so sánh không.

---

## 13. Cập nhật 2026-10-28 — AI nhận diện CHẠY TRÊN THIẾT BỊ (miễn phí, không gửi audio)

Thay hướng Azure / SpeechSuper (trả phí, gửi audio ra ngoài) bằng nhận diện giọng nói chạy ngay trong trình duyệt.

**Khảo sát (số liệu kiểm tra ngày 2026-10-28):**

| Tiêu chí | Whisper base (chọn) | Whisper tiny | Whisper small | Web Speech API (cũ, vẫn giữ làm dự phòng) | Mô hình chấm phát âm mở |
|---|---|---|---|---|---|
| Chi phí API | 0 | 0 | 0 | 0 | — |
| Audio rời thiết bị | **Không** | Không | Không | Có (Chrome → Google, Safari → Apple) | — |
| Tiếng Nhật | Có (đa ngôn ngữ) | Có | Có | Có | Không tìm thấy mô hình chạy trên trình duyệt đủ tin cậy |
| CER tiếng Nhật (CommonVoice 8 / JSUT) | 28.6% / 24.9% | 53.7% / 36.5% | 15.1% / 14.2% | không công bố | — |
| Dung lượng (ONNX q8) | ~77 MB (+ ~26 MB ONNX Runtime WASM) | ~41 MB | ~249 MB | 0 | wav2vec2 ja ~1.2 GB (fp32) |
| Chấm phát âm | ❌ chỉ nhận diện | ❌ | ❌ | ❌ | chưa xác minh |
| Giấy phép | Apache-2.0 (mô hình + Transformers.js 4.3.2) | Apache-2.0 | Apache-2.0 | — | Apache-2.0 |
| Thiết bị | WebGPU (Chrome/Edge, Safari 26+) hoặc WebAssembly | | | tuỳ trình duyệt | |

Nguồn: Hugging Face API (kích thước tệp `onnx-community/whisper-*`, giấy phép `openai/whisper-*`), bảng CER của [Japanese ASR benchmark](https://japanese-asr-readme.static.hf.space/),
WebGPU trên iOS/iPadOS 26 ([AppDeveloperMagazine](https://appdevelopermagazine.com/webgpu-in-ios-26/)).

**Triển khai** (`/luyen-tap/noi`, chế độ "🧠 AI trên máy" mặc định khi thiết bị chạy được):
- Ghi âm MediaRecorder (chỉ xin quyền micro khi bấm Ghi âm) → giải mã → PCM 16 kHz mono → Whisper base trong Web Worker
  (`src/features/speech/asr.worker.ts`, tải mô hình theo nhu cầu, Transformers.js lưu Cache Storage) → so chữ với mẫu
  (đổi chữ Hán → kana bằng từ điển từ vựng của app; bỏ qua khác biệt chỉ ở ー / っ / nguyên âm kéo dài và ghi rõ là chưa đánh giá).
- Đo âm thanh thuần số học (`src/features/speech/audio-quality.ts`): thời gian nói, tốc độ ≈ mora/giây (đếm mora từ cách đọc kana),
  im lặng / quá ngắn / quá nhỏ / quá ồn / rè. Bản ghi không đạt cổng chất lượng → không đưa vào Whisper.
- Nội dung: câu ví dụ ngữ pháp (như cũ), từ đã học, chữ cái đã học (≤ ngày đang học).
- Nghe mẫu (giọng trình duyệt), nghe lại bản ghi (Blob trong trang, không lưu, không gửi).

**Kiểm thử chức năng** (Chromium + giọng TTS Kyoko của macOS bơm vào micro giả — KHÔNG phải bằng chứng độ chính xác ngôn ngữ):
câu わたしは まいにち おきます → Whisper "私は毎日置きます" → khớp sau khi đổi kana (置/起 cùng cách đọc); từ しゃちょう → lúc "社長",
lúc "シャッチョー" (Whisper tự thêm っ / ー) → khớp khi bỏ qua trường âm, có ghi chú; im lặng → "Không nghe thấy tiếng";
từ chối micro → hướng dẫn cấp quyền. WebGPU: nhận diện ~0.7–0.8 s/câu sau khi tải; lần đầu ~10 s (gồm tải mô hình).
**Chưa kiểm thử:** Safari iPhone/iPad thật, đường WebAssembly (không WebGPU), giọng người Việt thật, tiếng ồn thật.

**Không làm / chưa hỗ trợ (ghi rõ trên giao diện):** điểm phát âm, trường âm, っ, ん, cao độ — không có phương pháp miễn phí trên
trình duyệt đã được kiểm chứng. Bước tiếp theo nếu cần chấm thật: bộ ghi âm người Việt có nhãn của giám khảo (mục 9) để đo Whisper,
rồi mới cân nhắc căn chỉnh mora (forced alignment) hoặc dịch vụ trả phí.
