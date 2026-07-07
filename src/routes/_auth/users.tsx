import { createFileRoute } from '@tanstack/react-router';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { UserTable } from '../../features/users/UserTable';

export const Route = createFileRoute('/_auth/users')({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">用户管理</Text>
      <UserTable />
    </Stack>
  ),
});
