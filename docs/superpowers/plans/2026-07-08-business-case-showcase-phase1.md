# 业务案例展示 · 第一批（Dashboard 图表 + Tasks 看板 + Apps 集成市场）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 astryx-admin 从"仪表盘 KPI + 用户管理"扩展为覆盖 Dashboard 图表、Tasks 看板、Apps 集成市场三个新业务板块的演示站，最大化 astryx 组件覆盖面。

**Architecture:** 严格沿用仓库现状约定 — TanStack Router 文件路由（`src/routes/_auth/...`）、feature 目录（`types.ts`+`api.ts`+`useX.ts`+组件）、swr（全局 fetcher，key 为纯路径字符串）+ ky、MSW mock（本批拆分为按域的 `mocks/data/*`、`mocks/handlers/*`）、`AlertDialog`/`Dialog`+`Toast` 的增删改交互模式。Kanban 看板放弃复刻 astryx `kanban-board` 模板内部手搓的 pointer-event 拖拽物理引擎（该模板的 `Board`/`BoardColumn`/`BoardCard` 并非 `@astryxdesign/core` 导出，全是模板本地代码），改用原生 HTML5 拖拽（`draggable`+`onDragStart`+`onDragOver`+`onDrop`）包裹真实 astryx `Card`/`Badge`/`MoreMenu`，代码量小得多且同样是"真拖拽"体验。

**Tech Stack:** React 19 + TypeScript + `@astryxdesign/core` + TanStack Router + swr + ky + MSW + Vitest（`vp test run`）+ 新增 `recharts`（图表，astryx 的 dashboard 模板直接引用 `recharts` 而非自己的组件）。

## Global Constraints

- 所有终端命令前必须先执行 `export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"`（本机默认 shell Node 是 v16，项目要求 Node ≥22.13）。假设本 session 已执行一次，后续命令块不再重复这行。
- 不写 `<div>`/裸 HTML 布局，只用 astryx 组件（`Stack`/`Grid`/`Card`/`Layout` 等）；自定义样式走组件 props 或 design tokens，不写 `style={{}}`、不用 hex/px 字面量。
- 所有 UI 文案用中文，风格与现有 `UserTable.tsx`/`UserFormDialog.tsx` 一致。
- swr 用法：`useSWR<T>(path)` 不传第二个 fetcher 参数（全局 fetcher 已在 `src/lib/swr.tsx` 配置，见 `lib/http.ts` 的 `fetcher<T>`）。
- MSW handler 路径匹配一律用 `*/api/xxx` 通配前缀（现有 `handlers.ts` 的写法），因为 `http.ts` 的 ky 实例设了 `prefix: "/api"`。
- 增删改的错误提示统一走 `useToast()` + `error instanceof ApiError ? error.message : fallback` 模式（见 `UserTable.tsx` 的 `notifyError`）。
- 不新增 E2E 框架（仓库目前只有 Vitest，保持现状）。
- 每个任务完成后运行 `pnpm exec vp test run` 和 `pnpm exec tsc --noEmit` 作为回归验证，再提交。

---

## Task 1: 拆分 mocks 目录 + 引入 recharts

纯重构任务：把现有单文件 `src/mocks/data.ts`、`src/mocks/handlers.ts` 按业务域拆分成目录，为后续 Tasks/Apps/Dashboard 三个新域腾出干净的落点。这一步不改变任何行为，用现有测试套件当回归安全网。

**Files:**
- Create: `src/mocks/data/users.ts`
- Create: `src/mocks/data/index.ts`
- Create: `src/mocks/handlers/auth.ts`
- Create: `src/mocks/handlers/users.ts`
- Create: `src/mocks/handlers/dashboard.ts`
- Create: `src/mocks/handlers/index.ts`
- Delete: `src/mocks/data.ts`
- Delete: `src/mocks/handlers.ts`
- Modify: `package.json`（新增 `recharts` 依赖）

**Interfaces:**
- Produces: `MockUser`、`createSeedUsers` 从 `src/mocks/data/users.ts` 导出（供后续 handler 使用）；`handlers`（合并数组）从 `src/mocks/handlers/index.ts` 导出，路径与之前完全一致（`../../mocks/handlers`、`./handlers` 都会自动解析到目录的 `index.ts`，消费方零改动）。
- 后续任务（Task 2/4/6）会分别新增 `src/mocks/data/tasks.ts`、`src/mocks/data/apps.ts`、`src/mocks/data/dashboard.ts`，以及对应 `src/mocks/handlers/tasks.ts`、`src/mocks/handlers/apps.ts`，并把它们加进 `src/mocks/data/index.ts` 和 `src/mocks/handlers/index.ts` 的重新导出/合并列表。

- [ ] **Step 1: 创建 `src/mocks/data/users.ts`**（从 `src/mocks/data.ts` 原样迁移）

```ts
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: string;
}

const ROLES = ["admin", "editor", "viewer"] as const;

export function createSeedUsers(count = 43): MockUser[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    name: `用户${String(index + 1).padStart(2, "0")}`,
    email: `user${index + 1}@example.com`,
    role: ROLES[index % ROLES.length],
    isActive: index % 5 !== 0,
    createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
  }));
}
```

- [ ] **Step 2: 创建 `src/mocks/data/index.ts`**

```ts
export * from "./users";
```

- [ ] **Step 3: 创建 `src/mocks/handlers/auth.ts`**（从 `src/mocks/handlers.ts` 拆出登录部分）

