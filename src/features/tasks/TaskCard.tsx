import { useTranslation } from "react-i18next";
import { Badge } from "@astryxdesign/core/Badge";
import { Card } from "@astryxdesign/core/Card";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { Task, TaskPriority } from "./types";

const PRIORITY_CONFIG: Record<TaskPriority, { labelKey: string; variant: "error" | "warning" | "teal" | "neutral" }> = {
  urgent: { labelKey: "tasks.priority.urgent", variant: "error" },
  high: { labelKey: "tasks.priority.high", variant: "warning" },
  medium: { labelKey: "tasks.priority.medium", variant: "teal" },
  low: { labelKey: "tasks.priority.low", variant: "neutral" },
};

interface TaskCardProps {
  task: Task;
  assigneeName: string;
  onDragStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, assigneeName, onDragStart, onEdit, onDelete }: TaskCardProps) {
  const { t } = useTranslation();
  return (
    <Card padding={3} draggable onDragStart={onDragStart}>
      <Stack direction="vertical" gap={2}>
        <Stack direction="horizontal" gap={2}>
          <Text type="body">{task.title}</Text>
          <MoreMenu
            label={t("tasks.actionsLabel")}
            size="sm"
            items={[
              { label: t("common.edit"), onClick: onEdit },
              { type: "divider" },
              { label: t("common.delete"), onClick: onDelete },
            ]}
          />
        </Stack>
        <Stack direction="horizontal" gap={2}>
          <Badge label={t(PRIORITY_CONFIG[task.priority].labelKey)} variant={PRIORITY_CONFIG[task.priority].variant} />
          <Text type="supporting" color="secondary">
            {assigneeName}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}
