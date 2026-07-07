import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from './http';

export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, shouldRetryOnError: false, revalidateOnFocus: false }}>
      {children}
    </SWRConfig>
  );
}