```ts
import { HttpResponse, http } from "msw";

export const authHandlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };
    if (password !== "admin123") {
      return HttpResponse.json(
        { code: "BAD_CREDENTIALS", message: "用户名或密码错误" },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      token: `mock-token-${Date.now()}`,
      user: { id: "1", name: username, email: `${username}@example.com` },
    });
  }),
];
```

- [ ] **Step 4: 创建 `src/mocks/handlers/users.ts`**（可变内存存储 + 用户 CRUD，从 `handlers.ts` 拆出）

```ts
import { HttpResponse, http } from "msw";
import { createSeedUsers, type MockUser } from "../data/users";

export let users = createSeedUsers();
let nextId = users.length + 1;

export const userHandlers = [
  http.get("*/api/users", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const keyword = url.searchParams.get("keyword") ?? "";
    const filtered = keyword
      ? users.filter((u) => u.name.includes(keyword) || u.email.includes(keyword))
      : users;
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
    });
  }),

  http.post("*/api/users", async ({ request }) => {
    const body = (await request.json()) as Omit<MockUser, "id" | "createdAt">;
    const user: MockUser = {
      ...body,
      id: String(nextId++),
      createdAt: new Date().toISOString(),
    };
    users = [user, ...users];
    return HttpResponse.json(user, { status: 201 });
  }),

  http.put("*/api/users/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<MockUser>;
    const existing = users.find((u) => u.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "用户不存在" }, { status: 404 });
    }
    const updated = { ...existing, ...body, id: existing.id };
    users = users.map((u) => (u.id === existing.id ? updated : u));
    return HttpResponse.json(updated);
  }),

  http.delete("*/api/users/:id", ({ params }) => {
    users = users.filter((u) => u.id !== params.id);
    return HttpResponse.json({ ok: true });
  }),
];
```

- [ ] **Step 5: 创建 `src/mocks/handlers/dashboard.ts`**（仅 stats 端点，trend/events 在 Task 6 补充）

```ts
import { HttpResponse, http } from "msw";
import { users } from "./users";

export const dashboardHandlers = [
  http.get("*/api/dashboard/stats", () =>
    HttpResponse.json({
      userTotal: users.length,
      activeToday: users.filter((u) => u.isActive).length,
      orderTotal: 1280,
      errorCount: 3,
    }),
  ),
];
```

- [ ] **Step 6: 创建 `src/mocks/handlers/index.ts`**

```ts
import { authHandlers } from "./auth";
import { dashboardHandlers } from "./dashboard";
import { userHandlers } from "./users";

export const handlers = [...authHandlers, ...dashboardHandlers, ...userHandlers];
```

- [ ] **Step 7: 删除旧文件**

```bash
rm src/mocks/data.ts src/mocks/handlers.ts
```

- [ ] **Step 8: 安装 recharts**

```bash
pnpm add recharts
```

- [ ] **Step 9: 回归验证——确认拆分没有破坏任何现有行为**

```bash
pnpm exec vp test run
pnpm exec tsc --noEmit
```

Expected: 全部现有测试（`http.test.ts`、`auth.test.ts`、`ui.test.ts`、`PageBreadcrumbs.test.ts`、`users/api.test.ts`）通过，无类型错误。`src/mocks/browser.ts` 里的 `import { handlers } from "./handlers";` 和 `users/api.test.ts` 里的 `import { handlers } from "../../mocks/handlers";` 无需改动，会自动解析到新的 `index.ts`。

- [ ] **Step 10: 提交**

```bash
git add src/mocks package.json pnpm-lock.yaml
git commit -m "refactor: mocks 按业务域拆分目录，新增 recharts 依赖"
```

---

## Task 2: Tasks 数据层（类型 + API + hook + MSW handler）

**Files:**
- Create: `src/mocks/data/tasks.ts`
- Modify: `src/mocks/data/index.ts`
- Create: `src/mocks/handlers/tasks.ts`
- Modify: `src/mocks/handlers/index.ts`
- Create: `src/features/tasks/types.ts`
- Create: `src/features/tasks/api.ts`
- Test: `src/features/tasks/api.test.ts`
- Create: `src/features/tasks/useTasks.ts`

**Interfaces:**
- Consumes: `http`（`src/lib/http.ts`）、`ApiError`
- Produces: `Task`、`TaskInput`、`TaskStatus`（`"backlog"|"in-progress"|"in-review"|"done"`）、`TaskPriority`（`"low"|"medium"|"high"|"urgent"`）、`TaskListResult` 类型；`fetchTasks(): Promise<TaskListResult>`、`createTask(input: TaskInput): Promise<Task>`、`updateTask(id: string, input: Partial<TaskInput>): Promise<Task>`、`deleteTask(id: string): Promise<void>`；`useTasks(): { tasks: Task[]; isLoading: boolean; refresh: () => void }`。Task 3（看板 UI）依赖这些精确签名。

- [ ] **Step 1: 创建 `src/mocks/data/tasks.ts`**

```ts
export type TaskStatus = "backlog" | "in-progress" | "in-review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface MockTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  labels: string[];
  createdAt: string;
}

const STATUSES: TaskStatus[] = ["backlog", "in-progress", "in-review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const LABEL_POOL = ["bug", "feature", "docs", "chore"];

export function createSeedTasks(count = 32): MockTask[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    title: `任务 ${String(index + 1).padStart(2, "0")}：优化第 ${index + 1} 项工作流`,
    status: STATUSES[index % STATUSES.length],
    priority: PRIORITIES[index % PRIORITIES.length],
    assigneeId: String((index % 43) + 1),
    labels: [LABEL_POOL[index % LABEL_POOL.length]],
    createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
  }));
}
```

