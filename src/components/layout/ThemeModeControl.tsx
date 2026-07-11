import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { useTranslation } from "react-i18next";
import { useUiStore, type ThemeMode } from "../../stores/ui";

const MODES: { value: ThemeMode; labelKey: string }[] = [
  { value: "light", labelKey: "theme.light" },
  { value: "dark", labelKey: "theme.dark" },
  { value: "system", labelKey: "theme.system" },
];

export function ThemeModeControl() {
  const { t } = useTranslation();
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);
  return (
    <SegmentedControl
      label={t("theme.label")}
      size="sm"
      value={themeMode}
      onChange={(value) => setThemeMode(value as ThemeMode)}
    >
      {MODES.map((mode) => (
        <SegmentedControlItem key={mode.value} value={mode.value} label={t(mode.labelKey)} />
      ))}
    </SegmentedControl>
  );
}
