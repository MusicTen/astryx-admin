import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../stores/auth';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