- [ ] **Step 2: 修改 `src/mocks/data/index.ts`**

```ts
export * from "./tasks";
export * from "./users";
```

- [ ] **Step 3: 创建 `src/mocks/handlers/tasks.ts`**

```ts
import { HttpResponse, http } from "msw";
import { createSeedTasks, type MockTask } from "../data/tasks";

export let tasks = createSeedTasks();
let nextId = tasks.length + 1;

export const taskHandlers = [
  http.get("*/api/tasks", () => HttpResponse.json({ items: tasks })),

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

- [ ] **Step 4: 修改 `src/mocks/handlers/index.ts`**

```ts
import { authHandlers } from "./auth";
import { dashboardHandlers } from "./dashboard";
import { taskHandlers } from "./tasks";
import { userHandlers } from "./users";

export const handlers = [...authHandlers, ...dashboardHandlers, ...userHandlers, ...taskHandlers];
```

- [ ] **Step 5: 创建 `src/features/tasks/types.ts`**

```ts
export type TaskStatus = "backlog" | "in-progress" | "in-review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  labels: string[];
  createdAt: string;
}

export type TaskInput = Omit<Task, "id" | "createdAt">;

export interface TaskListResult {
  items: Task[];
}
```

- [ ] **Step 6: 创建 `src/features/tasks/api.ts`**

```ts
import { http } from "../../lib/http";
import type { Task, TaskInput, TaskListResult } from "./types";

export const tasksKey = "tasks";

export function fetchTasks(): Promise<TaskListResult> {
  return http.get(tasksKey).json<TaskListResult>();
}

export function createTask(input: TaskInput): Promise<Task> {
  return http.post(tasksKey, { json: input }).json<Task>();
}

export function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  return http.put(`${tasksKey}/${id}`, { json: input }).json<Task>();
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`${tasksKey}/${id}`).json();
}
```

- [ ] **Step 7: 写失败测试 `src/features/tasks/api.test.ts`**

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { createTask, deleteTask, fetchTasks, updateTask } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
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

  const list = await fetchTasks();
  expect(list.items.some((t) => t.id === created.id)).toBe(true);

  await deleteTask(created.id);
  const after = await fetchTasks();
  expect(after.items.some((t) => t.id === created.id)).toBe(false);
});
```

- [ ] **Step 8: 运行测试确认通过**（此时实现已同步写好，属于同一 API 契约，不存在"先失败"的中间态——若失败说明 handler 或 api.ts 有拼写错误，需修正）

```bash
pnpm exec vp test run src/features/tasks/api.test.ts
```

Expected: PASS（`任务 CRUD 全链路`）

- [ ] **Step 9: 创建 `src/features/tasks/useTasks.ts`**

```ts
import useSWR from "swr";
import { tasksKey } from "./api";
import type { TaskListResult } from "./types";

export function useTasks() {
  const { data, isLoading, mutate } = useSWR<TaskListResult>(tasksKey);
  return {
    tasks: data?.items ?? [],
    isLoading,
    refresh: mutate,
  };
}
```

- [ ] **Step 10: 全量回归 + 提交**

```bash
pnpm exec vp test run
pnpm exec tsc --noEmit
git add src/mocks src/features/tasks
git commit -m "feat: 新增 Tasks 数据层（mock handler + api + hook）"
```

---

## Task 3: Tasks 看板 UI + 路由 + 导航

**Files:**
- Create: `src/features/tasks/groupTasksByStatus.ts`
- Test: `src/features/tasks/groupTasksByStatus.test.ts`
- Create: `src/features/tasks/TaskCard.tsx`
- Create: `src/features/tasks/TaskFormDialog.tsx`
- Create: `src/features/tasks/TaskBoard.tsx`
- Create: `src/routes/_auth/tasks.tsx`
- Modify: `src/components/layout/AdminShell.tsx`

**Interfaces:**
- Consumes: Task 2 的 `Task`/`TaskInput`/`TaskStatus`/`TaskPriority`、`useTasks()`、`createTask`/`updateTask`/`deleteTask`；`useUsers`（`src/features/users/useUsers.ts`，已存在）用于负责人姓名查找和表单下拉选项；`ApiError`（`src/lib/http.ts`）。
- Produces: `groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]>`、`TASK_STATUSES: TaskStatus[]`；`<TaskBoard />` 挂载到 `/tasks` 路由。

- [ ] **Step 1: 写失败测试 `src/features/tasks/groupTasksByStatus.test.ts`**

```ts
import { expect, test } from "vitest";
import { groupTasksByStatus } from "./groupTasksByStatus";
import type { Task } from "./types";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "1",
    title: "t",
    status: "backlog",
    priority: "medium",
    assigneeId: "1",
    labels: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("按状态分组任务", () => {
  const tasks = [
    makeTask({ id: "1", status: "backlog" }),
    makeTask({ id: "2", status: "done" }),
    makeTask({ id: "3", status: "backlog" }),
  ];
  const groups = groupTasksByStatus(tasks);
  expect(groups.backlog.map((t) => t.id)).toEqual(["1", "3"]);
  expect(groups.done.map((t) => t.id)).toEqual(["2"]);
  expect(groups["in-progress"]).toEqual([]);
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
pnpm exec vp test run src/features/tasks/groupTasksByStatus.test.ts
```

