import { useMemo, useState } from "react";
import type { DragEvent } from "react";
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

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "待办",
  "in-progress": "进行中",
  "in-review": "评审中",
  done: "已完成",
};

export function TaskBoard() {
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
        toast({ body: "任务已更新" });
      } else {
        await createTask(input);
        toast({ body: "任务已创建" });
      }
      setFormOpen(false);
      await refresh();
    } catch (error) {
      notifyError(error, "操作失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      toast({ body: "任务已删除" });
      setDeletingTask(null);
      await refresh();
    } catch (error) {
      notifyError(error, "删除失败，请稍后重试");
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
      notifyError(error, "移动任务失败，请稍后重试");
    }
  };

  return (
    <Stack direction="vertical" gap={4}>
      <Toolbar
        label="任务操作"
        endContent={
          <Button
            label="新建任务"
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
        <EmptyState title="暂无任务" description="点击右上角新建任务" />
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
                  <Text type="large">{STATUS_LABEL[status]}</Text>
                  <Badge label={String(groups[status].length)} variant="neutral" />
                </Stack>
                <Stack direction="vertical" gap={2}>
                  {groups[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeName={userNameById.get(task.assigneeId) ?? "未分配"}
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
        title="删除任务"
        description={`确定删除「${deletingTask?.title ?? ""}」吗？此操作不可撤销。`}
        actionLabel="删除"
        actionVariant="destructive"
        cancelLabel="取消"
        onAction={handleDelete}
      />
    </Stack>
  );
}
