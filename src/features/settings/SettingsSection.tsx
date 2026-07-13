import type { ReactNode } from "react";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <Stack direction="vertical" gap={4}>
      <Stack direction="vertical" gap={1}>
        <Heading level={2}>{title}</Heading>
        <Text type="supporting" color="secondary">
          {description}
        </Text>
      </Stack>
      <Divider />
      {children}
    </Stack>
  );
}