Expected: FAIL，报 `Cannot find module './groupTasksByStatus'`

- [ ] **Step 3: 创建 `src/features/tasks/groupTasksByStatus.ts`**

```ts
import type { Task, TaskStatus } from "./types";

export const TASK_STATUSES: TaskStatus[] = ["backlog", "in-progress", "in-review", "done"];

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, [] as Task[]]),
  ) as Record<TaskStatus, Task[]>;
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  return groups;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
pnpm exec vp test run src/features/tasks/groupTasksByStatus.test.ts
```

Expected: PASS

- [ ] **Step 5: 创建 `src/features/tasks/TaskCard.tsx`**

```tsx
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
```

- [ ] **Step 6: 创建 `src/features/tasks/TaskFormDialog.tsx`**（结构镜像已有的 `src/features/users/UserFormDialog.tsx`）

```tsx
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
```

- [ ] **Step 7: 创建 `src/features/tasks/TaskBoard.tsx`**

```tsx
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
              onDrop={() => handleDrop(status)}
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
```

- [ ] **Step 8: 创建 `src/routes/_auth/tasks.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TaskBoard } from "../../features/tasks/TaskBoard";

export const Route = createFileRoute("/_auth/tasks")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">任务看板</Text>
      <TaskBoard />
    </Stack>
  ),
});
```

- [ ] **Step 9: 修改 `src/components/layout/AdminShell.tsx`** — 新增"工作"分组和"任务看板"导航项

把 import 行：

```tsx
import { LayoutDashboard, Palette, Settings, UserCircle, Users } from "lucide-react";
```

改为：

```tsx
import { KanbanSquare, LayoutDashboard, Palette, Settings, UserCircle, Users } from "lucide-react";
```

在 `<SideNavSection title="概览">...</SideNavSection>` 之后、`<SideNavSection title="管理">` 之前插入：

```tsx
          <SideNavSection title="工作">
            <SideNavItem
              label="任务看板"
              href="/tasks"
              icon={KanbanSquare}
              selectedIcon={KanbanSquare}
              isSelected={pathname === "/tasks"}
            />
          </SideNavSection>
```

- [ ] **Step 10: 类型检查 + 手工验证**

```bash
pnpm exec tsc --noEmit
pnpm exec vp dev
```

手工验证清单：访问 `/tasks`，确认 4 列（待办/进行中/评审中/已完成）渲染、卡片显示优先级 `Badge` 和负责人姓名、拖拽卡片到另一列后状态持久化（刷新页面仍在新列）、"新建任务"弹窗可创建、卡片 `MoreMenu` 的编辑/删除可用、侧边栏"工作 > 任务看板"高亮。

- [ ] **Step 11: 全量回归 + 提交**

```bash
pnpm exec vp test run
git add src/features/tasks src/routes/_auth/tasks.tsx src/components/layout/AdminShell.tsx
git commit -m "feat: Tasks 看板页面（拖拽改状态 + 增删改）"
```

---

## Task 4: Apps 集成市场数据层（类型 + API + hook + MSW handler）

**Files:**
- Create: `src/mocks/data/apps.ts`
- Modify: `src/mocks/data/index.ts`
- Create: `src/mocks/handlers/apps.ts`
- Modify: `src/mocks/handlers/index.ts`
- Create: `src/features/apps/types.ts`
- Create: `src/features/apps/api.ts`
- Test: `src/features/apps/api.test.ts`
- Create: `src/features/apps/useIntegrations.ts`

**Interfaces:**
- Produces: `Integration`、`AppCategory`（`"沟通协作"|"开发工具"|"支付"|"自动化"|"数据分析"`）、`IntegrationListResult`；`fetchIntegrations(): Promise<IntegrationListResult>`、`connectIntegration(id: string): Promise<Integration>`、`disconnectIntegration(id: string): Promise<Integration>`；`useIntegrations(): { apps: Integration[]; isLoading: boolean; refresh: () => void }`。Task 5 依赖这些签名。

- [ ] **Step 1: 创建 `src/mocks/data/apps.ts`**

```ts
export type AppCategory = "沟通协作" | "开发工具" | "支付" | "自动化" | "数据分析";

export interface MockIntegration {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  icon: string;
  isConnected: boolean;
}

export function createSeedIntegrations(): MockIntegration[] {
  return [
    { id: "slack", name: "Slack", description: "团队即时消息与通知同步", category: "沟通协作", icon: "MessageSquare", isConnected: true },
    { id: "discord", name: "Discord", description: "社区与团队语音协作", category: "沟通协作", icon: "MessagesSquare", isConnected: false },
    { id: "github", name: "GitHub", description: "代码托管与 CI 状态同步", category: "开发工具", icon: "Github", isConnected: true },
    { id: "linear", name: "Linear", description: "研发任务与迭代跟踪", category: "开发工具", icon: "ListChecks", isConnected: false },
    { id: "figma", name: "Figma", description: "设计稿评审与交付同步", category: "开发工具", icon: "Figma", isConnected: false },
    { id: "stripe", name: "Stripe", description: "订阅账单与支付对账", category: "支付", icon: "CreditCard", isConnected: true },
    { id: "paypal", name: "PayPal", description: "跨境收款与结算", category: "支付", icon: "Wallet", isConnected: false },
    { id: "zapier", name: "Zapier", description: "跨应用自动化工作流", category: "自动化", icon: "Workflow", isConnected: false },
    { id: "n8n", name: "n8n", description: "自托管自动化编排", category: "自动化", icon: "GitBranch", isConnected: false },
    { id: "google-analytics", name: "Google Analytics", description: "产品流量与转化分析", category: "数据分析", icon: "BarChart3", isConnected: true },
    { id: "mixpanel", name: "Mixpanel", description: "用户行为漏斗分析", category: "数据分析", icon: "PieChart", isConnected: false },
  ];
}
```

