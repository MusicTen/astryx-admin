import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { ThemeModeControl } from "../../components/layout/ThemeModeControl";

export function AppearanceCard() {
  return (
    <Card padding={6} width={420}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="vertical" gap={1}>
          <Text type="large">外观</Text>
          <Text type="supporting" color="secondary">
            调整界面的主题模式
          </Text>
        </Stack>
        <ThemeModeControl />
      </Stack>
    </Card>
  );
}
