import { expect, test } from "vitest";
import { useUiStore } from "./ui";

test("主题模式与侧边栏折叠可更新", () => {
  useUiStore.getState().setThemeMode("dark");
  expect(useUiStore.getState().themeMode).toBe("dark");
  useUiStore.getState().setSideNavCollapsed(true);
  expect(useUiStore.getState().isSideNavCollapsed).toBe(true);
});
