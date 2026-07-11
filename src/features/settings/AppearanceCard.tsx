import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslation } from "react-i18next";
import { LanguageControl } from "../../components/layout/LanguageControl";
import { ThemeModeControl } from "../../components/layout/ThemeModeControl";

export function AppearanceCard() {
  const { t } = useTranslation();
  return (
    <Card padding={6} width={420}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="vertical" gap={1}>
          <Text type="large">{t("settings.appearance.cardTitle")}</Text>
          <Text type="supporting" color="secondary">
            {t("settings.appearance.cardDescription")}
          </Text>
        </Stack>
        <Stack direction="vertical" gap={2}>
          <Text type="supporting">{t("theme.label")}</Text>
          <ThemeModeControl />
        </Stack>
        <Stack direction="vertical" gap={2}>
          <Text type="supporting">{t("language.label")}</Text>
          <LanguageControl />
        </Stack>
      </Stack>
    </Card>
  );
}
