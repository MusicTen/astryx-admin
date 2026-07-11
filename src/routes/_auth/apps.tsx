import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { AppsGrid } from "../../features/apps/AppsGrid";

export const Route = createFileRoute("/_auth/apps")({
  component: () => {
    const { t } = useTranslation();
    return (
      <Stack direction="vertical" gap={4}>
        <Text type="display-3">{t("apps.title")}</Text>
        <AppsGrid />
      </Stack>
    );
  },
});
