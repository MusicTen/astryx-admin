import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Center } from "@astryxdesign/core/Center";
import { Stack } from "@astryxdesign/core/Stack";
import { LanguageControl } from "../components/layout/LanguageControl";
import { LoginForm } from "../features/auth/LoginForm";
import "../features/auth/login-background.css";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  return (
    <Center axis="both" minHeight="100dvh" className="login-page-background">
      <Stack direction="vertical" gap={4}>
        <LoginForm onSuccess={() => void navigate({ to: redirect ?? "/" })} />
        <Center axis="horizontal">
          <LanguageControl />
        </Center>
      </Stack>
    </Center>
  );
}