- [ ] **Step 2: 修改 `src/mocks/data/index.ts`**

```ts
export * from "./apps";
export * from "./tasks";
export * from "./users";
```

- [ ] **Step 3: 创建 `src/mocks/handlers/apps.ts`**

```ts
import { HttpResponse, http } from "msw";
import { createSeedIntegrations } from "../data/apps";

export let apps = createSeedIntegrations();

export const appHandlers = [
  http.get("*/api/apps", () => HttpResponse.json({ items: apps })),

  http.post("*/api/apps/:id/connect", ({ params }) => {
    const existing = apps.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "应用不存在" }, { status: 404 });
    }
    const updated = { ...existing, isConnected: true };
    apps = apps.map((a) => (a.id === existing.id ? updated : a));
    return HttpResponse.json(updated);
  }),

  http.post("*/api/apps/:id/disconnect", ({ params }) => {
    const existing = apps.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "应用不存在" }, { status: 404 });
    }
    const updated = { ...existing, isConnected: false };
    apps = apps.map((a) => (a.id === existing.id ? updated : a));
    return HttpResponse.json(updated);
  }),
];
```

- [ ] **Step 4: 修改 `src/mocks/handlers/index.ts`**

```ts
import { appHandlers } from "./apps";
import { authHandlers } from "./auth";
import { dashboardHandlers } from "./dashboard";
import { taskHandlers } from "./tasks";
import { userHandlers } from "./users";

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...userHandlers,
  ...taskHandlers,
  ...appHandlers,
];
```

- [ ] **Step 5: 创建 `src/features/apps/types.ts`**

```ts
export type AppCategory = "沟通协作" | "开发工具" | "支付" | "自动化" | "数据分析";

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  icon: string;
  isConnected: boolean;
}

export interface IntegrationListResult {
  items: Integration[];
}
```

- [ ] **Step 6: 创建 `src/features/apps/api.ts`**

```ts
import { http } from "../../lib/http";
import type { Integration, IntegrationListResult } from "./types";

export const appsKey = "apps";

export function fetchIntegrations(): Promise<IntegrationListResult> {
  return http.get(appsKey).json<IntegrationListResult>();
}

export function connectIntegration(id: string): Promise<Integration> {
  return http.post(`apps/${id}/connect`).json<Integration>();
}

export function disconnectIntegration(id: string): Promise<Integration> {
  return http.post(`apps/${id}/disconnect`).json<Integration>();
}
```

- [ ] **Step 7: 写测试 `src/features/apps/api.test.ts`**

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { connectIntegration, disconnectIntegration, fetchIntegrations } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

test("应用连接与断开", async () => {
  const before = await fetchIntegrations();
  const target = before.items.find((a) => !a.isConnected);
  expect(target).toBeTruthy();
  if (!target) return;

  const connected = await connectIntegration(target.id);
  expect(connected.isConnected).toBe(true);

  const disconnected = await disconnectIntegration(target.id);
  expect(disconnected.isConnected).toBe(false);
});
```

- [ ] **Step 8: 运行测试确认通过**

```bash
pnpm exec vp test run src/features/apps/api.test.ts
```

Expected: PASS（`应用连接与断开`）

- [ ] **Step 9: 创建 `src/features/apps/useIntegrations.ts`**

```ts
import useSWR from "swr";
import { appsKey } from "./api";
import type { IntegrationListResult } from "./types";

export function useIntegrations() {
  const { data, isLoading, mutate } = useSWR<IntegrationListResult>(appsKey);
  return {
    apps: data?.items ?? [],
    isLoading,
    refresh: mutate,
  };
}
```

- [ ] **Step 10: 全量回归 + 提交**

```bash
pnpm exec vp test run
pnpm exec tsc --noEmit
git add src/mocks src/features/apps
git commit -m "feat: 新增 Apps 集成市场数据层（mock handler + api + hook）"
```

---

## Task 5: Apps 集成市场 UI + 路由 + 导航

**Files:**
- Create: `src/features/apps/AppsGrid.tsx`
- Create: `src/routes/_auth/apps.tsx`
- Modify: `src/components/layout/AdminShell.tsx`

**Interfaces:**
- Consumes: Task 4 的 `Integration`、`AppCategory`、`useIntegrations()`、`connectIntegration`/`disconnectIntegration`；`ApiError`。
- Produces: `<AppsGrid />` 挂载到 `/apps` 路由。

- [ ] **Step 1: 创建 `src/features/apps/AppsGrid.tsx`**

```tsx
import { useMemo, useState } from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Icon } from "@astryxdesign/core/Icon";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import {
  BarChart3,
  CreditCard,
  Figma,
  GitBranch,
  Github,
  ListChecks,
  MessageSquare,
  MessagesSquare,
  PieChart,
  Wallet,
  Workflow,
} from "lucide-react";
import { ApiError } from "../../lib/http";
import { connectIntegration, disconnectIntegration } from "./api";
import { useIntegrations } from "./useIntegrations";
import type { AppCategory } from "./types";

