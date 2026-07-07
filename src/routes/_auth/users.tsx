import { createFileRoute } from '@tanstack/react-router';
import { Text } from '@astryxdesign/core/Text';

export const Route = createFileRoute('/_auth/users')({
  component: () => <Text type="display-3">用户管理占位</Text>,
});
