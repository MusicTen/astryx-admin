# 任务看板重构为表格视图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/tasks` 页面从拖拽式 4 列 Kanban 重构为参照 shadcn-admin Tasks 页的数据表格：筛选、排序、列可见性、分页、多选批量删除、右侧抽屉式新建/编辑表单。

**Architecture:** 沿用 `src/features/users/` 已验证的表格页面模式（`UserTable.tsx` + `useUsers.ts` + `users/api.ts` + `mocks/handlers/users.ts`），把同一套 `Table` 插件（selection/sortable/columnSettings）、服务端分页筛选 mock handler、Toolbar 筛选行套用到 `tasks` 模块。表单 Dialog 通过 `position` 定位到屏幕右侧模拟抽屉。

**Tech Stack:** React + TypeScript, `@astryxdesign/core`（Table/Toolbar/MultiSelector/Dialog/StatusDot/Badge/Pagination）, lucide-react 图标, SWR (`useSWR`), MSW mock handlers, vitest, react-i18next。

## Global Constraints

- 运行 `pnpm exec astryx ...` 前必须先 `export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"`（项目要求 Node ≥22.13，默认 shell 是 Node 16）。
- 组件布局禁止裸 `<div>`，全部用 astryx 组件做布局与间距。
- 自定义样式先用组件 props；其次 `style`/`className` 配 `var(--color-*|--spacing-*|--radius-*)` token，禁止裸 hex/px。
- 状态展示用 `StatusDot`（配合可见文字），不用 Badge 做状态装饰；Badge 仅用于计数和枚举分类标签。
- 导出的函数/组件 props 必须显式标注 TypeScript 类型；避免 `any`。
- `zh.json` 与 `en.json` 的 key 结构必须保持一一对应。
- 不引入新任务状态/新批量操作能力（如批量改状态）——仅用现有 mock API 能力（增删改）。
- 测试命令：`pnpm test -- <path>`（底层是 `vp test run`，支持按路径过滤）。

---

## 文件清单

- **修改** `src/features/tasks/types.ts`：新增 `TaskListParams`。
- **修改** `src/features/tasks/api.ts`：`fetchTasks` 改为按参数查询，新增 `tasksKey(params)`。
- **修改** `src/mocks/handlers/tasks.ts`：`GET /api/tasks` 支持 `page/pageSize/keyword/status/priority`。
- **修改** `src/features/tasks/api.test.ts`：补充筛选/分页断言。
- **修改** `src/features/tasks/useTasks.ts`：接受 `TaskListParams`。
- **修改** `src/i18n/locales/zh.json`、`src/i18n/locales/en.json`：新增/调整 `tasks.*` 文案。
- **修改** `src/features/tasks/TaskFormDialog.tsx`：`Dialog` 改为右侧定位模拟抽屉。
- **新建** `src/features/tasks/TaskTable.tsx`：表格主视图（替代 `TaskBoard.tsx`）。
- **删除** `src/features/tasks/TaskBoard.tsx`、`src/features/tasks/TaskCard.tsx`、`src/features/tasks/groupTasksByStatus.ts`、`src/features/tasks/groupTasksByStatus.test.ts`。
- **修改** `src/routes/_auth/tasks.tsx`：改为渲染 `TaskTable`，页头收进组件内部（对齐 `users.tsx` 的写法）。

---

### Task 1: 任务列表分页与筛选 API

**Files:**
- Modify: `src/features/tasks/types.ts`
- Modify: `src/features/tasks/api.ts`
- Modify: `src/mocks/handlers/tasks.ts`
- Modify: `src/features/tasks/api.test.ts`

**Interfaces:**
- Consumes: `src/lib/api.ts` 的 `PageResult<T>`；`src/lib/http.ts` 的 `http`（ky 实例，`prefix: "/api"`）。
- Produces: `TaskListParams` 类型、`tasksKey(params: TaskListParams): string`、`fetchTasks(params: TaskListParams): Promise<PageResult<Task>>`，供 Task 2 的 `useTasks` 和 Task 5 的 `TaskTable` 使用。

- [ ] **Step 1: 在 `types.ts` 追加 `TaskListParams`**

在 `src/features/tasks/types.ts` 末尾追加：

```typescript
export interface TaskListParams {
  page: number;
  pageSize: number;
  keyword: string;
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
}
```

- [ ] **Step 2: 写失败测试——筛选后的 `fetchTasks` 应只返回匹配项**

