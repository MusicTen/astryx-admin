import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { getInitialLanguage, type Language } from "../i18n";

export type ThemeMode = "light" | "dark" | "system";
export type { Language };

interface UiState {
  themeMode: ThemeMode;
  isSideNavCollapsed: boolean;
  language: Language;
  setThemeMode: (mode: ThemeMode) => void;
  setSideNavCollapsed: (isCollapsed: boolean) => void;
  setLanguage: (language: Language) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    immer((set) => ({
      themeMode: "system",
      isSideNavCollapsed: false,
      language: getInitialLanguage(),
      setThemeMode: (mode) =>
        set((state) => {
          state.themeMode = mode;
        }),
      setSideNavCollapsed: (isCollapsed) =>
        set((state) => {
          state.isSideNavCollapsed = isCollapsed;
        }),
      setLanguage: (language) =>
        set((state) => {
          state.language = language;
        }),
    })),
    {
      name: "astryx-admin-ui",
      merge: (persisted, current) => {
        // localStorage 里的非法 language 值(如手改或旧版本)回退到浏览器检测值
        const merged = { ...current, ...(persisted as Partial<UiState>) };
        if (merged.language !== "zh" && merged.language !== "en") {
          merged.language = getInitialLanguage();
        }
        return merged;
      },
    },
  ),
);
