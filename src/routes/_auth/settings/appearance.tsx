import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { AppearanceCard } from "../../../features/settings/AppearanceCard";

export const Route = createFileRoute("/_auth/settings/appearance")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">外观设置</Text>
      <AppearanceCard />
    </Stack>
  ),
});
