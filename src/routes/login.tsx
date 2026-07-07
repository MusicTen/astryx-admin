import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Center } from '@astryxdesign/core/Center';
import { LoginForm } from '../features/auth/LoginForm';

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  return (
    <Center axis="both" minHeight="100dvh">
      <LoginForm onSuccess={() => void navigate({ to: redirect ?? '/' })} />
    </Center>
  );
}
