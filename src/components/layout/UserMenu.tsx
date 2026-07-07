import { Avatar } from '@astryxdesign/core/Avatar';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Stack } from '@astryxdesign/core/Stack';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/auth';

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return (
    <Stack direction="horizontal" gap={2}>
      <Avatar name={user?.name ?? '?'} size="small" />
      <DropdownMenu
        button={{ label: user?.name ?? '账号', variant: 'ghost', size: 'sm' }}
        items={[
          {
            label: '退出登录',
            onClick: () => {
              logout();
              void navigate({ to: '/login' });
            },
          },
        ]}
      />
    </Stack>
  );
}
