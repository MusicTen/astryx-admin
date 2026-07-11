import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export type Language = "zh" | "en";

export function detectLanguage(browserLanguage: string | undefined): Language {
  if (!browserLanguage) return "zh";
  return browserLanguage.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function getInitialLanguage(): Language {
  return detectLanguage(typeof navigator === "undefined" ? undefined : navigator.language);
}

export function initI18n(language: Language): void {
  if (i18n.isInitialized) return;
  void i18n.use(initReactI18next).init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: language,
    fallbackLng: "zh",
    interpolation: { escapeValue: false },
  });
}
