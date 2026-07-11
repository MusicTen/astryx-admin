import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ApiError } from "../../lib/http";
import { useAuthStore } from "../../stores/auth";
import { login } from "./api";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const saveAuth = useAuthStore((state) => state.login);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await login({ username, password });
      saveAuth(result.token, result.user);
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : t("login.failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card padding={6} width={380}>
      <Stack direction="vertical" gap={4}>
        <Text type="display-3">Astryx Admin</Text>
        <Text type="supporting" color="secondary">
          {t("login.demoHint")}
        </Text>
        {errorMessage ? <Banner status="error" title={errorMessage} /> : null}
        <FormLayout direction="vertical">
          <TextInput label={t("login.username")} value={username} changeAction={setUsername} isRequired />
          <TextInput
            label={t("login.password")}
            type="password"
            value={password}
            changeAction={setPassword}
            isRequired
          />
        </FormLayout>
        <Button
          label={t("login.submit")}
          variant="primary"
          isLoading={isLoading}
          isDisabled={!username || !password}
          clickAction={handleSubmit}
        />
      </Stack>
    </Card>
  );
}
