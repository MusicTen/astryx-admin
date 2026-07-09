import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useUsers } from "../users/useUsers";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "./types";

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "待办", value: "backlog" },
  { label: "进行中", value: "in-progress" },
  { label: "评审中", value: "in-review" },
  { label: "已完成", value: "done" },
];

const PRIORITY_OPTIONS: { label: string; value: TaskPriority }[] = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
  { label: "紧急", value: "urgent" },
];

const EMPTY: TaskInput = {
  title: "",
  status: "backlog",
  priority: "medium",
  assigneeId: "",
  labels: [],
};

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
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
      <DialogHeader title={editingTask ? "编辑任务" : "新建任务"} onOpenChange={onOpenChange} />
      <Stack direction="vertical" gap={4}>
        <FormLayout direction="vertical">
          <TextInput
            label="标题"
            value={form.title}
            changeAction={(title) => setForm((f) => ({ ...f, title }))}
            isRequired
          />
          <Selector
            label="状态"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(status) => setForm((f) => ({ ...f, status: status as TaskStatus }))}
          />
          <Selector
            label="优先级"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(priority) => setForm((f) => ({ ...f, priority: priority as TaskPriority }))}
          />
          <Selector
            label="负责人"
            options={assigneeOptions}
            value={form.assigneeId}
            onChange={(assigneeId) => setForm((f) => ({ ...f, assigneeId }))}
          />
          <TextInput
            label="标签（逗号分隔）"
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
          <Button label="取消" variant="secondary" clickAction={() => onOpenChange(false)} />
          <Button
            label={editingTask ? "保存" : "创建"}
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
