'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

const SERVER_STATE_STALE_MS = 30_000;

/** TanStack Query cho dữ liệu server ở phía trình duyệt (Coding Standards §14). */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: SERVER_STATE_STALE_MS, retry: 1 } } }),
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
