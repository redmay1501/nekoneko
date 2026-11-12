'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { storyImageCandidates } from '@/features/learning/kanji-story-image';
import type { KanjiStoryAction, KanjiStoryProgress } from '@/features/learning/kanji-story-progress';
import { toContentKey } from '@/features/learning/knowledge-types';
import { postJson } from '@/lib/api/api-client';
import { QUERY_KEYS } from '@/lib/api/query-keys';
import type { KanjiStory, KanjiStoryImage } from '@/types/content';

function postStoryProgress(kanjiId: number, action: KanjiStoryAction) {
  return postJson<{ progress: KanjiStoryProgress }>('/api/kanji-stories/progress', { kanjiId, action });
}

/**
 * Ảnh minh hoạ của câu chuyện — không thay nội dung ảnh, không cắt (object-fit: contain).
 * Thứ tự thử: bản sao trên Storage của app (nếu có) → URL gốc của thư viện → khung "chưa tải được" có link ảnh gốc.
 * Khung cao cố định → không nhảy bố cục khi ảnh tải hay khi đổi sang nguồn dự phòng.
 */
function StoryImage({ image, character }: { image: KanjiStoryImage; character: string }) {
  const candidates = storyImageCandidates(image);
  const candidateKey = candidates.join('|');
  const [failed, setFailed] = useState<{ key: string; count: number }>({ key: candidateKey, count: 0 });
  const failedCount = failed.key === candidateKey ? failed.count : 0;
  const src = candidates[failedCount];
  const imgRef = useRef<HTMLImageElement>(null);
  const markFailed = () => setFailed({ key: candidateKey, count: failedCount + 1 });
  // Ảnh render sẵn từ server có thể lỗi TRƯỚC khi React gắn onError (hydrate) → kiểm tra lại khi mount / đổi nguồn.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailed((current) => ({ key: candidateKey, count: (current.key === candidateKey ? current.count : 0) + 1 }));
  }, [candidateKey, src]);
  if (!src) {
    return (
      <div className="kanji-story-figure is-missing" role="img" aria-label={`Ảnh minh hoạ cho ${character} chưa tải được`}>
        <span aria-hidden="true" className="kanji-story-missing-char jp">{character}</span>
        <span className="tiny muted">Ảnh minh hoạ tạm thời chưa tải được.</span>
        {image.sourceUrl ? <a className="tiny link" href={image.sourceUrl} target="_blank" rel="noopener noreferrer">Xem ảnh gốc ↗</a> : null}
      </div>
    );
  }
  return (
    <figure className="kanji-story-figure">
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh của thư viện (Storage của app hoặc Pixabay / Wikimedia), không qua bộ tối ưu */}
      <img ref={imgRef} key={src} src={src} alt={image.description || image.alt || `Minh hoạ cho ${character}`} width={image.width ?? 4} height={image.height ?? 3}
        loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={markFailed} />
    </figure>
  );
}

function ImageCredit({ image }: { image: KanjiStoryImage }) {
  return (
    <p className="kanji-story-credit">
      Ảnh:{' '}
      {image.sourceUrl ? <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">{image.sourceLabel || image.provider} ↗</a> : image.sourceLabel}
      {image.license ? <> · {image.licenseUrl ? <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license}</a> : image.license}</> : null}
      {image.licenseStatus !== 'verified' ? <> · <span title="Có nguồn nhưng chưa có người kiểm tra quyền dùng thương mại">giấy phép chưa xác minh</span></> : null}
    </p>
  );
}

/**
 * Gợi ý khi ôn (luồng "Cứu kiến thức"): chỉ ảnh + câu chốt của câu chuyện, không phải cả chuyện.
 * Hiện ở bước Gợi ý — sau khi người học đã bấm "Chưa nhớ", trước câu hỏi nhớ lại.
 */
export function KanjiStoryHint({ story, character }: { story: Pick<KanjiStory, 'memoryTip' | 'image'>; character: string }) {
  return (
    <div className="kanji-story is-compact is-hint">
      <span className="kanji-story-eyebrow">✦ Nhớ lại câu chuyện</span>
      <div className={`kanji-story-body ${story.image ? 'has-image' : ''}`}>
        {story.image ? <StoryImage image={story.image} character={character} /> : null}
        {story.memoryTip ? <p className="kanji-story-tip"><b>Câu chốt</b>{story.memoryTip}</p> : null}
      </div>
      {story.image ? <ImageCredit image={story.image} /> : null}
    </div>
  );
}

