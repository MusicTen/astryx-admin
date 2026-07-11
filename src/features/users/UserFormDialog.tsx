import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import type { User, UserInput, UserRole, UserStatus } from "./types";

const ROLE_OPTIONS = [
  { labelKey: "users.role.admin", value: "admin" },
  { labelKey: "users.role.editor", value: "editor" },
  { labelKey: "users.role.viewer", value: "viewer" },
];

const STATUS_OPTIONS = [
  { labelKey: "users.status.active", value: "active" },
  { labelKey: "users.status.suspended", value: "suspended" },
  { labelKey: "users.status.invited", value: "invited" },
];

const EMPTY: UserInput = {
  username: "",
  name: "",
  email: "",
  phone: "",
  role: "viewer",
  status: "invited",
};

interface UserFormDialogProps {
  isOpen: boolean;
  editingUser: User | null;
  isSubmitting: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (input: UserInput) => void;
}

export function UserFormDialog({
  isOpen,
  editingUser,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<UserInput>(EMPTY);

  useEffect(() => {
    if (isOpen) {
      setForm(
        editingUser
          ? {
              username: editingUser.username,
              name: editingUser.name,
              email: editingUser.email,
              phone: editingUser.phone,
              role: editingUser.role,
              status: editingUser.status,
            }
          : EMPTY,
      );
    }
  }, [isOpen, editingUser]);

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
      <DialogHeader
        title={editingUser ? t("users.form.editTitle") : t("users.form.addTitle")}
        onOpenChange={onOpenChange}
      />
      <Stack direction="vertical" gap={4}>
        <FormLayout direction="vertical">
          <TextInput
            label={t("users.columns.username")}
            value={form.username}
            changeAction={(username) => setForm((f) => ({ ...f, username }))}
            isRequired
          />
          <TextInput
            label={t("users.columns.name")}
            value={form.name}
            changeAction={(name) => setForm((f) => ({ ...f, name }))}
            isRequired
          />
          <TextInput
            label={t("users.columns.email")}
            type="email"
            value={form.email}
            changeAction={(email) => setForm((f) => ({ ...f, email }))}
            isRequired
          />
          <TextInput
            label={t("users.columns.phone")}
            value={form.phone}
            changeAction={(phone) => setForm((f) => ({ ...f, phone }))}
          />
          <Selector
            label={t("users.columns.role")}
            options={ROLE_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value }))}
            value={form.role}
            onChange={(role) => setForm((f) => ({ ...f, role: role as UserRole }))}
          />
          <Selector
            label={t("users.columns.status")}
            options={STATUS_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value }))}
            value={form.status}
            onChange={(status) => setForm((f) => ({ ...f, status: status as UserStatus }))}
          />
        </FormLayout>
        <Stack direction="horizontal" gap={2}>
          <Button
            label={t("common.cancel")}
            variant="secondary"
            clickAction={() => onOpenChange(false)}
          />
          <Button
            label={editingUser ? t("common.save") : t("common.create")}
            variant="primary"
            isLoading={isSubmitting}
            isDisabled={!form.username || !form.name || !form.email}
            clickAction={() => onSubmit(form)}
          />
        </Stack>
      </Stack>
    </Dialog>
  );
}
