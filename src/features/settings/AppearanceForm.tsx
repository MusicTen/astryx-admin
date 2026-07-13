import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslation } from "react-i18next";
import { LanguageControl } from "../../components/layout/LanguageControl";
import { useUiStore } from "../../stores/ui";
import { SettingsSection } from "./SettingsSection";

// 预览色板刻意固定：两张卡各自展示目标主题的样子，不随当前主题切换，
// 语义 token 会跟随 light-dark() 变化导致两张卡长得一样，所以这里例外地使用固定色值。
const THEME_PREVIEW_PALETTES = {
  light: { surface: "#ECEDEF", card: "#FFFFFF", bar: "#D9DCE0" },
  dark: { surface: "#111112", card: "#28292C", bar: "#5A5E66" },
} as const;

type PreviewMode = keyof typeof THEME_PREVIEW_PALETTES;

const FORM_MAX_WIDTH = 640;

function ThemePreview({ mode }: { mode: PreviewMode }) {
  const palette = THEME_PREVIEW_PALETTES[mode];
  const barStyle = { backgroundColor: palette.bar, borderRadius: "var(--radius-inner)" };
  return (
    <Stack
      direction="vertical"
      gap={1.5}
      padding={2}
      width={172}
      style={{ backgroundColor: palette.surface, borderRadius: "var(--radius-element)" }}
    >
      <Stack
        direction="vertical"
        gap={1}
        padding={2}
        style={{ backgroundColor: palette.card, borderRadius: "var(--radius-inner)" }}
      >
        <Stack height={8} width={72} style={barStyle} />
        <Stack height={8} width={104} style={barStyle} />
      </Stack>
      <Stack
        direction="horizontal"
        gap={1}
        padding={2}
        vAlign="center"
        style={{ backgroundColor: palette.card, borderRadius: "var(--radius-inner)" }}
      >
        <Stack height={12} width={12} style={{ backgroundColor: palette.bar, borderRadius: "var(--radius-full)" }} />
        <Stack height={8} width={88} style={barStyle} />
      </Stack>
    </Stack>
  );
}

export function AppearanceForm() {
  const { t } = useTranslation();
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);

  return (
    <SettingsSection
      title={t("settings.nav.appearance")}
      description={t("settings.appearance.description")}
    >
      <Stack direction="vertical" gap={6} maxWidth={FORM_MAX_WIDTH}>
        <Stack direction="vertical" gap={2}>
          <Text type="large">{t("settings.appearance.theme")}</Text>
          <Text type="supporting" color="secondary">
            {t("settings.appearance.themeDescription")}
          </Text>
          <Stack direction="horizontal" gap={4} wrap="wrap">
            {(["light", "dark"] as const).map((mode) => (
              <Stack key={mode} direction="vertical" gap={1.5} hAlign="center">
                <SelectableCard
                  label={t(`theme.${mode}`)}
                  isSelected={themeMode === mode}
                  onChange={() => setThemeMode(mode)}
                  padding={1.5}
                >
                  <ThemePreview mode={mode} />
                </SelectableCard>
                <Text type="supporting">{t(`theme.${mode}`)}</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
        <Stack direction="vertical" gap={2}>
          <Text type="large">{t("settings.appearance.language")}</Text>
          <Text type="supporting" color="secondary">
            {t("settings.appearance.languageDescription")}
          </Text>
          <Stack direction="horizontal">
            <LanguageControl />
          </Stack>
        </Stack>
      </Stack>
    </SettingsSection>
  );
}
