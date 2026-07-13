import { useState, type SyntheticEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingsSection";

const FORM_MAX_WIDTH = 640;

type SidebarItemKey = "dashboard" | "tasks" | "apps" | "users";

const SIDEBAR_ITEMS: { key: SidebarItemKey; labelKey: string }[] = [
  { key: "dashboard", labelKey: "settings.display.itemDashboard" },
  { key: "tasks", labelKey: "settings.display.itemTasks" },
  { key: "apps", labelKey: "settings.display.itemApps" },
  { key: "users", labelKey: "settings.display.itemUsers" },
];

export function DisplayForm() {
  const { t } = useTranslation();
  const showToast = useToast();

  const [visibleItems, setVisibleItems] = useState<Record<SidebarItemKey, boolean>>({
    dashboard: true,
    tasks: true,
    apps: true,
    users: true,
  });

  const setItemVisible = (key: SidebarItemKey, value: boolean) => {
    setVisibleItems((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast({ body: t("settings.display.saved"), uniqueID: "settings-display-saved" });
  };

  return (
    <SettingsSection title={t("settings.nav.display")} description={t("settings.display.description")}>
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <Stack direction="vertical" gap={2}>
            <Text type="large">{t("settings.display.sidebarTitle")}</Text>
            <Text type="supporting" color="secondary">
              {t("settings.display.sidebarDescription")}
            </Text>
            <Stack direction="vertical" gap={2}>
              {SIDEBAR_ITEMS.map(({ key, labelKey }) => (
                <CheckboxInput
                  key={key}
                  label={t(labelKey)}
                  value={visibleItems[key]}
                  onChange={(checked) => setItemVisible(key, checked)}
                />
              ))}
            </Stack>
          </Stack>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.display.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
