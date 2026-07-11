import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore, type ThemeMode } from "../../stores/ui";

const MODES: { value: ThemeMode; labelKey: string; icon: LucideIcon }[] = [
  { value: "light", labelKey: "theme.light", icon: Sun },
  { value: "dark", labelKey: "theme.dark", icon: Moon },
  { value: "system", labelKey: "theme.system", icon: Monitor },
];

export function ThemeModeControl({ isIconOnly = false }: { isIconOnly?: boolean }) {
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
      {MODES.map(({ value, labelKey, icon: Icon }) => (
        <SegmentedControlItem
          key={value}
          value={value}
          label={t(labelKey)}
          icon={isIconOnly ? <Icon size={16} /> : undefined}
          isLabelHidden={isIconOnly}
        />
      ))}
    </SegmentedControl>
  );
}
