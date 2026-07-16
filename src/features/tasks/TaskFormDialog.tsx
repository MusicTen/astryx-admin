import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useUsers } from "../users";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "./types";

const STATUS_OPTIONS: { labelKey: string; value: TaskStatus }[] = [
  { labelKey: "tasks.status.backlog", value: "backlog" },
  { labelKey: "tasks.status.inProgress", value: "in-progress" },
  { labelKey: "tasks.status.inReview", value: "in-review" },
  { labelKey: "tasks.status.done", value: "done" },
];

const PRIORITY_OPTIONS: { labelKey: string; value: TaskPriority }[] = [
  { labelKey: "tasks.priority.low", value: "low" },
  { labelKey: "tasks.priority.medium", value: "medium" },
  { labelKey: "tasks.priority.high", value: "high" },
  { labelKey: "tasks.priority.urgent", value: "urgent" },
];

const EMPTY: TaskInput = {
  title: "",
  status: "backlog",
  priority: "medium",
  assigneeId: "",
  labels: [],
};

const DRAWER_HEIGHT = "100vh";

interface TaskFormDialogProps {
  isOpen: boolean;
  editingTask: Task | null;
  isSubmitting: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (input: TaskInput) => void;
}

export function TaskFormDialog({
  isOpen,
  editingTask,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: TaskFormDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TaskInput>(EMPTY);
  const { users } = useUsers({ page: 1, pageSize: 100, keyword: "" });
  const assigneeOptions = users.map((u) => ({ label: u.name, value: u.id }));

  useEffect(() => {
    if (isOpen) {
      setForm(
        editingTask
          ? {
              title: editingTask.title,
              status: editingTask.status,
              priority: editingTask.priority,
              assigneeId: editingTask.assigneeId,
              labels: editingTask.labels,
            }
          : EMPTY,
      );
    }
  }, [isOpen, editingTask]);

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={420}
      maxHeight={DRAWER_HEIGHT}
      position={{ top: 0, right: 0 }}
      style={{ height: DRAWER_HEIGHT }}
    >
      <DialogHeader title={editingTask ? t("tasks.form.editTitle") : t("tasks.form.createTitle")} onOpenChange={onOpenChange} />
      <Stack direction="vertical" gap={4}>
        <FormLayout direction="vertical">
          <TextInput
            label={t("tasks.form.title")}
            value={form.title}
            changeAction={(title) => setForm((f) => ({ ...f, title }))}
            isRequired
          />
          <Selector
            label={t("tasks.form.status")}
            options={STATUS_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value }))}
            value={form.status}
            onChange={(status) => setForm((f) => ({ ...f, status: status as TaskStatus }))}
          />
          <Selector
            label={t("tasks.form.priority")}
            options={PRIORITY_OPTIONS.map((o) => ({ label: t(o.labelKey), value: o.value }))}
            value={form.priority}
            onChange={(priority) => setForm((f) => ({ ...f, priority: priority as TaskPriority }))}
          />
          <Selector
            label={t("tasks.form.assignee")}
            options={assigneeOptions}
            value={form.assigneeId}
            onChange={(assigneeId) => setForm((f) => ({ ...f, assigneeId }))}
          />
          <TextInput
            label={t("tasks.form.tags")}
            value={form.labels.join(", ")}
            changeAction={(value) =>
              setForm((f) => ({
                ...f,
                labels: value
                  .split(",")
                  .map((label) => label.trim())
                  .filter(Boolean),
              }))
            }
          />
        </FormLayout>
        <Stack direction="horizontal" gap={2}>
          <Button label={t("common.cancel")} variant="secondary" clickAction={() => onOpenChange(false)} />
          <Button
            label={editingTask ? t("common.save") : t("common.create")}
            variant="primary"
            isLoading={isSubmitting}
            isDisabled={!form.title || !form.assigneeId}
            clickAction={() => onSubmit(form)}
          />
        </Stack>
      </Stack>
    </Dialog>
  );
}
