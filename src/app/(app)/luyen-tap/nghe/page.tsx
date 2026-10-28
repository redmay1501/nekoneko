import { ListeningPanel } from '@/components/learning/PracticePanels';
import { ListeningTabs } from '@/components/listening/ListeningTabs';
import { VideoLibrary } from '@/components/listening/VideoLibrary';
import { LISTENING_VIDEOS, VIDEO_SOURCES, VIDEO_TOPICS } from '@/features/listening/video-library';
import { watchedVideoIds } from '@/features/listening/video-progress';
import { buildListeningPools } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-24 · Luyện nghe — nghe trước, hiểu sau. Hai phần: bài nghe sẵn có và thư viện video N5 (content/seed/listening-videos.json). */
export default async function ListeningPage({ searchParams }: { searchParams: Promise<{ 'pham-vi'?: string; muc?: string }> }) {
  const params = await searchParams;
  const { catalog, journeyDay, memoryViews, settings } = await getLearnerContext();
  return (
    <>
      <h1>Luyện nghe</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>Nghe từ và câu đã học, hoặc xem video tiếng Nhật cho người mới bắt đầu.</p>
      <ListeningTabs initialTab={params.muc} videoCount={LISTENING_VIDEOS.length}
        videos={<VideoLibrary videos={[...LISTENING_VIDEOS]} sources={VIDEO_SOURCES} topics={VIDEO_TOPICS} watchedIds={watchedVideoIds(settings.gameRecords)} />}
        practice={(
          <>
            <p className="soft sm" style={{ margin: '12px 0 14px' }}>
              Nghe một từ, chọn nghĩa. Chọn “Đã học” để nghe lại những từ bạn đã học, “Cần ôn” cho từ đang mờ — hoặc một bài bất kỳ, kể cả bài chưa học tới.
            </p>
            <ListeningPanel pools={buildListeningPools(catalog, journeyDay, memoryViews)} initialRange={params['pham-vi']} />
          </>
        )} />
    </>
  );
}
