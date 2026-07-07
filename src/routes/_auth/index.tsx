import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { StatCards } from "../../features/dashboard/StatCards";

export const Route = createFileRoute("/_auth/")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">仪表盘</Text>
      <StatCards />
    </Stack>
  ),
});
