import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslation } from "react-i18next";
import { ProfileCard } from "../../../features/settings/ProfileCard";

export const Route = createFileRoute("/_auth/settings/profile")({
  component: () => {
    const { t } = useTranslation();
    return (
      <Stack direction="vertical" gap={4}>
        <Text type="display-3">{t("settings.profile.pageTitle")}</Text>
        <ProfileCard />
      </Stack>
    );
  },
});
