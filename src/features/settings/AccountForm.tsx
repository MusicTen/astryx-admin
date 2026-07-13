import { useState, type SyntheticEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import type { ISODateString } from "@astryxdesign/core/Calendar";
import { DateInput } from "@astryxdesign/core/DateInput";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";
import { SettingsSection } from "./SettingsSection";

const FORM_MAX_WIDTH = 640;
// 演示字段：与界面语言无关，所以直接用语言自称，不走 i18n
const DEMO_LANGUAGE_OPTIONS = ["中文", "English", "Español", "Français", "日本語"];
const TODAY = new Date().toISOString().slice(0, 10) as ISODateString;

export function AccountForm() {
  const { t } = useTranslation();
  const showToast = useToast();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState(user?.name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState<ISODateString | undefined>(undefined);
  const [language, setLanguage] = useState("");

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast({ body: t("settings.account.saved"), uniqueID: "settings-account-saved" });
  };

  return (
    <SettingsSection title={t("settings.nav.account")} description={t("settings.account.description")}>
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <FormLayout>
            <TextInput
              label={t("settings.account.name")}
              value={name}
              onChange={setName}
              description={t("settings.account.nameDescription")}
            />
            <DateInput
              label={t("settings.account.dob")}
              value={dateOfBirth}
              onChange={setDateOfBirth}
              description={t("settings.account.dobDescription")}
              max={TODAY}
              hasClear
            />
            <Selector
              label={t("settings.account.language")}
              value={language}
              onChange={setLanguage}
              options={DEMO_LANGUAGE_OPTIONS}
              placeholder={t("settings.account.languagePlaceholder")}
              description={t("settings.account.languageDescription")}
            />
          </FormLayout>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.account.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
