import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TaskBoard } from "../../features/tasks/TaskBoard";

export const Route = createFileRoute("/_auth/tasks")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">任务看板</Text>
      <TaskBoard />
    </Stack>
  ),
});
