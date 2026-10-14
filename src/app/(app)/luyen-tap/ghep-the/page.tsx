import { redirect } from 'next/navigation';

/** Ghép thẻ đã chuyển vào mục Trò chơi — giữ đường dẫn cũ (kèm phạm vi đã chọn) cho link / dấu trang cũ. */
export default async function OldMatchGamePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = new URLSearchParams(Object.entries(await searchParams).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  redirect(`/tro-choi/ghep-the${params.size ? `?${params}` : ''}`);
}