替换 `src/features/tasks/api.test.ts` 全文为：

```typescript
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { resetTasks } from "../../mocks/handlers/tasks";
import { createTask, deleteTask, fetchTasks, updateTask } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetTasks();
});
afterAll(() => server.close());

test("任务 CRUD 全链路", async () => {
  const created = await createTask({
    title: "测试任务",
    status: "backlog",
    priority: "medium",
    assigneeId: "1",
    labels: ["bug"],
  });
  expect(created.id).toBeTruthy();
  expect(created.status).toBe("backlog");

  const updated = await updateTask(created.id, { status: "in-progress" });
  expect(updated.status).toBe("in-progress");

  const list = await fetchTasks({ page: 1, pageSize: 100, keyword: "" });
  expect(list.items.some((t) => t.id === created.id)).toBe(true);

  await deleteTask(created.id);
  const after = await fetchTasks({ page: 1, pageSize: 100, keyword: "" });
  expect(after.items.some((t) => t.id === created.id)).toBe(false);
});

test("按状态和优先级筛选任务列表", async () => {
  await createTask({
    title: "紧急缺陷",
    status: "in-review",
    priority: "urgent",
    assigneeId: "1",
    labels: ["bug"],
  });

  const result = await fetchTasks({
    page: 1,
    pageSize: 100,
    keyword: "",
    statuses: ["in-review"],
    priorities: ["urgent"],
  });

  expect(result.items.length).toBeGreaterThan(0);
  expect(result.items.every((t) => t.status === "in-review" && t.priority === "urgent")).toBe(
    true,
  );
});

test("按关键字分页任务列表", async () => {
  const page1 = await fetchTasks({ page: 1, pageSize: 5, keyword: "" });
  expect(page1.items.length).toBe(5);
  expect(page1.total).toBeGreaterThan(5);

  const filtered = await fetchTasks({ page: 1, pageSize: 100, keyword: "任务 01" });
  expect(filtered.items.every((t) => t.title.includes("任务 01"))).toBe(true);
});
```

- [ ] **Step 3: 运行测试确认失败**

```bash
pnpm test -- src/features/tasks/api.test.ts
```

预期：`fetchTasks` 调用点报类型错误（缺少必需参数）或运行时因缺少 `resetTasks` 导出而失败。

- [ ] **Step 4: 实现 `tasksKey` / `fetchTasks`**

替换 `src/features/tasks/api.ts` 全文为：

```typescript
import type { PageResult } from "../../lib/api";
import { http } from "../../lib/http";
import type { Task, TaskInput, TaskListParams } from "./types";

const TASKS_ENDPOINT = "tasks";

export function tasksKey(params: TaskListParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    keyword: params.keyword,
  });
  for (const status of params.statuses ?? []) {
    search.append("status", status);
  }
  for (const priority of params.priorities ?? []) {
    search.append("priority", priority);
  }
  return `${TASKS_ENDPOINT}?${search.toString()}`;
}

export function fetchTasks(params: TaskListParams): Promise<PageResult<Task>> {
  return http.get(tasksKey(params)).json<PageResult<Task>>();
}

export function createTask(input: TaskInput): Promise<Task> {
  return http.post(TASKS_ENDPOINT, { json: input }).json<Task>();
}

export function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  return http.put(`${TASKS_ENDPOINT}/${id}`, { json: input }).json<Task>();
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`${TASKS_ENDPOINT}/${id}`).json();
}
```

- [ ] **Step 5: 实现 mock handler 分页/筛选，导出 `resetTasks`**

替换 `src/mocks/handlers/tasks.ts` 全文为：