const ICONS: Record<string, typeof MessageSquare> = {
  MessageSquare,
  MessagesSquare,
  Github,
  ListChecks,
  Figma,
  CreditCard,
  Wallet,
  Workflow,
  GitBranch,
  BarChart3,
  PieChart,
};

const CATEGORIES: (AppCategory | "全部")[] = ["全部", "沟通协作", "开发工具", "支付", "自动化", "数据分析"];

export function AppsGrid() {
  const { apps, isLoading, refresh } = useIntegrations();
  const [category, setCategory] = useState<AppCategory | "全部">("全部");
  const toast = useToast();

  const filtered = useMemo(
    () => (category === "全部" ? apps : apps.filter((app) => app.category === category)),
    [apps, category],
  );

  const handleToggle = async (id: string, isConnected: boolean) => {
    try {
      if (isConnected) {
        await disconnectIntegration(id);
        toast({ body: "已断开连接" });
      } else {
        await connectIntegration(id);
        toast({ body: "已连接" });
      }
      await refresh();
    } catch (error) {
      toast({
        body: error instanceof ApiError ? error.message : "操作失败，请稍后重试",
        type: "error",
      });
    }
  };

  return (
    <Stack direction="vertical" gap={4}>
      <SegmentedControl
        label="按分类筛选"
        value={category}
        onChange={(value) => setCategory(value as AppCategory | "全部")}
      >
        {CATEGORIES.map((item) => (
          <SegmentedControlItem key={item} value={item} label={item} />
        ))}
      </SegmentedControl>

      {isLoading ? (
        <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </Grid>
      ) : filtered.length === 0 ? (
        <EmptyState title="没有匹配的应用" description="切换分类查看其他应用" />
      ) : (
        <Grid columns={{ minWidth: 240, max: 4 }} gap={4}>
          {filtered.map((app) => (
            <SelectableCard
              key={app.id}
              label={app.name}
              isSelected={app.isConnected}
              onChange={() => handleToggle(app.id, app.isConnected)}
            >
              <Stack direction="vertical" gap={2}>
                <Icon icon={ICONS[app.icon]} size="lg" />
                <Text type="large">{app.name}</Text>
                <Text type="supporting" color="secondary">
                  {app.description}
                </Text>
                <Badge label={app.category} variant="neutral" />
              </Stack>
            </SelectableCard>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
```

- [ ] **Step 2: 创建 `src/routes/_auth/apps.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { AppsGrid } from "../../features/apps/AppsGrid";

export const Route = createFileRoute("/_auth/apps")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">应用集成</Text>
      <AppsGrid />
    </Stack>
  ),
});
```

- [ ] **Step 3: 修改 `src/components/layout/AdminShell.tsx`** — 在"工作"分组补充"应用集成"

把 import 行改为（新增 `Blocks`）：

```tsx
import { Blocks, KanbanSquare, LayoutDashboard, Palette, Settings, UserCircle, Users } from "lucide-react";
```

把 Task 3 新增的"工作"分组扩展为：

```tsx
          <SideNavSection title="工作">
            <SideNavItem
              label="任务看板"
              href="/tasks"
              icon={KanbanSquare}
              selectedIcon={KanbanSquare}
              isSelected={pathname === "/tasks"}
            />
            <SideNavItem
              label="应用集成"
              href="/apps"
              icon={Blocks}
              selectedIcon={Blocks}
              isSelected={pathname === "/apps"}
            />
          </SideNavSection>
```

- [ ] **Step 4: 类型检查 + 手工验证**

```bash
pnpm exec tsc --noEmit
pnpm exec vp dev
```

手工验证清单：访问 `/apps`，确认卡片网格渲染 11 个集成、分类筛选切换生效、点击卡片切换连接状态并弹出对应 `Toast`、`EmptyState` 在筛选无结果时显示、侧边栏"工作 > 应用集成"高亮。

- [ ] **Step 5: 全量回归 + 提交**

```bash
pnpm exec vp test run
git add src/features/apps src/routes/_auth/apps.tsx src/components/layout/AdminShell.tsx
git commit -m "feat: Apps 集成市场页面（分类筛选 + 连接状态切换）"
```

---

## Task 6: Dashboard 图表数据层（类型 + API + hook + MSW handler）

**Files:**
- Create: `src/mocks/data/dashboard.ts`
- Modify: `src/mocks/data/index.ts`
- Modify: `src/mocks/handlers/dashboard.ts`
- Create: `src/features/dashboard/types.ts`
- Create: `src/features/dashboard/api.ts`
- Test: `src/features/dashboard/api.test.ts`
- Create: `src/features/dashboard/useDashboardTrend.ts`
- Create: `src/features/dashboard/useRecentEvents.ts`

**Interfaces:**
- Produces: `RevenueTrendPoint`、`ActiveUsersPoint`、`DashboardTrend`、`RecentEvent`、`RecentEventsResult`；`fetchDashboardTrend(): Promise<DashboardTrend>`、`fetchRecentEvents(): Promise<RecentEventsResult>`；`useDashboardTrend(): { trend: DashboardTrend | undefined; isLoading: boolean }`、`useRecentEvents(): { events: RecentEvent[]; isLoading: boolean }`。Task 7 依赖这些签名。

- [ ] **Step 1: 创建 `src/mocks/data/dashboard.ts`**

```ts
export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export interface ActiveUsersPoint {
  date: string;
  count: number;
}

export interface RecentEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

export function createRevenueTrend(): RevenueTrendPoint[] {
  const base = 82000;
  return Array.from({ length: 12 }, (_, index) => ({
    month: `2025-${String(index + 1).padStart(2, "0")}`,
    revenue: base + index * 3200 + (index % 3 === 0 ? 1500 : -800),
  }));
}

export function createActiveUsersTrend(): ActiveUsersPoint[] {
  const base = 1200;
  return Array.from({ length: 30 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 5, 1 + index)).toISOString().slice(0, 10),
    count: base + Math.round(Math.sin(index / 4) * 120) + index * 6,
  }));
}

const EVENT_ACTIONS = ["创建了任务", "连接了应用", "更新了资料", "邀请了成员"] as const;

export function createRecentEvents(count = 8): RecentEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    actor: `用户${String((index % 43) + 1).padStart(2, "0")}`,
    action: EVENT_ACTIONS[index % EVENT_ACTIONS.length],
    target: `工作项 #${1000 + index}`,
    createdAt: new Date(Date.UTC(2026, 6, 8, 12 - index)).toISOString(),
  }));
}
```

- [ ] **Step 2: 修改 `src/mocks/data/index.ts`**

```ts
export * from "./apps";
export * from "./dashboard";
export * from "./tasks";
export * from "./users";
```

- [ ] **Step 3: 修改 `src/mocks/handlers/dashboard.ts`** — 新增 trend/events 端点

```ts
import { HttpResponse, http } from "msw";
import { createActiveUsersTrend, createRecentEvents, createRevenueTrend } from "../data/dashboard";
import { users } from "./users";

