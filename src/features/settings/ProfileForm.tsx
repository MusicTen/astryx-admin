import { useState, type SyntheticEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";
import { SettingsSection } from "./SettingsSection";

const BIO_MAX_LENGTH = 240;
const FORM_MAX_WIDTH = 640;

export function ProfileForm() {
  const { t } = useTranslation();
  const showToast = useToast();
  const user = useAuthStore((state) => state.user);

  const [username, setUsername] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isUsernameMissing = username.trim() === "";

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    if (isUsernameMissing) {
      return;
    }
    showToast({ body: t("settings.profile.saved"), uniqueID: "settings-profile-saved" });
  };

  return (
    <SettingsSection title={t("settings.nav.profile")} description={t("settings.profile.description")}>
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <FormLayout>
            <TextInput
              label={t("settings.profile.username")}
              value={username}
              onChange={setUsername}
              description={t("settings.profile.usernameDescription")}
              isRequired
              status={
                hasSubmitted && isUsernameMissing
                  ? { type: "error", message: t("settings.profile.usernameRequired") }
                  : undefined
              }
            />
            <Selector
              label={t("settings.profile.email")}
              value={email}
              onChange={setEmail}
              options={user ? [user.email] : []}
              placeholder={t("settings.profile.emailPlaceholder")}
              description={t("settings.profile.emailDescription")}
            />
            <TextArea
              label={t("settings.profile.bio")}
              value={bio}
              onChange={setBio}
              placeholder={t("settings.profile.bioPlaceholder")}
              description={t("settings.profile.bioDescription")}
              maxLength={BIO_MAX_LENGTH}
            />
            <TextInput
              label={t("settings.profile.urlWebsite")}
              value={websiteUrl}
              onChange={setWebsiteUrl}
              description={t("settings.profile.urlsDescription")}
              placeholder="https://example.com"
            />
            <TextInput
              label={t("settings.profile.urlSocial")}
              value={socialUrl}
              onChange={setSocialUrl}
              placeholder="https://x.com/username"
            />
          </FormLayout>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.profile.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