```typescript
import { HttpResponse, http } from "msw";
import { createSeedTasks, type MockTask } from "../data/tasks";

export let tasks = createSeedTasks();
let nextId = tasks.length + 1;

export function resetTasks(): void {
  tasks = createSeedTasks();
  nextId = tasks.length + 1;
}

export const taskHandlers = [
  http.get("*/api/tasks", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const keyword = url.searchParams.get("keyword") ?? "";
    const statuses = url.searchParams.getAll("status");
    const priorities = url.searchParams.getAll("priority");

    let filtered = tasks;
    if (keyword) {
      filtered = filtered.filter(
        (t) => t.title.includes(keyword) || `TASK-${t.id.padStart(4, "0")}`.includes(keyword),
      );
    }
    if (statuses.length > 0) {
      filtered = filtered.filter((t) => statuses.includes(t.status));
    }
    if (priorities.length > 0) {
      filtered = filtered.filter((t) => priorities.includes(t.priority));
    }

    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
    });
  }),

  http.post("*/api/tasks", async ({ request }) => {
    const body = (await request.json()) as Omit<MockTask, "id" | "createdAt">;
    const task: MockTask = { ...body, id: String(nextId++), createdAt: new Date().toISOString() };
    tasks = [task, ...tasks];
    return HttpResponse.json(task, { status: 201 });
  }),

  http.put("*/api/tasks/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<MockTask>;
    const existing = tasks.find((t) => t.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "任务不存在" }, { status: 404 });
    }
    const updated = { ...existing, ...body, id: existing.id };
    tasks = tasks.map((t) => (t.id === existing.id ? updated : t));
    return HttpResponse.json(updated);
  }),

  http.delete("*/api/tasks/:id", ({ params }) => {
    tasks = tasks.filter((t) => t.id !== params.id);
    return HttpResponse.json({ ok: true });
  }),
];
```

注意：新增的 `resetTasks()` 只重置本模块内的 `tasks`/`nextId`，测试的 `afterEach` 靠它避免用例间的种子数据/自增 id 互相污染（之前的单测没有这个问题是因为只有一个 test；现在新增了多个 test，必须隔离）。

- [ ] **Step 6: 运行测试确认通过**

```bash
pnpm test -- src/features/tasks/api.test.ts
```

预期：3 个测试全部 PASS。

- [ ] **Step 7: Commit**

```bash
git add src/features/tasks/types.ts src/features/tasks/api.ts src/mocks/handlers/tasks.ts src/features/tasks/api.test.ts
git commit -m "feat: 任务列表接口支持分页与状态/优先级筛选"
```

---

### Task 2: useTasks Hook 支持分页/筛选参数

**Files:**
- Modify: `src/features/tasks/useTasks.ts`

**Interfaces:**
- Consumes: Task 1 的 `tasksKey(params: TaskListParams): string`，`src/lib/api.ts` 的 `PageResult<T>`。
- Produces: `useTasks(params: TaskListParams): { tasks: Task[]; total: number; isLoading: boolean; refresh: () => void }`，供 Task 5 的 `TaskTable.tsx` 使用。

- [ ] **Step 1: 替换实现**

替换 `src/features/tasks/useTasks.ts` 全文为：

```typescript
import useSWR from "swr";
import type { PageResult } from "../../lib/api";
import { tasksKey } from "./api";
import type { Task, TaskListParams } from "./types";

export function useTasks(params: TaskListParams) {
  const { data, isLoading, mutate } = useSWR<PageResult<Task>>(tasksKey(params));
  return {
    tasks: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    refresh: mutate,
  };
}
```

- [ ] **Step 2: 运行全量测试确认没有回归**

```bash
pnpm test
```

预期：全部现有测试仍为 PASS（此步骤是纯签名变更，尚无调用方引用新签名，`tsc` 层面的破坏会在 Task 5 接线后才会暴露；此处先确认没有引入运行时回归）。

- [ ] **Step 3: Commit**

```bash
git add src/features/tasks/useTasks.ts
git commit -m "feat: useTasks 支持分页与筛选参数"
```

---

### Task 3: 新增/调整任务模块 i18n 文案

**Files:**
- Modify: `src/i18n/locales/zh.json`
- Modify: `src/i18n/locales/en.json`

**Interfaces:**
- Produces：Task 5 的 `TaskTable.tsx` 和 Task 4 的 `TaskFormDialog.tsx` 直接引用的 `t("tasks.*")` key。以下为本任务新增/修改的完整 key 清单（其余 `tasks.*` 既有 key 如 `tasks.status.*`、`tasks.priority.*`、`tasks.form.*`、`tasks.deleteDialog.*` 保持不变）。

- [ ] **Step 1: 修改 `zh.json` 的 `tasks` 段**

在 `src/i18n/locales/zh.json` 中，把 `tasks` 顶层对象替换为（保留原有 `status`/`priority`/`form`/`deleteDialog` 子对象不变，仅新增/调整以下字段；删除不再使用的 `moveFailed`）：

