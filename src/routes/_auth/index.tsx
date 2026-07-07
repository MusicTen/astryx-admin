import { createFileRoute } from '@tanstack/react-router';
import { Text } from '@astryxdesign/core/Text';

export const Route = createFileRoute('/_auth/')({
  component: () => <Text type="display-3">仪表盘占位</Text>,
});
