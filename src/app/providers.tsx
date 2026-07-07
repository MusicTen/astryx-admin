import type { ReactNode } from 'react';
import { Theme } from '@astryxdesign/core';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { useUiStore } from '../stores/ui';
import { SwrProvider } from '../lib/swr';

export function AppProviders({ children }: { children: ReactNode }) {
  const themeMode = useUiStore((state) => state.themeMode);
  return (
    <Theme theme={neutralTheme} mode={themeMode}>
      <SwrProvider>{children}</SwrProvider>
    </Theme>
  );
}