```json
  "tasks": {
    "title": "任务看板",
    "subtitle": "在这里管理本月的所有任务",
    "pageHeaderLabel": "任务页面标题",
    "status": {
      "backlog": "待办",
      "inProgress": "进行中",
      "inReview": "评审中",
      "done": "已完成"
    },
    "priority": {
      "urgent": "紧急",
      "high": "高",
      "medium": "中",
      "low": "低"
    },
    "label": {
      "bug": "缺陷",
      "feature": "功能",
      "docs": "文档",
      "chore": "杂项"
    },
    "columns": {
      "task": "任务",
      "title": "标题",
      "status": "状态",
      "priority": "优先级",
      "actions": "操作"
    },
    "columnsLabel": "显示列",
    "actionsLabel": "任务操作",
    "new": "新建任务",
    "updated": "任务已更新",
    "created": "任务已创建",
    "deleted": "任务已删除",
    "unassigned": "未分配",
    "filterLabel": "任务筛选",
    "search": "搜索",
    "searchPlaceholder": "按标题或编号筛选",
    "batchDelete": "批量删除 ({{count}})",
    "batchDeleted": "已删除 {{count}} 个任务",
    "batchDeleteFailed": "批量删除失败，请稍后重试",
    "paginationLabel": "任务列表分页",
    "emptyTitle": "暂无任务",
    "emptyDescription": "调整筛选条件，或点击右上角新建任务",
    "deleteDialog": {
      "title": "删除任务",
      "description": "确定删除「{{title}}」吗？此操作不可撤销。"
    },
    "batchDeleteDialog": {
      "title": "批量删除任务",
      "description": "确定删除选中的 {{count}} 个任务吗？此操作不可撤销。"
    },
    "form": {
      "editTitle": "编辑任务",
      "createTitle": "新建任务",
      "title": "标题",
      "status": "状态",
      "priority": "优先级",
      "assignee": "负责人",
      "tags": "标签（逗号分隔）"
    }
  },
```

- [ ] **Step 2: 修改 `en.json` 的 `tasks` 段**

在 `src/i18n/locales/en.json` 中，同步替换 `tasks` 顶层对象为：

```json
  "tasks": {
    "title": "Task Board",
    "subtitle": "Manage all your tasks for this month here",
    "pageHeaderLabel": "Tasks page header",
    "status": {
      "backlog": "Backlog",
      "inProgress": "In Progress",
      "inReview": "In Review",
      "done": "Done"
    },
    "priority": {
      "urgent": "Urgent",
      "high": "High",
      "medium": "Medium",
      "low": "Low"
    },
    "label": {
      "bug": "Bug",
      "feature": "Feature",
      "docs": "Documentation",
      "chore": "Chore"
    },
    "columns": {
      "task": "Task",
      "title": "Title",
      "status": "Status",
      "priority": "Priority",
      "actions": "Actions"
    },
    "columnsLabel": "View",
    "actionsLabel": "Task actions",
    "new": "New Task",
    "updated": "Task updated",
    "created": "Task created",
    "deleted": "Task deleted",
    "unassigned": "Unassigned",
    "filterLabel": "Task filters",
    "search": "Search",
    "searchPlaceholder": "Filter by title or ID",
    "batchDelete": "Batch Delete ({{count}})",
    "batchDeleted_one": "Deleted {{count}} task",
    "batchDeleted_other": "Deleted {{count}} tasks",
    "batchDeleteFailed": "Batch delete failed. Please try again later.",
    "paginationLabel": "Task list pagination",
    "emptyTitle": "No tasks",
    "emptyDescription": "Adjust the filters, or click \"New Task\" in the top right",
    "deleteDialog": {
      "title": "Delete Task",
      "description": "Delete \"{{title}}\"? This action cannot be undone."
    },
    "batchDeleteDialog": {
      "title": "Batch Delete Tasks",
      "description_one": "Delete the {{count}} selected task? This action cannot be undone.",
      "description_other": "Delete the {{count}} selected tasks? This action cannot be undone."
    },
    "form": {
      "editTitle": "Edit Task",
      "createTitle": "New Task",
      "title": "Title",
      "status": "Status",
      "priority": "Priority",
      "assignee": "Assignee",
      "tags": "Tags (comma separated)"
    }
  },
```

- [ ] **Step 3: 用 Node 校验两个 locale 文件 JSON 合法且 key 结构一致**

