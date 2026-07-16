import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MultiSelector } from "@astryxdesign/core/MultiSelector";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import {
  Table,
  proportional,
  pixel,
  useTableColumnSettings,
  useTableColumnSettingsState,
  useTableSelection,
  useTableSelectionState,
  useTableSortable,
  useTableSortableState,
} from "@astryxdesign/core/Table";
import type { TableColumn } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { ArrowDown, ArrowRight, ArrowUp, ChevronsUp } from "lucide-react";
import { ApiError } from "../../lib/http";
import { createTask, deleteTask, updateTask } from "./api";
import { TaskFormDialog } from "./TaskFormDialog";
import { useTasks } from "./useTasks";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "./types";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  backlog: "tasks.status.backlog",
  "in-progress": "tasks.status.inProgress",
  "in-review": "tasks.status.inReview",
  done: "tasks.status.done",
};
const STATUS_VARIANT: Record<TaskStatus, "neutral" | "accent" | "warning" | "success"> = {
  backlog: "neutral",
  "in-progress": "accent",
  "in-review": "warning",
  done: "success",
};

const PRIORITY_LABEL_KEYS: Record<TaskPriority, string> = {
  urgent: "tasks.priority.urgent",
  high: "tasks.priority.high",
  medium: "tasks.priority.medium",
  low: "tasks.priority.low",
};
const PRIORITY_ICON: Record<TaskPriority, typeof ArrowDown> = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
  urgent: ChevronsUp,
};

const LABEL_CONFIG: Record<
  string,
  { labelKey: string; variant: "blue" | "purple" | "orange" | "cyan" }
> = {
  docs: { labelKey: "tasks.label.docs", variant: "blue" },
  feature: { labelKey: "tasks.label.feature", variant: "purple" },
  bug: { labelKey: "tasks.label.bug", variant: "orange" },
  chore: { labelKey: "tasks.label.chore", variant: "cyan" },
};

const COLUMN_OPTIONS: { key: string; label: string; isAlwaysVisible?: boolean }[] = [
  { key: "task", label: "task", isAlwaysVisible: true },
  { key: "title", label: "title", isAlwaysVisible: true },
  { key: "status", label: "status" },
  { key: "priority", label: "priority" },
  { key: "actions", label: "actions", isAlwaysVisible: true },
];
const ALL_COLUMN_KEYS = COLUMN_OPTIONS.map((c) => c.key);

function formatTaskCode(id: string): string {
  return `TASK-${id.padStart(4, "0")}`;
}

type TaskRow = Task & Record<string, unknown>;

