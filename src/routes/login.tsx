import { createFileRoute } from '@tanstack/react-router';
import { Text } from '@astryxdesign/core/Text';

export const Route = createFileRoute('/login')({
  component: () => <Text type="display-3">登录页占位</Text>,
});
