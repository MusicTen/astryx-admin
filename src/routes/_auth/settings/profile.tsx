import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { ProfileCard } from "../../../features/settings/ProfileCard";

export const Route = createFileRoute("/_auth/settings/profile")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">个人资料</Text>
      <ProfileCard />
    </Stack>
  ),
});
