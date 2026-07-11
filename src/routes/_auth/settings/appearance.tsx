import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslation } from "react-i18next";
import { AppearanceCard } from "../../../features/settings/AppearanceCard";

export const Route = createFileRoute("/_auth/settings/appearance")({
  component: () => {
    const { t } = useTranslation();
    return (
      <Stack direction="vertical" gap={4}>
        <Text type="display-3">{t("settings.appearance.pageTitle")}</Text>
        <AppearanceCard />
      </Stack>
    );
  },
});
