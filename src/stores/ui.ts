import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UiState {
  themeMode: ThemeMode;
  isSideNavCollapsed: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setSideNavCollapsed: (isCollapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    immer((set) => ({
      themeMode: 'system',
      isSideNavCollapsed: false,
      setThemeMode: (mode) =>
        set((state) => {
          state.themeMode = mode;
        }),
      setSideNavCollapsed: (isCollapsed) =>
        set((state) => {
          state.isSideNavCollapsed = isCollapsed;
        }),
    })),
    { name: 'astryx-admin-ui' },
  ),
);
