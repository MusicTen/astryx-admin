import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { ApiError } from "../../lib/http";
import { useUsers } from "../users/useUsers";
import { createTask, deleteTask, updateTask } from "./api";
import { groupTasksByStatus, TASK_STATUSES } from "./groupTasksByStatus";
import { TaskCard } from "./TaskCard";
import { TaskFormDialog } from "./TaskFormDialog";
import { useTasks } from "./useTasks";
import type { Task, TaskInput, TaskStatus } from "./types";

const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  backlog: "tasks.status.backlog",
  "in-progress": "tasks.status.inProgress",
  "in-review": "tasks.status.inReview",
  done: "tasks.status.done",
};

export function TaskBoard() {
  const { t } = useTranslation();
  const { tasks, isLoading, refresh } = useTasks();
  const { users } = useUsers({ page: 1, pageSize: 100, keyword: "" });
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const toast = useToast();

  const userNameById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);
  const groups = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  const notifyError = (error: unknown, fallback: string) => {
    toast({ body: error instanceof ApiError ? error.message : fallback, type: "error" });
  };

  const handleSubmit = async (input: TaskInput) => {
    setSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(editingTask.id, input);
        toast({ body: t("tasks.updated") });
      } else {
        await createTask(input);
        toast({ body: t("tasks.created") });
      }
      setFormOpen(false);
      await refresh();
    } catch (error) {
      notifyError(error, t("common.actionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      toast({ body: t("tasks.deleted") });
      setDeletingTask(null);
      await refresh();
    } catch (error) {
      notifyError(error, t("common.deleteFailed"));
    }
  };

  const handleDrop = async (status: TaskStatus) => {
    if (!draggingId) return;
    const task = tasks.find((t) => t.id === draggingId);
    setDraggingId(null);
    if (!task || task.status === status) return;
    try {
      await updateTask(task.id, { status });
      await refresh();
    } catch (error) {
      notifyError(error, t("tasks.moveFailed"));
    }
  };

  return (
    <Stack direction="vertical" gap={4}>
      <Toolbar
        label={t("tasks.actionsLabel")}
        endContent={
          <Button
            label={t("tasks.new")}
            variant="primary"
            clickAction={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          />
        }
      />

      {isLoading ? (
        <Grid columns={4} gap={4}>
          <Skeleton height={320} />
          <Skeleton height={320} />
          <Skeleton height={320} />
          <Skeleton height={320} />
        </Grid>
      ) : tasks.length === 0 ? (
        <EmptyState title={t("tasks.emptyTitle")} description={t("tasks.emptyDescription")} />
      ) : (
        <Grid columns={4} gap={4}>
          {TASK_STATUSES.map((status) => (
            <Card
              key={status}
              variant="muted"
              padding={3}
              onDragOver={(event: DragEvent) => event.preventDefault()}
              onDrop={(event: DragEvent) => {
                event.preventDefault();
                handleDrop(status);
              }}
            >
              <Stack direction="vertical" gap={3}>
                <Stack direction="horizontal" gap={2}>
                  <Text type="large">{t(STATUS_LABEL_KEYS[status])}</Text>
                  <Badge label={String(groups[status].length)} variant="neutral" />
                </Stack>
                <Stack direction="vertical" gap={2}>
                  {groups[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={userNameById.get(task.assigneeId) ?? t("tasks.unassigned")}
                      onDragStart={() => setDraggingId(task.id)}
                      onEdit={() => {
                        setEditingTask(task);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeletingTask(task)}
                    />
                  ))}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Grid>
      )}

      <TaskFormDialog
        isOpen={isFormOpen}
        editingTask={editingTask}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        isOpen={deletingTask !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingTask(null);
        }}
        title={t("tasks.deleteDialog.title")}
        description={t("tasks.deleteDialog.description", { title: deletingTask?.title ?? "" })}
        actionLabel={t("common.delete")}
        actionVariant="destructive"
        cancelLabel={t("common.cancel")}
        onAction={handleDelete}
      />
    </Stack>
  );
}