```bash
node -e "
const zh = require('./src/i18n/locales/zh.json');
const en = require('./src/i18n/locales/en.json');
function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? keys(v, prefix + k + '.')
      : [prefix + k],
  );
}
const zhKeys = new Set(keys(zh.tasks, 'tasks.'));
const enKeys = new Set(keys(en.tasks, 'tasks.'));
const onlyZh = [...zhKeys].filter((k) => !enKeys.has(k) && !k.endsWith('_one') && !k.endsWith('_other'));
const onlyEn = [...enKeys].filter((k) => !zhKeys.has(k) && !k.endsWith('_one') && !k.endsWith('_other'));
if (onlyZh.length || onlyEn.length) {
  console.error('Mismatch:', { onlyZh, onlyEn });
  process.exit(1);
}
console.log('tasks.* key parity OK');
"
```

预期输出：`tasks.* key parity OK`（`_one`/`_other` 复数变体在校验时被忽略，因为它们是同一个 key 的语言特定变体，不要求逐字符对齐）。

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/zh.json src/i18n/locales/en.json
git commit -m "feat: 补充任务表格视图所需的 i18n 文案"
```

---

### Task 4: TaskFormDialog 改为右侧定位抽屉

**Files:**
- Modify: `src/features/tasks/TaskFormDialog.tsx`

**Interfaces:**
- Consumes: 无接口变化，仅调整 `Dialog` 的展示属性。
- Produces: `TaskFormDialog` 组件对外 props 不变（`isOpen`/`editingTask`/`isSubmitting`/`onOpenChange`/`onSubmit`），供 Task 5 的 `TaskTable.tsx` 沿用。

- [ ] **Step 1: 修改 `Dialog` 的定位、宽度与高度**

在 `src/features/tasks/TaskFormDialog.tsx` 中，把：

```tsx
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
```

替换为：

```tsx
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={420}
      maxHeight="100vh"
      position={{ top: 0, right: 0, bottom: 0 }}
    >
```

- [ ] **Step 2: 手动验证渲染**

```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
pnpm dev
```

在浏览器打开 `/tasks`，点击"新建任务"，确认表单从屏幕右侧铺满整个视口高度显示（而不是居中弹窗）。如果 `position` 的对象写法在类型层面报错，运行以下命令查看 `DialogPosition` 的实际类型形状后按实际类型调整（不要盲目猜测其它写法）：

```bash
pnpm exec astryx component Dialog --detail full 2>&1 | grep -A 5 "DialogPosition"
```

- [ ] **Step 3: Commit**

```bash
git add src/features/tasks/TaskFormDialog.tsx
git commit -m "feat: 任务表单 Dialog 改为右侧定位模拟抽屉"
```

---

### Task 5: 新建 TaskTable 表格视图，替换 Kanban

**Files:**
- Create: `src/features/tasks/TaskTable.tsx`
- Modify: `src/routes/_auth/tasks.tsx`
- Delete: `src/features/tasks/TaskBoard.tsx`
- Delete: `src/features/tasks/TaskCard.tsx`
- Delete: `src/features/tasks/groupTasksByStatus.ts`
- Delete: `src/features/tasks/groupTasksByStatus.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `TaskListParams`/`fetchTasks`；Task 2 的 `useTasks(params)`；Task 3 的 i18n key；Task 4 的 `TaskFormDialog`；`src/features/tasks/api.ts` 的 `createTask`/`updateTask`/`deleteTask`；`src/features/users` 的 `useUsers`；`Task` 类型（`id/title/status/priority/assigneeId/labels`）。
- Produces: `TaskTable` 组件（无 props），供 `src/routes/_auth/tasks.tsx` 渲染。

- [ ] **Step 1: 删除旧的看板文件**

```bash
git rm src/features/tasks/TaskBoard.tsx src/features/tasks/TaskCard.tsx src/features/tasks/groupTasksByStatus.ts src/features/tasks/groupTasksByStatus.test.ts
```

- [ ] **Step 2: 创建 `TaskTable.tsx`**

```tsx
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
import { useUsers } from "../users";
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

const COLUMN_OPTIONS = [
  { key: "task" as const, label: "task", isAlwaysVisible: true },
  { key: "title" as const, label: "title", isAlwaysVisible: true },
  { key: "status" as const, label: "status" },
  { key: "priority" as const, label: "priority" },
  { key: "actions" as const, label: "actions", isAlwaysVisible: true },
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
  const { users } = useUsers({ page: 1, pageSize: 100, keyword: "" });
  const userNameById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

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
      sortable: true,
      renderCell: (task) => <Text type="body">{formatTaskCode(task.id)}</Text>,
    },
    {
      key: "title",
      header: t("tasks.columns.title"),
      width: proportional(2.4),
      textOverflow: "truncate",
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
        onPageSizeChange={setPageSize}
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
```