interface KanjiStoryCardProps {
  story: KanjiStory;
  character: string;
  initialProgress: KanjiStoryProgress;
  /** compact: trong thẻ học của ngày (ảnh thấp hơn, không có từ ứng dụng — thẻ đã có từ ghép). */
  variant?: 'full' | 'compact';
  defaultOpen?: boolean;
}

/**
 * Câu chuyện ghi nhớ của một Kanji — dùng ở trang / khay chi tiết Kanji và thẻ học của ngày (cùng một dữ liệu chuyện).
 * Câu chốt luôn hiện (ngắn, đọc một lần là nhớ); phần kể gập sẵn để trang không thành một đoạn văn dài.
 * Mở chuyện = "đã xem"; bấm "Đã đọc" = "đã đọc". Cả hai KHÔNG đổi mức nhớ — mức nhớ chỉ đổi khi trả lời câu ôn.
 */
export function KanjiStoryCard({ story, character, initialProgress, variant = 'full', defaultOpen = false }: KanjiStoryCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isRead, setIsRead] = useState(initialProgress.read);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  /** Ghi "đã xem" một lần cho mỗi lần thẻ hiện ra (mở / gập nhiều lần không ghi lặp; quay lại trang sau = một lượt mới). */
  const viewRecorded = useRef(false);
  const contentKey = toContentKey('kanji', story.kanjiId);

  function refreshDetail() {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.knowledgeDetail(contentKey) });
  }

  function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !viewRecorded.current) {
      viewRecorded.current = true;
      // Ghi lặng lẽ: lỗi mạng không làm phiền người đang đọc (lần mở sau sẽ ghi lại).
      postStoryProgress(story.kanjiId, 'view').then(refreshDetail, () => { viewRecorded.current = false; });
    }
  }

  async function toggleRead() {
    const next = !isRead;
    setIsRead(next);
    setSaveState('saving');
    try {
      await postStoryProgress(story.kanjiId, next ? 'read' : 'unread');
      setSaveState('idle');
      refreshDetail();
      router.refresh();
    } catch {
      setIsRead(!next);
      setSaveState('error');
    }
  }

  return (
    <section className={`kanji-story ${variant === 'compact' ? 'is-compact' : ''}`} aria-label={`Câu chuyện ghi nhớ chữ ${character}`}>
      <div className="kanji-story-head">
        <span className="kanji-story-eyebrow">✦ {story.title || 'Chuyện nhớ Kanji'}</span>
      </div>
      <div className={`kanji-story-body ${story.image ? 'has-image' : ''}`}>
        {story.image ? <StoryImage image={story.image} character={character} /> : null}
        <div className="kanji-story-text">
          {story.memoryTip ? <p className="kanji-story-tip"><b>Câu chốt</b>{story.memoryTip}</p> : null}
          <button type="button" className="kanji-story-toggle" aria-expanded={isOpen} aria-controls={contentId} onClick={toggleOpen}>
            {isOpen ? 'Thu gọn câu chuyện' : 'Đọc câu chuyện'} <span aria-hidden="true">{isOpen ? '▴' : '▾'}</span>
          </button>
          <p id={contentId} className="kanji-story-content" hidden={!isOpen}>{story.content}</p>
          {variant === 'full' && story.exampleWords.length ? (
            <div className="row wrap" style={{ gap: 6 }}>
              {story.exampleWords.map((word) => (
                <span key={word.word} className="chip"><b className="jp">{word.word}</b>{word.reading ? <span className="jp soft">{word.reading}</span> : null}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="kanji-story-foot">
        {story.image ? <ImageCredit image={story.image} /> : <span />}
        <span className="row" style={{ gap: 6, alignItems: 'center' }}>
          {saveState === 'error' ? <span className="tiny muted" role="status">Chưa lưu được — thử lại nhé.</span> : null}
          <button type="button" className={`btn sm ${isRead ? 'success' : 'ghost'}`} aria-pressed={isRead}
            disabled={saveState === 'saving'} aria-busy={saveState === 'saving'} onClick={toggleRead}>
            {isRead ? '✓ Đã đọc' : 'Đánh dấu đã đọc'}
          </button>
        </span>
      </div>
    </section>
  );
}
