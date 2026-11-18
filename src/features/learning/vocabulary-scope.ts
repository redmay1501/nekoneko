import { lessonNumber } from '@/lib/utils/lesson';
import type { KnowledgeCatalog } from './knowledge-catalog';

/**
 * PHẠM VI TỪ VỰNG của một câu hỏi: từ nào trong câu thuộc bài Minna SAU bài đang kiểm tra.
 * Dùng để đề kiểm tra Bài 1 không âm thầm dùng từ của Bài 2+ (兄, 駅, 図書館…): câu trong phạm vi được ưu tiên,
 * câu buộc phải dùng từ bài sau thì kèm chú thích cách đọc + nghĩa + bài sẽ học.
 *
 * Nhận diện: từ có chữ Hán hoặc Katakana (từ chỉ có Hiragana quá dễ khớp nhầm vào đuôi chia động từ); động từ bỏ ます,
 * tính từ đuôi い (có chữ Hán) bỏ い để khớp mọi dạng chia; khớp từ dài trước. Chữ Hán đơn (山, 中, 東…) chỉ tính khi đứng
 * riêng — nằm cạnh chữ Hán khác thì là một phần của tên / từ ghép khác (山田, 田中, 東京).
 */
export interface LaterLessonWord {
  word: string;
  reading: string;
  meaning: string;
  lesson: number;
}

interface Form { form: string; lesson: number; reading: string; meaning: string }

const HAN = /[一-鿿々]/;
const KATAKANA = /[ァ-ヺー]/;
const cache = new WeakMap<KnowledgeCatalog, Form[]>();

function formsOf(catalog: KnowledgeCatalog): Form[] {
  const cached = cache.get(catalog);
  if (cached) return cached;
  const forms: Form[] = [];
  for (const word of catalog.content.vocabulary) {
    const lesson = lessonNumber(word.lesson ?? '');
    if (!Number.isFinite(lesson)) continue;
    const reading = word.kana.split(/[／/]/)[0].trim();
    for (const raw of [word.kanji ?? '', word.kana]) {
      for (const part of raw.split(/[／/・]/)) {
        let form = part.replace(/[〜～\s()（）[\]]/g, '');
        if (form.endsWith('ます') && form.length > 3) form = form.slice(0, -2);
        else if (HAN.test(form) && form.endsWith('い') && form.length > 1) form = form.slice(0, -1);
        if (form && (HAN.test(form) || (KATAKANA.test(form) && form.length >= 2))) forms.push({ form, lesson, reading, meaning: word.meaning });
      }
    }
  }
  // Dài trước; cùng độ dài thì bài sớm trước (cùng chữ ở nhiều bài → tính theo bài dạy SỚM nhất).
  forms.sort((left, right) => right.form.length - left.form.length || left.lesson - right.lesson);
  cache.set(catalog, forms);
  return forms;
}

export function laterLessonWords(texts: ReadonlyArray<string>, lesson: number, catalog: KnowledgeCatalog): LaterLessonWord[] {
  const found = new Map<string, LaterLessonWord>();
  for (const text of texts) {
    // Câu mẫu cách chữ theo cụm (あの 方は) — bỏ khoảng trắng để khớp đúng từ (あの方), không đổi nghĩa.
    let rest = text.replace(/[\s　]+/g, '');
    for (const { form, lesson: wordLesson, reading, meaning } of formsOf(catalog)) {
      let index = rest.indexOf(form);
      while (index >= 0) {
        const isLoneKanji = form.length === 1 && HAN.test(form);
        const touchesKanji = isLoneKanji && (HAN.test(rest[index - 1] ?? '') || HAN.test(rest[index + 1] ?? ''));
        if (!touchesKanji) {
          if (wordLesson > lesson && !found.has(form)) found.set(form, { word: form, reading, meaning, lesson: wordLesson });
          rest = `${rest.slice(0, index)}${'　'.repeat(form.length)}${rest.slice(index + form.length)}`;
        }
        index = rest.indexOf(form, index + 1);
      }
    }
  }
  return [...found.values()].sort((left, right) => left.lesson - right.lesson);
}
