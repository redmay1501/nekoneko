import { ListeningPanel } from '@/components/learning/PracticePanels';
import { ListeningTabs } from '@/components/listening/ListeningTabs';
import { VideoLibrary } from '@/components/listening/VideoLibrary';
import { LISTENING_VIDEOS, VIDEO_SOURCES, VIDEO_TOPICS } from '@/features/listening/video-library';
import { watchedVideoIds } from '@/features/listening/video-progress';
import { AudioButton } from '@/components/common/AudioButton';
import { buildListeningPools, buildListeningPractice } from '@/features/learning/skill-practice';
import { getLearnerContext } from '@/features/learning/learner-context';

/** SC-24 · Luyện nghe — nghe trước, hiểu sau. Hai phần: bài nghe sẵn có và thư viện video N5 (content/seed/listening-videos.json). */
export default async function ListeningPage({ searchParams }: { searchParams: Promise<{ 'pham-vi'?: string; muc?: string }> }) {
  const params = await searchParams;
  const { catalog, memoryViews, journeyDay, settings } = await getLearnerContext();
  // Shadowing và nguồn nghe vẫn dựng ở server; bài nghe đổi phạm vi ngay trong trình duyệt (ListeningPanel).
  const practice = buildListeningPractice(catalog, memoryViews, journeyDay);
  return (
    <>
      <h1>Luyện nghe</h1>
      <p className="soft sm" style={{ margin: '4px 0 12px' }}>Nghe từ và câu đã học, hoặc xem video tiếng Nhật cho người mới bắt đầu.</p>
      <ListeningTabs initialTab={params.muc} videoCount={LISTENING_VIDEOS.length}
        videos={<VideoLibrary videos={[...LISTENING_VIDEOS]} sources={VIDEO_SOURCES} topics={VIDEO_TOPICS} watchedIds={watchedVideoIds(settings.gameRecords)} />}
        practice={(
          <>
            <p className="soft sm" style={{ margin: '12px 0 14px' }}>
              Nghe một từ, chọn nghĩa. Chọn phần muốn nghe — kể cả bài chưa học tới. Từ đã học thì được ôn thêm một lần.
            </p>
            <ListeningPanel pools={buildListeningPools(catalog, journeyDay)} initialRange={params['pham-vi']} />
            <div className="sec-h"><h2>Shadowing — nói đuổi theo</h2></div>
            {practice.shadowing.length ? (
              <div className="stack">
                {practice.shadowing.map((pattern) => (
                  <div key={pattern.id} className="card tight">
                    <div className="between">
                      <p className="jp" style={{ fontSize: 17 }}>{pattern.exampleJp}</p>
                      <AudioButton text={pattern.exampleJp} label="Nghe câu mẫu" />
                    </div>
                    <p className="sm muted mt-1">{pattern.exampleVi}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="card tight mt-3.5" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
              <b className="sm">Nguồn nghe gợi ý</b>
              <ul className="sm soft mt-2" style={{ lineHeight: 1.8 }}>
                {practice.resources.map((resource) => <li key={resource.id}>• {resource.source}</li>)}
              </ul>
            </div>
          </>
        )} />
    </>
  );
}
