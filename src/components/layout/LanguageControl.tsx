import { IconButton } from "@astryxdesign/core/IconButton";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore, type Language } from "../../stores/ui";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export function LanguageControl({ isIconOnly = false }: { isIconOnly?: boolean }) {
  const { t } = useTranslation();
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);

  if (isIconOnly) {
    const nextLanguage: Language = language === "zh" ? "en" : "zh";
    return (
      <IconButton
        label={t("language.toggle")}
        tooltip={t("language.toggle")}
        icon={<Languages size={16} />}
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(nextLanguage)}
      />
    );
  }

  return (
    <SegmentedControl
      label={t("language.label")}
      size="sm"
      value={language}
      onChange={(value) => setLanguage(value as Language)}
    >
      {LANGUAGES.map((item) => (
        <SegmentedControlItem key={item.value} value={item.value} label={item.label} />
      ))}
    </SegmentedControl>
  );
}
