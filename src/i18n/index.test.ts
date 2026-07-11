import { describe, expect, it } from "vitest";
import i18n from "i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { detectLanguage, initI18n } from "./index";

describe("detectLanguage", () => {
  it("zh 开头的浏览器语言返回 zh", () => {
    expect(detectLanguage("zh-CN")).toBe("zh");
    expect(detectLanguage("zh-TW")).toBe("zh");
    expect(detectLanguage("zh")).toBe("zh");
    expect(detectLanguage("ZH-CN")).toBe("zh");
  });

  it("非 zh 语言返回 en", () => {
    expect(detectLanguage("en-US")).toBe("en");
    expect(detectLanguage("ja")).toBe("en");
  });

  it("无浏览器语言时回退 zh", () => {
    expect(detectLanguage(undefined)).toBe("zh");
    expect(detectLanguage("")).toBe("zh");
  });
});

const PLURAL_SUFFIX_PATTERN = /_(?:one|other)$/;

function normalizePluralKey(path: string): string {
  return path.replace(PLURAL_SUFFIX_PATTERN, "");
}

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const rawKeys = Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
  return Array.from(new Set(rawKeys.map(normalizePluralKey)));
}

describe("翻译资源", () => {
  it("zh 与 en 的 key 集合完全一致（忽略 i18next 复数后缀 _one/_other）", () => {
    expect(flattenKeys(en as Record<string, unknown>).sort()).toEqual(
      flattenKeys(zh as Record<string, unknown>).sort(),
    );
  });
});

describe("英文复数形态（i18next plural rules）", () => {
  initI18n("en");
  const t = i18n.getFixedT("en");

  it("count=1 时使用单数文案", () => {
    expect(t("users.batchDeleted", { count: 1 })).toBe("Deleted 1 user");
    expect(t("dashboard.recentSales.summary", { count: 1 })).toBe("1 sale closed this month");
  });

  it("count>1 时使用复数文案", () => {
    expect(t("users.batchDeleted", { count: 3 })).toBe("Deleted 3 users");
  });
});
