import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { Task, TaskPriority } from "./types";

const PRIORITY_META: Record<TaskPriority, { label: string; variant: "error" | "warning" | "teal" | "neutral" }> = {
  urgent: { label: "紧急", variant: "error" },
  high: { label: "高", variant: "warning" },
  medium: { label: "中", variant: "teal" },
  low: { label: "低", variant: "neutral" },
};

interface TaskCardProps {
  task: Task;
  assigneeName: string;
  onDragStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, assigneeName, onDragStart, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card padding={3} draggable onDragStart={onDragStart}>
      <Stack direction="vertical" gap={2}>
        <Stack direction="horizontal" gap={2}>
          <Text type="body">{task.title}</Text>
          <MoreMenu
            label="任务操作"
            size="sm"
            items={[
              { label: "编辑", onClick: onEdit },
              { type: "divider" },
              { label: "删除", onClick: onDelete },
            ]}
          />
        </Stack>
        <Stack direction="horizontal" gap={2}>
          <Badge label={PRIORITY_META[task.priority].label} variant={PRIORITY_META[task.priority].variant} />
          <Text type="supporting" color="secondary">
            {assigneeName}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}
