import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TaskBoard } from "../../features/tasks/TaskBoard";

export const Route = createFileRoute("/_auth/tasks")({
  component: () => {
    const { t } = useTranslation();
    return (
      <Stack direction="vertical" gap={4}>
        <Text type="display-3">{t("tasks.title")}</Text>
        <TaskBoard />
      </Stack>
    );
  },
});
