import { useState, type SyntheticEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Stack } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingsSection";

const FORM_MAX_WIDTH = 640;

type NotifyMode = "all" | "mentions" | "none";

interface EmailToggle {
  key: "communication" | "marketing" | "social";
  labelKey: string;
  descriptionKey: string;
}

const EMAIL_TOGGLES: EmailToggle[] = [
  {
    key: "communication",
    labelKey: "settings.notifications.emailCommunication",
    descriptionKey: "settings.notifications.emailCommunicationDescription",
  },
  {
    key: "marketing",
    labelKey: "settings.notifications.emailMarketing",
    descriptionKey: "settings.notifications.emailMarketingDescription",
  },
  {
    key: "social",
    labelKey: "settings.notifications.emailSocial",
    descriptionKey: "settings.notifications.emailSocialDescription",
  },
];

export function NotificationsForm() {
  const { t } = useTranslation();
  const showToast = useToast();

  const [notifyMode, setNotifyMode] = useState<NotifyMode>("all");
  const [emailPrefs, setEmailPrefs] = useState<Record<EmailToggle["key"], boolean>>({
    communication: false,
    marketing: false,
    social: true,
  });

  const setEmailPref = (key: EmailToggle["key"], value: boolean) => {
    setEmailPrefs((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast({ body: t("settings.notifications.saved"), uniqueID: "settings-notifications-saved" });
  };

  return (
    <SettingsSection
      title={t("settings.nav.notifications")}
      description={t("settings.notifications.description")}
    >
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <RadioList
            label={t("settings.notifications.notifyAbout")}
            value={notifyMode}
            onChange={(value) => setNotifyMode(value as NotifyMode)}
          >
            <RadioListItem value="all" label={t("settings.notifications.notifyAll")} />
            <RadioListItem value="mentions" label={t("settings.notifications.notifyMentions")} />
            <RadioListItem value="none" label={t("settings.notifications.notifyNone")} />
          </RadioList>
          <Stack direction="vertical" gap={3}>
            <Heading level={3}>{t("settings.notifications.emailTitle")}</Heading>
            {EMAIL_TOGGLES.map(({ key, labelKey, descriptionKey }) => (
              <Card key={key} padding={4}>
                <Switch
                  label={t(labelKey)}
                  description={t(descriptionKey)}
                  value={emailPrefs[key]}
                  onChange={(checked) => setEmailPref(key, checked)}
                  labelPosition="start"
                  labelSpacing="spread"
                />
              </Card>
            ))}
          </Stack>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.notifications.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
