import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { AppsGrid } from "../../features/apps/AppsGrid";

export const Route = createFileRoute("/_auth/apps")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">应用集成</Text>
      <AppsGrid />
    </Stack>
  ),
});
