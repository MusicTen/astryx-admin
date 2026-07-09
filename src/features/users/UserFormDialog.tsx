import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import type { User, UserInput, UserRole, UserStatus } from "./types";

const ROLE_OPTIONS = [
  { label: "管理员", value: "admin" },
  { label: "编辑", value: "editor" },
  { label: "访客", value: "viewer" },
];

const STATUS_OPTIONS = [
  { label: "启用", value: "active" },
  { label: "停用", value: "suspended" },
  { label: "已邀请", value: "invited" },
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
      <DialogHeader title={editingUser ? "编辑用户" : "添加用户"} onOpenChange={onOpenChange} />
      <Stack direction="vertical" gap={4}>
        <FormLayout direction="vertical">
          <TextInput
            label="用户名"
            value={form.username}
            changeAction={(username) => setForm((f) => ({ ...f, username }))}
            isRequired
          />
          <TextInput
            label="姓名"
            value={form.name}
            changeAction={(name) => setForm((f) => ({ ...f, name }))}
            isRequired
          />
          <TextInput
            label="邮箱"
            type="email"
            value={form.email}
            changeAction={(email) => setForm((f) => ({ ...f, email }))}
            isRequired
          />
          <TextInput
            label="手机号码"
            value={form.phone}
            changeAction={(phone) => setForm((f) => ({ ...f, phone }))}
          />
          <Selector
            label="角色"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(role) => setForm((f) => ({ ...f, role: role as UserRole }))}
          />
          <Selector
            label="状态"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(status) => setForm((f) => ({ ...f, status: status as UserStatus }))}
          />
        </FormLayout>
        <Stack direction="horizontal" gap={2}>
          <Button label="取消" variant="secondary" clickAction={() => onOpenChange(false)} />
          <Button
            label={editingUser ? "保存" : "创建"}
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