export const dashboardHandlers = [
  http.get("*/api/dashboard/stats", () =>
    HttpResponse.json({
      userTotal: users.length,
      activeToday: users.filter((u) => u.isActive).length,
      orderTotal: 1280,
      errorCount: 3,
    }),
  ),

  http.get("*/api/dashboard/trend", () =>
    HttpResponse.json({
      revenue: createRevenueTrend(),
      activeUsers: createActiveUsersTrend(),
    }),
  ),

  http.get("*/api/dashboard/events", () => HttpResponse.json({ items: createRecentEvents() })),
];
```

- [ ] **Step 4: 创建 `src/features/dashboard/types.ts`**

```ts
export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export interface ActiveUsersPoint {
  date: string;
  count: number;
}

export interface DashboardTrend {
  revenue: RevenueTrendPoint[];
  activeUsers: ActiveUsersPoint[];
}

export interface RecentEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

export interface RecentEventsResult {
  items: RecentEvent[];
}
```

- [ ] **Step 5: 创建 `src/features/dashboard/api.ts`**

```ts
import { http } from "../../lib/http";
import type { DashboardTrend, RecentEventsResult } from "./types";

export function fetchDashboardTrend(): Promise<DashboardTrend> {
  return http.get("dashboard/trend").json<DashboardTrend>();
}

export function fetchRecentEvents(): Promise<RecentEventsResult> {
  return http.get("dashboard/events").json<RecentEventsResult>();
}
```

- [ ] **Step 6: 写测试 `src/features/dashboard/api.test.ts`**

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { fetchDashboardTrend, fetchRecentEvents } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

test("获取仪表盘趋势数据", async () => {
  const trend = await fetchDashboardTrend();
  expect(trend.revenue).toHaveLength(12);
  expect(trend.activeUsers).toHaveLength(30);
});

test("获取最近活动事件", async () => {
  const events = await fetchRecentEvents();
  expect(events.items.length).toBeGreaterThan(0);
  expect(events.items[0]).toHaveProperty("actor");
});
```

- [ ] **Step 7: 运行测试确认通过**

```bash
pnpm exec vp test run src/features/dashboard/api.test.ts
```

Expected: PASS（两个测试均通过）

- [ ] **Step 8: 创建 `src/features/dashboard/useDashboardTrend.ts`**

```ts
import useSWR from "swr";
import type { DashboardTrend } from "./types";

export function useDashboardTrend() {
  const { data, isLoading } = useSWR<DashboardTrend>("dashboard/trend");
  return { trend: data, isLoading };
}
```

- [ ] **Step 9: 创建 `src/features/dashboard/useRecentEvents.ts`**

```ts
import useSWR from "swr";
import type { RecentEventsResult } from "./types";

export function useRecentEvents() {
  const { data, isLoading } = useSWR<RecentEventsResult>("dashboard/events");
  return { events: data?.items ?? [], isLoading };
}
```

- [ ] **Step 10: 全量回归 + 提交**

```bash
pnpm exec vp test run
pnpm exec tsc --noEmit
git add src/mocks src/features/dashboard
git commit -m "feat: 新增 Dashboard 趋势/活动数据层（mock handler + api + hook）"
```

---

## Task 7: Dashboard 图表 UI + 最近活动表格 + 接入首页

**Files:**
- Create: `src/features/dashboard/TrendCharts.tsx`
- Create: `src/features/dashboard/RecentActivityTable.tsx`
- Modify: `src/routes/_auth/index.tsx`

