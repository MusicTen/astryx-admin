import { describe, expect, it } from "vitest";
import { getBreadcrumbLabels } from "../../components/layout/PageBreadcrumbs";
import zh from "../../i18n/locales/zh.json";
import { SETTINGS_NAV } from "./nav";

describe("SETTINGS_NAV", () => {
  it("包含 5 个子页，href 与 key 一一对应且唯一", () => {
    expect(SETTINGS_NAV).toHaveLength(5);
    expect(new Set(SETTINGS_NAV.map((item) => item.href)).size).toBe(5);
    for (const item of SETTINGS_NAV) {
      expect(item.href).toBe(`/settings/${item.key}`);
    }
  });

  it("labelKey 指向 settings.nav 下的现存文案", () => {
    for (const item of SETTINGS_NAV) {
      expect(item.labelKey).toBe(`settings.nav.${item.key}`);
      expect(zh.settings.nav[item.key]).toBeTypeOf("string");
    }
  });

  it("每个子页在 breadcrumbs 中都有对应映射", () => {
    for (const item of SETTINGS_NAV) {
      expect(getBreadcrumbLabels(item.href)).toEqual(["nav.settings", item.labelKey]);
    }
  });
});