export function TaskTable() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [activeColumnKeys, setActiveColumnKeys] = useState<string[]>(ALL_COLUMN_KEYS);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setBulkDeleting] = useState(false);
  const toast = useToast();

  const { tasks, total, isLoading, refresh } = useTasks({
    page,
    pageSize,
    keyword,
    statuses: statuses as TaskStatus[],
    priorities: priorities as TaskPriority[],
  });

  const statusFilterOptions = useMemo(
    () =>
      (Object.keys(STATUS_LABEL_KEYS) as TaskStatus[]).map((value) => ({
        value,
        label: t(STATUS_LABEL_KEYS[value]),
      })),
    [t],
  );
  const priorityFilterOptions = useMemo(
    () =>
      (Object.keys(PRIORITY_LABEL_KEYS) as TaskPriority[]).map((value) => ({
        value,
        label: t(PRIORITY_LABEL_KEYS[value]),
      })),
    [t],
  );
  const columnOptions = useMemo(
    () => COLUMN_OPTIONS.map((c) => ({ ...c, label: t(`tasks.columns.${c.label}`) })),
    [t],
  );

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [page, keyword, statuses, priorities]);

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

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedKeys).map((id) => deleteTask(id)));
      toast({ body: t("tasks.batchDeleted", { count: selectedKeys.size }) });
      setSelectedKeys(new Set());
      setBulkDeleteOpen(false);
      await refresh();
    } catch (error) {
      notifyError(error, t("tasks.batchDeleteFailed"));
    } finally {
      setBulkDeleting(false);
    }
  };

  const rows = tasks as TaskRow[];

  const { selectionConfig } = useTableSelectionState<TaskRow>({
    data: rows,
    idKey: "id",
    selectedKeys,
    setSelectedKeys,
  });
  const selectionPlugin = useTableSelection<TaskRow>(selectionConfig);

  const { sortedData, sortConfig } = useTableSortableState<TaskRow>({ data: rows });
  const sortablePlugin = useTableSortable<TaskRow>(sortConfig);

  const columnSettingsState = useTableColumnSettingsState({
    columns: columnOptions,
    activeColumnKeys,
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  });
  const columnSettingsPlugin = useTableColumnSettings<TaskRow>(
    columnSettingsState.columnSettingsConfig,
  );
  const columnVisibilityOptions = columnOptions.map((c) => ({
    value: c.key,
    label: c.label,
    disabled: c.isAlwaysVisible === true,
  }));

  const columns: TableColumn<TaskRow>[] = [
    {
      key: "task",
      header: t("tasks.columns.task"),
      width: pixel(120),
      sortable: { sortKey: "id" },
      renderCell: (task) => <Text type="body">{formatTaskCode(task.id)}</Text>,
    },
    {
      key: "title",
      header: t("tasks.columns.title"),
      width: proportional(2.4),
      renderCell: (task) => {
        const labelConfig = task.labels[0] ? LABEL_CONFIG[task.labels[0]] : undefined;
        return (
          <Stack direction="horizontal" align="center" gap={2}>
            {labelConfig ? (
              <Badge label={t(labelConfig.labelKey)} variant={labelConfig.variant} />
            ) : null}
            <Text type="body">{task.title}</Text>
          </Stack>
        );
      },
    },
    {
      key: "status",
      header: t("tasks.columns.status"),
      width: pixel(140),
      sortable: true,
      renderCell: (task) => (
        <Stack direction="horizontal" align="center" gap={2}>
          <StatusDot variant={STATUS_VARIANT[task.status]} label={t(STATUS_LABEL_KEYS[task.status])} />
          <Text type="body">{t(STATUS_LABEL_KEYS[task.status])}</Text>
        </Stack>
      ),
    },
    {
      key: "priority",
      header: t("tasks.columns.priority"),
      width: pixel(120),
      sortable: true,
      renderCell: (task) => {
        const PriorityIcon = PRIORITY_ICON[task.priority];
        return (
          <Stack direction="horizontal" align="center" gap={2}>
            <PriorityIcon width={16} height={16} />
            <Text type="body">{t(PRIORITY_LABEL_KEYS[task.priority])}</Text>
          </Stack>
        );
      },
    },
    {
      key: "actions",
      header: t("tasks.columns.actions"),
      width: pixel(56),
      renderCell: (task) => (
        <MoreMenu
          label={t("tasks.actionsLabel")}
          size="sm"
          items={[
            {
              label: t("common.edit"),
              onClick: () => {
                setEditingTask(task);
                setFormOpen(true);
              },
            },
            { type: "divider" },
            { label: t("common.delete"), onClick: () => setDeletingTask(task) },
          ]}
        />
      ),
    },
  ];

  return (
    <Stack direction="vertical" gap={4}>
      <Toolbar
        label={t("tasks.pageHeaderLabel")}
        startContent={
          <Stack direction="vertical" gap={1}>
            <Text type="display-3">{t("tasks.title")}</Text>
            <Text type="supporting" color="secondary">
              {t("tasks.subtitle")}
            </Text>
          </Stack>
        }
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

      <Toolbar
        label={t("tasks.filterLabel")}
        startContent={
          <Stack direction="horizontal" gap={2}>
            <TextInput
              label={t("tasks.search")}
              isLabelHidden
              placeholder={t("tasks.searchPlaceholder")}
              value={keyword}
              hasClear
              changeAction={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
            <MultiSelector
              label={t("tasks.columns.status")}
              isLabelHidden
              placeholder={t("tasks.columns.status")}
              options={statusFilterOptions}
              value={statuses}
              onChange={(value) => {
                setStatuses(value);
                setPage(1);
              }}
              triggerDisplay="labels"
            />
            <MultiSelector
              label={t("tasks.columns.priority")}
              isLabelHidden
              placeholder={t("tasks.columns.priority")}
              options={priorityFilterOptions}
              value={priorities}
              onChange={(value) => {
                setPriorities(value);
                setPage(1);
              }}
              triggerDisplay="labels"
            />
          </Stack>
        }
        endContent={
          selectedKeys.size > 0 ? (
            <Button
              label={t("tasks.batchDelete", { count: selectedKeys.size })}
              variant="destructive"
              size="sm"
              clickAction={() => setBulkDeleteOpen(true)}
            />
          ) : (
            <MultiSelector
              label={t("tasks.columnsLabel")}
              isLabelHidden
              placeholder={t("tasks.columnsLabel")}
              options={columnVisibilityOptions}
              value={[...columnSettingsState.activeColumnKeys]}
              onChange={columnSettingsState.setActiveColumnKeys}
              triggerDisplay="count"
            />
          )
        }
      />

      {isLoading ? (
        <Stack direction="vertical" gap={2}>
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </Stack>
      ) : tasks.length === 0 ? (
        <EmptyState title={t("tasks.emptyTitle")} description={t("tasks.emptyDescription")} />
      ) : (
        <Table<TaskRow>
          data={sortedData}
          idKey="id"
          hasHover
          columns={columns}
          plugins={{
            selection: selectionPlugin,
            sortable: sortablePlugin,
            columnSettings: columnSettingsPlugin,
          }}
        />
      )}

      <Pagination
        page={page}
        totalItems={total}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onChange={setPage}
        variant="pages"
        label={t("tasks.paginationLabel")}
      />

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

      <AlertDialog
        isOpen={isBulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("tasks.batchDeleteDialog.title")}
        description={t("tasks.batchDeleteDialog.description", { count: selectedKeys.size })}
        actionLabel={t("common.delete")}
        actionVariant="destructive"
        cancelLabel={t("common.cancel")}
        isActionLoading={isBulkDeleting}
        onAction={handleBulkDelete}
      />
    </Stack>
  );
}