注：`userNameById` 目前保留是为了后续在行内展示负责人姓名——如果最终没有单独的"负责人"列（当前列清单里没有），在实现时应当把 `assigneeId → name` 的展示直接放进 `title` 列或去掉未使用的 `userNameById`/`useUsers` 调用，避免遗留死代码（跑 `pnpm lint` 时 oxlint 的 no-unused-vars 规则会捕获这类问题，按报错结果删除即可）。

- [ ] **Step 3: 更新路由文件**

替换 `src/routes/_auth/tasks.tsx` 全文为：

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { TaskTable } from "../../features/tasks/TaskTable";

export const Route = createFileRoute("/_auth/tasks")({
  component: () => <TaskTable />,
});
```

- [ ] **Step 4: 类型检查与 lint**

```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
pnpm exec tsc --noEmit --pretty false
pnpm lint
```

预期：两条命令都无报错退出。若 `Dialog` 的 `position` 属性类型与 Task 4 中的写法不匹配，或 `MultiSelector`/`Pagination`/`useTableColumnSettings` 相关 API 与本任务代码的调用签名不符，运行 `pnpm exec astryx component <Name> --detail full` 核对实际类型定义后修正代码——不要绕过类型错误。

- [ ] **Step 5: 运行全量测试**

```bash
pnpm test
```

预期：全部测试 PASS。

- [ ] **Step 6: Commit**

```bash
git add src/features/tasks/TaskTable.tsx src/routes/_auth/tasks.tsx
git commit -m "feat: 任务看板重构为表格视图，替换拖拽 Kanban"
```

---

### Task 6: 浏览器手动验证

**Files:** 无代码改动（验证任务）。

- [ ] **Step 1: 启动开发服务器**

```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
pnpm dev
```

- [ ] **Step 2: 核对功能路径**

在浏览器打开 `/tasks`，依次验证：
1. 表格渲染，列含 Task/Title(+分类 Badge)/Status(StatusDot)/Priority(图标)/Actions。
2. 搜索框按标题/编号过滤；状态、优先级 MultiSelector 筛选生效，且切换筛选后回到第 1 页。
3. 点击列头排序（Task/Status/Priority）行为正确。
4. 勾选多行后，筛选行右侧变为"批量删除 (N)"按钮；确认弹窗后成功批量删除并刷新列表。
5. 未勾选时，筛选行右侧显示"显示列"多选器，可以隐藏 Status/Priority 列（Task/Title/Actions 保持不可关闭）。
6. 点击"新建任务"，表单从右侧铺满视口高度弹出（抽屉观感），保存后列表刷新、toast 提示正确。
7. 点击某行 MoreMenu 的编辑/删除，行为与原 Kanban 版本一致。
8. 底部 Pagination 切页、切换每页行数（10/20/30/40/50）均正确请求新数据。

- [ ] **Step 3: 视口断点检查**

按 [performance.md]/[testing.md] 的响应式要求，将浏览器宽度分别调整到 375px、768px、1440px，确认：筛选 Toolbar 换行不溢出、表格可横向滚动而不撑破页面、右侧抽屉在窄屏下仍可关闭（点击右上角关闭按钮或 Escape，如果 `purpose="form"` 禁用了 Escape，确认关闭按钮可用）。

- [ ] **Step 4: 记录结果**

如果发现任何断言失败或视觉异常，回到对应 Task 修正代码后重新执行本任务的 Step 1-3，直至全部通过。不需要额外提交（本任务本身不改代码）。

---

## Self-Review 记录

- **spec 覆盖**：设计文档中"组件结构/表格列/表单/删除/数据层/i18n/测试/风险"各节均对应到 Task 1–6，无遗漏。
- **占位符扫描**：全部代码块为可直接运行的完整实现，无 TBD/TODO；Task 5 中关于 `userNameById` 的注记是明确的清理指令（删列 vs. 使用），不是模糊留白。
- **类型一致性**：`TaskListParams`（Task 1）→ `useTasks`/`tasksKey`（Task 1、2）→ `TaskTable` 调用（Task 5）参数名/形状一致；`Task`/`TaskStatus`/`TaskPriority` 类型贯穿全部任务未变。`formatTaskCode` 在 UI（Task 5）和 mock handler（Task 1）中各自实现一份小函数，是有意为之（mocks 层与 features 层历来不互相 import，避免引入跨层依赖），已在设计文档"风险与边界"之外的实现细节中说明。
