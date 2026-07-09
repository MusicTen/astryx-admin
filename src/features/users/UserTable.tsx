import { useEffect, useState } from "react";
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

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "管理员",
  editor: "编辑",
  viewer: "访客",
};
const ROLE_ICON: Record<UserRole, typeof ShieldCheck> = {
  admin: ShieldCheck,
  editor: PencilLine,
  viewer: UserRoundCog,
};
const STATUS_LABEL: Record<UserStatus, string> = {
  active: "启用",
  suspended: "停用",
  invited: "已邀请",
};
const STATUS_VARIANT: Record<UserStatus, "success" | "error" | "info"> = {
  active: "success",
  suspended: "error",
  invited: "info",
};

const STATUS_FILTER_OPTIONS = (Object.keys(STATUS_LABEL) as UserStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));
const ROLE_FILTER_OPTIONS = (Object.keys(ROLE_LABEL) as UserRole[]).map((value) => ({
  value,
  label: ROLE_LABEL[value],
}));

type UserRow = User & Record<string, unknown>;

export function UserTable() {
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
        toast({ body: "用户已更新" });
      } else {
        await createUser(input);
        toast({ body: "用户已创建" });
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
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      toast({ body: "用户已删除" });
      setDeletingUser(null);
      await refresh();
    } catch (error) {
      notifyError(error, "删除失败，请稍后重试");
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedKeys).map((id) => deleteUser(id)));
      toast({ body: `已删除 ${selectedKeys.size} 个用户` });
      setSelectedKeys(new Set());
      setBulkDeleteOpen(false);
      await refresh();
    } catch (error) {
      notifyError(error, "批量删除失败，请稍后重试");
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
    { key: "username", header: "用户名", width: proportional(1.2), sortable: true },
    { key: "name", header: "姓名", width: proportional(1) },
    { key: "email", header: "邮箱", width: proportional(1.6), sortable: true },
    { key: "phone", header: "手机号码", width: proportional(1.2) },
    {
      key: "status",
      header: "状态",
      width: pixel(100),
      renderCell: (user) => (
        <Badge label={STATUS_LABEL[user.status]} variant={STATUS_VARIANT[user.status]} />
      ),
    },
    {
      key: "role",
      header: "角色",
      width: proportional(1),
      renderCell: (user) => {
        const RoleIcon = ROLE_ICON[user.role];
        return (
          <Stack direction="horizontal" align="center" gap={2}>
            <RoleIcon width={16} height={16} />
            <Text type="body">{ROLE_LABEL[user.role]}</Text>
          </Stack>
        );
      },
    },
    {
      key: "actions",
      header: "操作",
      width: pixel(56),
      renderCell: (user) => (
        <MoreMenu
          label="用户操作"
          size="sm"
          items={[
            {
              label: "编辑",
              onClick: () => {
                setEditingUser(user);
                setFormOpen(true);
              },
            },
            { type: "divider" },
            { label: "删除", onClick: () => setDeletingUser(user) },
          ]}
        />
      ),
    },
  ];

  return (
    <Stack direction="vertical" gap={4}>
      <Toolbar
        label="用户页面标题"
        startContent={
          <Stack direction="vertical" gap={1}>
            <Text type="display-3">用户列表</Text>
            <Text type="supporting" color="secondary">
              在这里管理用户及其角色
            </Text>
          </Stack>
        }
        endContent={
          <Stack direction="horizontal" gap={2}>
            <Button
              label="邀请用户"
              variant="secondary"
              clickAction={() => {
                toast({ body: "邀请功能开发中，敬请期待" });
              }}
            />
            <Button
              label="添加用户"
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
        label="用户筛选"
        startContent={
          <Stack direction="horizontal" gap={2}>
            <TextInput
              label="搜索"
              isLabelHidden
              placeholder="按用户名/姓名/邮箱搜索"
              value={keyword}
              hasClear
              changeAction={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
            <MultiSelector
              label="状态"
              isLabelHidden
              placeholder="状态"
              options={STATUS_FILTER_OPTIONS}
              value={statuses}
              onChange={(value) => {
                setStatuses(value);
                setPage(1);
              }}
              triggerDisplay="labels"
            />
            <MultiSelector
              label="角色"
              isLabelHidden
              placeholder="角色"
              options={ROLE_FILTER_OPTIONS}
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
              label={`批量删除 (${selectedKeys.size})`}
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
        <EmptyState title="暂无用户" description="调整筛选条件，或点击右上角添加用户" />
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
        label="用户列表分页"
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
        title="删除用户"
        description={`确定删除「${deletingUser?.name ?? ""}」吗？此操作不可撤销。`}
        actionLabel="删除"
        actionVariant="destructive"
        cancelLabel="取消"
        onAction={handleDelete}
      />

      <AlertDialog
        isOpen={isBulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="批量删除用户"
        description={`确定删除选中的 ${selectedKeys.size} 个用户吗？此操作不可撤销。`}
        actionLabel="删除"
        actionVariant="destructive"
        cancelLabel="取消"
        isActionLoading={isBulkDeleting}
        onAction={handleBulkDelete}
      />
    </Stack>
  );
}
