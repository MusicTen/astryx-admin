import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";

export function ProfileCard() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <Card padding={6} width={420}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="horizontal" gap={3}>
          <Avatar name={user?.name ?? "?"} size="large" />
          <Stack direction="vertical" gap={1}>
            <Text type="large">{user?.name ?? t("settings.profile.notLoggedIn")}</Text>
            <Text type="supporting" color="secondary">
              {user?.email ?? "-"}
            </Text>
          </Stack>
        </Stack>
        <Button label={t("userMenu.logout")} variant="secondary" clickAction={handleLogout} />
      </Stack>
    </Card>
  );
}
