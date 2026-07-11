import { Avatar } from "@astryxdesign/core/Avatar";
import { Divider } from "@astryxdesign/core/Divider";
import { DropdownMenu, DropdownMenuItem } from "@astryxdesign/core/DropdownMenu";
import { Kbd } from "@astryxdesign/core/Kbd";
import { Text } from "@astryxdesign/core/Text";
import { useNavigate } from "@tanstack/react-router";
import { Palette, UserCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";

export function UserMenu() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return (
    <DropdownMenu
      button={{
        label: user?.name ?? t("userMenu.account"),
        icon: <Avatar name={user?.name ?? "?"} size="tiny" />,
        isIconOnly: true,
        variant: "ghost",
        size: "sm",
      }}
      hasChevron={false}
    >
      <DropdownMenuItem label={user?.name ?? t("userMenu.account")} description={user?.email ?? "-"} />
      <Divider />
      <DropdownMenuItem
        icon={UserCircle}
        label={t("userMenu.profile")}
        endContent={<Kbd keys="shift+mod+p" />}
        onClick={() => void navigate({ to: "/settings/profile" })}
      />
      <DropdownMenuItem
        icon={Palette}
        label={t("userMenu.appearanceSettings")}
        endContent={<Kbd keys="mod+s" />}
        onClick={() => void navigate({ to: "/settings/appearance" })}
      />
      <Divider />
      <DropdownMenuItem
        label={<Text style={{ color: "var(--color-error)" }}>{t("userMenu.logout")}</Text>}
        endContent={<Kbd keys="shift+mod+q" />}
        onClick={() => {
          logout();
          void navigate({ to: "/login" });
        }}
      />
    </DropdownMenu>
  );
}