**Interfaces:**
- Consumes: Task 6 的 `useDashboardTrend()`、`useRecentEvents()`、`DashboardTrend`、`RecentEvent`；`recharts`（`Bar`/`BarChart`/`CartesianGrid`/`Line`/`LineChart`/`ResponsiveContainer`/`Tooltip`/`XAxis`/`YAxis`）。
- Produces: `<TrendCharts />`、`<RecentActivityTable />`，接入 `/` 路由，与已有 `<StatCards />` 并列（不替换）。

- [ ] **Step 1: 创建 `src/features/dashboard/TrendCharts.tsx`**

```tsx
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardTrend } from "./useDashboardTrend";

export function TrendCharts() {
  const { trend, isLoading } = useDashboardTrend();

  if (isLoading || !trend) {
    return (
      <Grid columns={{ minWidth: 320, repeat: "fit" }} gap={4}>
        <Skeleton height={280} />
        <Skeleton height={280} />
      </Grid>
    );
  }

  return (
    <Grid columns={{ minWidth: 320, repeat: "fit" }} gap={4}>
      <Card padding={4}>
        <Text type="large">营收趋势（近 12 个月）</Text>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend.revenue} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={60} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" name="营收" stroke="#0171E3" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card padding={4}>
        <Text type="large">活跃用户（近 30 天）</Text>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={trend.activeUsers} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 12 }} width={50} />
            <Tooltip />
            <Bar dataKey="count" name="活跃用户数" fill="#6B1EFD" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Grid>
  );
}
```

- [ ] **Step 2: 创建 `src/features/dashboard/RecentActivityTable.tsx`**

```tsx
import { Card } from "@astryxdesign/core/Card";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { useRecentEvents } from "./useRecentEvents";
import type { RecentEvent } from "./types";

type EventRow = RecentEvent & Record<string, unknown>;

export function RecentActivityTable() {
  const { events, isLoading } = useRecentEvents();

  return (
    <Card padding={4}>
      <Stack direction="vertical" gap={3}>
        <Text type="large">最近活动</Text>
        {isLoading ? (
          <Stack direction="vertical" gap={2}>
            <Skeleton height={32} />
            <Skeleton height={32} />
            <Skeleton height={32} />
          </Stack>
        ) : events.length === 0 ? (
          <EmptyState title="暂无活动记录" description="团队成员操作后会显示在这里" />
        ) : (
          <Table<EventRow>
            data={events as EventRow[]}
            idKey="id"
            columns={[
              { key: "actor", header: "操作人" },
              { key: "action", header: "动作" },
              { key: "target", header: "对象" },
              {
                key: "createdAt",
                header: "时间",
                renderCell: (event) => <Timestamp value={event.createdAt} format="relative" />,
              },
            ]}
          />
        )}
      </Stack>
    </Card>
  );
}
```

- [ ] **Step 3: 修改 `src/routes/_auth/index.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { RecentActivityTable } from "../../features/dashboard/RecentActivityTable";
import { StatCards } from "../../features/dashboard/StatCards";
import { TrendCharts } from "../../features/dashboard/TrendCharts";

export const Route = createFileRoute("/_auth/")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">仪表盘</Text>
      <StatCards />
      <TrendCharts />
      <RecentActivityTable />
    </Stack>
  ),
});
```

- [ ] **Step 4: 类型检查 + 手工验证**

```bash
pnpm exec tsc --noEmit
pnpm exec vp dev
```

手工验证清单：访问 `/`，确认原有 4 个 KPI 卡保持不变、下方新增营收折线图和活跃用户柱状图正常渲染（含 tooltip）、"最近活动"表格显示 8 条记录且时间是相对格式（如"3 小时前"）。

- [ ] **Step 5: 全量回归 + 生产构建验证 + 提交**

```bash
pnpm exec vp test run
pnpm exec vp build
git add src/features/dashboard src/routes/_auth/index.tsx
git commit -m "feat: Dashboard 增加营收/活跃用户趋势图和最近活动表格"
```

---

## 自查（Self-Review）记录

- **Spec 覆盖**：Task 1 对应 spec 的"mocks 目录拆分方案"；Task 2-3 对应"Tasks 看板"（含 Kanban 选型决策）；Task 4-5 对应"Apps 集成市场"；Task 6-7 对应"Dashboard v2"的增量图表设计。Phase 2（Settings/Auth/Errors）不在本计划范围内，将在这三个板块完成并验收后另起一份计划。
- **占位符扫描**：全部步骤含完整可粘贴代码，无 TBD/TODO/"类似 Task N"之类的省略。
- **类型一致性**：`Task`（`id/title/status/priority/assigneeId/labels/createdAt`）在 Task 2 定义后，Task 3 的 `TaskCard`/`TaskFormDialog`/`TaskBoard` 全部按此签名使用；`Integration` 同理贯穿 Task 4-5；`DashboardTrend`/`RecentEvent` 贯穿 Task 6-7。mock 层类型（`MockTask`/`MockIntegration`）与 feature 层类型（`Task`/`Integration`）刻意分离，与现有 `MockUser`/`User` 的既有模式一致。

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-08-business-case-showcase-phase1.md`. Two execution options:

1. **Subagent-Driven（推荐）** — 每个任务派一个新 subagent 去做，任务间人工审查，迭代快
2. **Inline Execution** — 在当前 session 里按 executing-plans 批量执行，设检查点

Which approach?
