import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { MoreMenu } from "@astryxdesign/core/MoreMenu";
import { MultiSelector } from "@astryxdesign/core/MultiSelector";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import {
  Table,
  proportional,
  pixel,
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
import { PencilLine, ShieldCheck, UserRoundCog } from "lucide-react";
import { ApiError } from "../../lib/http";
import { createUser, deleteUser, updateUser } from "./api";
import { useUsers } from "./useUsers";
import { UserFormDialog } from "./UserFormDialog";
import type { User, UserInput, UserRole, UserStatus } from "./types";

const PAGE_SIZE = 10;

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  admin: "users.role.admin",
  editor: "users.role.editor",
  viewer: "users.role.viewer",
};
const ROLE_ICON: Record<UserRole, typeof ShieldCheck> = {
  admin: ShieldCheck,
  editor: PencilLine,
  viewer: UserRoundCog,
};
const STATUS_LABEL_KEYS: Record<UserStatus, string> = {
  active: "users.status.active",
  suspended: "users.status.suspended",
  invited: "users.status.invited",
};
const STATUS_VARIANT: Record<UserStatus, "success" | "error" | "info"> = {
  active: "success",
  suspended: "error",
  invited: "info",
};

type UserRow = User & Record<string, unknown>;

export function UserTable() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setBulkDeleting] = useState(false);

  const { users, total, isLoading, refresh } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    keyword,
    statuses: statuses as UserStatus[],
    roles: roles as UserRole[],
  });
  const toast = useToast();

  const statusFilterOptions = useMemo(
    () =>
      (Object.keys(STATUS_LABEL_KEYS) as UserStatus[]).map((value) => ({
        value,
        label: t(STATUS_LABEL_KEYS[value]),
      })),
    [t],
  );
  const roleFilterOptions = useMemo(
    () =>
      (Object.keys(ROLE_LABEL_KEYS) as UserRole[]).map((value) => ({
        value,
        label: t(ROLE_LABEL_KEYS[value]),
      })),
    [t],
  );

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [page, keyword, statuses, roles]);

  const notifyError = (error: unknown, fallback: string) => {
    toast({ body: error instanceof ApiError ? error.message : fallback, type: "error" });
  };

  const handleSubmit = async (input: UserInput) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, input);
        toast({ body: t("users.updated") });
      } else {
        await createUser(input);
        toast({ body: t("users.created") });
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
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      toast({ body: t("users.deleted") });
      setDeletingUser(null);
      await refresh();
    } catch (error) {
      notifyError(error, t("common.deleteFailed"));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedKeys).map((id) => deleteUser(id)));
      toast({ body: t("users.batchDeleted", { count: selectedKeys.size }) });
      setSelectedKeys(new Set());
      setBulkDeleteOpen(false);
      await refresh();
    } catch (error) {
      notifyError(error, t("users.batchDeleteFailed"));
    } finally {
      setBulkDeleting(false);
    }
  };

  const rows = users as UserRow[];

  const { selectionConfig } = useTableSelectionState<UserRow>({
    data: rows,
    idKey: "id",
    selectedKeys,
    setSelectedKeys,
  });
  const selectionPlugin = useTableSelection<UserRow>(selectionConfig);

  const { sortedData, sortConfig } = useTableSortableState<UserRow>({ data: rows });
  const sortablePlugin = useTableSortable<UserRow>(sortConfig);

  const columns: TableColumn<UserRow>[] = [
    { key: "username", header: t("users.columns.username"), width: proportional(1.2), sortable: true },
    { key: "name", header: t("users.columns.name"), width: proportional(1) },
    { key: "email", header: t("users.columns.email"), width: proportional(1.6), sortable: true },
    { key: "phone", header: t("users.columns.phone"), width: proportional(1.2) },
    {
      key: "status",
      header: t("users.columns.status"),
      width: pixel(100),
      renderCell: (user) => (
        <Badge label={t(STATUS_LABEL_KEYS[user.status])} variant={STATUS_VARIANT[user.status]} />
      ),
    },
    {
      key: "role",
      header: t("users.columns.role"),
      width: proportional(1),
      renderCell: (user) => {
        const RoleIcon = ROLE_ICON[user.role];
        return (
          <Stack direction="horizontal" align="center" gap={2}>
            <RoleIcon width={16} height={16} />
            <Text type="body">{t(ROLE_LABEL_KEYS[user.role])}</Text>
          </Stack>
        );
      },
    },
    {
      key: "actions",
      header: t("users.columns.actions"),
      width: pixel(56),
      renderCell: (user) => (
        <MoreMenu
          label={t("users.actionsLabel")}
          size="sm"
          items={[
            {
              label: t("common.edit"),
              onClick: () => {
                setEditingUser(user);
                setFormOpen(true);
              },
            },
            { type: "divider" },
            { label: t("common.delete"), onClick: () => setDeletingUser(user) },
          ]}
        />
      ),
    },
  ];

  return (
    <Stack direction="vertical" gap={4}>
      <Toolbar
        label={t("users.pageHeaderLabel")}
        startContent={
          <Stack direction="vertical" gap={1}>
            <Text type="display-3">{t("users.title")}</Text>
            <Text type="supporting" color="secondary">
              {t("users.subtitle")}
            </Text>
          </Stack>
        }
        endContent={
          <Stack direction="horizontal" gap={2}>
            <Button
              label={t("users.invite")}
              variant="secondary"
              clickAction={() => {
                toast({ body: t("users.inviteComingSoon") });
              }}
            />
            <Button
              label={t("users.add")}
              variant="primary"
              clickAction={() => {
                setEditingUser(null);
                setFormOpen(true);
              }}
            />
          </Stack>
        }
      />

      <Toolbar
        label={t("users.filterLabel")}
        startContent={
          <Stack direction="horizontal" gap={2}>
            <TextInput
              label={t("users.search")}
              isLabelHidden
              placeholder={t("users.searchPlaceholder")}
              value={keyword}
              hasClear
              changeAction={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
            <MultiSelector
              label={t("users.columns.status")}
              isLabelHidden
              placeholder={t("users.columns.status")}
              options={statusFilterOptions}
              value={statuses}
              onChange={(value) => {
                setStatuses(value);
                setPage(1);
              }}
              triggerDisplay="labels"
            />
            <MultiSelector
              label={t("users.columns.role")}
              isLabelHidden
              placeholder={t("users.columns.role")}
              options={roleFilterOptions}
              value={roles}
              onChange={(value) => {
                setRoles(value);
                setPage(1);
              }}
              triggerDisplay="labels"
            />
          </Stack>
        }
        endContent={
          selectedKeys.size > 0 ? (
            <Button
              label={t("users.batchDelete", { count: selectedKeys.size })}
              variant="destructive"
              size="sm"
              clickAction={() => setBulkDeleteOpen(true)}
            />
          ) : undefined
        }
      />

      {isLoading ? (
        <Stack direction="vertical" gap={2}>
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </Stack>
      ) : users.length === 0 ? (
        <EmptyState title={t("users.emptyTitle")} description={t("users.emptyDescription")} />
      ) : (
        <Table<UserRow>
          data={sortedData}
          idKey="id"
          hasHover
          columns={columns}
          plugins={{ selection: selectionPlugin, sortable: sortablePlugin }}
        />
      )}

      <Pagination
        page={page}
        totalItems={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
        variant="pages"
        label={t("users.paginationLabel")}
      />

      <UserFormDialog
        isOpen={isFormOpen}
        editingUser={editingUser}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        isOpen={deletingUser !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingUser(null);
        }}
        title={t("users.deleteDialog.title")}
        description={t("users.deleteDialog.description", { name: deletingUser?.name ?? "" })}
        actionLabel={t("common.delete")}
        actionVariant="destructive"
        cancelLabel={t("common.cancel")}
        onAction={handleDelete}
      />

      <AlertDialog
        isOpen={isBulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("users.batchDeleteDialog.title")}
        description={t("users.batchDeleteDialog.description", { count: selectedKeys.size })}
        actionLabel={t("common.delete")}
        actionVariant="destructive"
        cancelLabel={t("common.cancel")}
        isActionLoading={isBulkDeleting}
        onAction={handleBulkDelete}
      />
    </Stack>
  );
}
