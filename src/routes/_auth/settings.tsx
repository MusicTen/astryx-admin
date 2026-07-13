import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Divider } from "@astryxdesign/core/Divider";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslation } from "react-i18next";
import { SETTINGS_NAV } from "../../features/settings/nav";

export const Route = createFileRoute("/_auth/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Stack direction="vertical" gap={4}>
      <Stack direction="vertical" gap={1}>
        <Text type="display-3">{t("settings.title")}</Text>
        <Text type="supporting" color="secondary">
          {t("settings.description")}
        </Text>
      </Stack>
      <Divider />
      <Layout
        height="auto"
        start={
          <LayoutPanel hasDivider={false} width={260} padding={2}>
            <List density="balanced">
              {SETTINGS_NAV.map(({ key, href, labelKey, icon: Icon }) => (
                <ListItem
                  key={key}
                  label={t(labelKey)}
                  href={href}
                  isSelected={pathname === href}
                  startContent={<Icon size={16} />}
                />
              ))}
            </List>
          </LayoutPanel>
        }
        content={
          <LayoutContent padding={4}>
            <Outlet />
          </LayoutContent>
        }
      />
    </Stack>
  );
}
