import { useState } from "react";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Table } from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { useToast } from "@astryxdesign/core/Toast";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { ApiError } from "../../lib/http";
import { createUser, deleteUser, updateUser } from "./api";
import { useUsers } from "./useUsers";
import { UserFormDialog } from "./UserFormDialog";
import type { User, UserInput, UserRole } from "./types";

const PAGE_SIZE = 10;
const ROLE_LABEL: Record<UserRole, string> = {
  admin: "管理员",
  editor: "编辑",
  viewer: "访客",
};
const ROLE_BADGE: Record<UserRole, "purple" | "blue" | "neutral"> = {
  admin: "purple",
  editor: "blue",
  viewer: "neutral",
};

type UserRow = User & Record<string, unknown>;

export function UserTable() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const { users, total, isLoading, refresh } = useUsers({ page, pageSize: PAGE_SIZE, keyword });
  const toast = useToast();

  const notifyError = (error: unknown, fallback: string) => {
    toast({
      body: error instanceof ApiError ? error.message : fallback,
      type: "error",
    });
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

  return (
    <Stack direction="vertical" gap={4}>
      <Toolbar
        label="用户操作"
        startContent={
          <TextInput
            label="搜索"
            isLabelHidden
            placeholder="按姓名或邮箱搜索"
            value={keyword}
            hasClear
            changeAction={(value) => {
              setKeyword(value);
              setPage(1);
            }}
          />
        }
        endContent={
          <Button
            label="新建用户"
            variant="primary"
            clickAction={() => {
              setEditingUser(null);
              setFormOpen(true);
            }}
          />
        }
      />

      {isLoading ? (
        <Stack direction="vertical" gap={2}>
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </Stack>
      ) : users.length === 0 ? (
        <EmptyState title="暂无用户" description="调整搜索条件，或点击右上角新建用户" />
      ) : (
        <Table<UserRow>
          data={users as UserRow[]}
          idKey="id"
          hasHover
          columns={[
            { key: "name", header: "姓名" },
            { key: "email", header: "邮箱" },
            {
              key: "role",
              header: "角色",
              renderCell: (user) => (
                <Badge label={ROLE_LABEL[user.role]} variant={ROLE_BADGE[user.role]} />
              ),
            },
            {
              key: "isActive",
              header: "状态",
              renderCell: (user) => (
                <StatusDot
                  variant={user.isActive ? "success" : "neutral"}
                  label={user.isActive ? "启用" : "停用"}
                />
              ),
            },
            {
              key: "createdAt",
              header: "创建时间",
              renderCell: (user) => <Timestamp value={user.createdAt} format="date" />,
            },
            {
              key: "actions",
              header: "操作",
              renderCell: (user) => (
                <Stack direction="horizontal" gap={2}>
                  <Button
                    label="编辑"
                    variant="ghost"
                    size="sm"
                    clickAction={() => {
                      setEditingUser(user);
                      setFormOpen(true);
                    }}
                  />
                  <Button
                    label="删除"
                    variant="destructive"
                    size="sm"
                    clickAction={() => setDeletingUser(user)}
                  />
                </Stack>
              ),
            },
          ]}
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
    </Stack>
  );
}
