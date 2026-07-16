# 任务看板重构为表格视图 — 设计

## 背景

现有 `/tasks` 页面是拖拽式 4 列 Kanban（待办/进行中/评审中/已完成），用户希望参照 [shadcn-admin Tasks 页](https://shadcn-admin.netlify.app/tasks) 重构为数据表格视图：筛选、排序、分页、多选批量操作、右侧抽屉式新建/编辑表单。

## 范围

`src/features/tasks/` 全量重构为表格视图，完全替换 Kanban（不保留拖拽看板）。路由 `/tasks`、侧边栏导航文案（"任务看板" / "Task Board"）不变——导航命名与页面内容形态无关，shadcn-admin 自身导航项也叫 "Tasks" 但内容是表格。

不引入新的任务状态（如 shadcn 演示中的 "Canceled"）：沿用现有 4 态 `TaskStatus`（backlog / in-progress / in-review / done）与 4 级 `TaskPriority`（low / medium / high / urgent），只重做视图形态，不做数据模型无谓扩张。

## 组件结构

### `TaskTable.tsx`（替换 `TaskBoard.tsx`）

页面主组件，结构自上而下：

1. **页头 Toolbar**：标题 + 副标题（`Text type="display-3"` + supporting），`endContent` 为"新建任务" `Button variant="primary"`。不加 "Import" 按钮——当前没有导入功能，避免做装饰性假操作。
2. **筛选 Toolbar**：`startContent` 为搜索 `TextInput`（按标题/ID 过滤）+ 状态 `MultiSelector` + 优先级 `MultiSelector`；`endContent` 默认放列可见性入口（`useTableColumnSettings` 驱动的 `MoreMenu` 或类似触发器），当 `selectedKeys.size > 0` 时替换为"批量删除（N）" `Button variant="destructive"`——直接复用 `UserTable.tsx` 中已验证的选中态切换模式，不做悬浮定位（astryx 无现成的浮动工具栏原语，避免臆造定位方案）。
3. **`Table<TaskRow>`**：启用 `useTableSelection`（勾选列）、`useTableSortable`（排序）插件；数据来自服务端分页/筛选结果。
4. **`Pagination`**：`variant="pages"`，`pageSizeOptions={[10, 20, 30, 40, 50]}` + `onPageSizeChange`，对应参考图"每页行数"下拉。

### 表格列定义

| 列 | 内容 | 说明 |
|---|---|---|
| 勾选列 | `useTableSelection` 自动渲染 | 含全选 |
| Task | `TASK-${id.padStart(4, "0")}` | 可排序 |
| Title | `label` Badge（bug/feature/docs/chore）+ 标题文本 | 标题截断（`textOverflow="truncate"`），Badge 是枚举分类，符合"Badge 仅用于计数和枚举态"规则 |
| Status | `StatusDot` + 文字 | backlog=neutral, in-progress=accent, in-review=warning, done=success；可排序。遵循 CLAUDE.md 规则：状态用 StatusDot/Token，不用 Badge 做装饰 |
| Priority | lucide 箭头图标 + 文字 | low=ArrowDown, medium=ArrowRight, high/urgent=ArrowUp（urgent 用 error 色区分）；不用 Badge，与参考图风格一致；可排序 |
| Actions | `MoreMenu`（编辑/删除） | 沿用现有交互 |

### 表单：`TaskFormDialog.tsx`

保留现有表单字段与提交逻辑，仅调整 `Dialog` 的展示形态：

- `position` 定位到屏幕右侧、`maxHeight="100vh"`、`width` 约 420px，视觉上模拟右侧抽屉。
- 这是明确的折中方案：astryx 设计系统目前没有独立的 Drawer/Sheet 组件，已与用户确认接受此方案。

### 删除

- `TaskCard.tsx`：看板卡片，表格视图不再需要。
- `groupTasksByStatus.ts` 及其测试 `groupTasksByStatus.test.ts`：看板分组逻辑不再需要。其中的 `TASK_STATUSES` 常量迁移到 `types.ts`（或新建轻量 `constants.ts`），供筛选选项复用。

## 数据层

### `mocks/handlers/tasks.ts`

补齐服务端筛选与分页支持，逻辑对齐 `mocks/handlers/users.ts` 的既有模式：

- 查询参数：`page`、`pageSize`、`keyword`（匹配标题或格式化后的任务编号）、`status[]`（多选）、`priority[]`（多选）。
- 响应仍为 `PageResult<Task>` 信封（`{ items, total }`），`total` 为筛选后的总数。

### `api.ts` / `useTasks.ts`

- `fetchTasks` 接受 `{ page, pageSize, keyword, statuses, priorities }` 参数并拼接 query string，写法对齐 `useUsers.ts` / `users/api.ts` 现有实现。
- `useTasks(params)` 依赖参数变化重新请求（SWR key 包含序列化后的参数）。

### i18n

新增 `tasks.label.*`（bug/feature/docs/chore 的中英文标签），新增列标题（`tasks.columns.task/title/status/priority/actions`）、筛选/分页相关文案，命名风格对齐 `users` 模块现有 key 结构。

## 测试

- `api.test.ts`：补充新查询参数的请求断言（沿用现有测试风格，不新增测试框架）。
- 不新增表格交互 E2E：`UserTable.tsx` 作为同类既有表格页面目前也没有专门的交互测试，保持项目现有覆盖水平一致，不在本次重构中单独拔高标准。

## 风险与边界

- Dialog 定位模拟抽屉可能在极窄视口下与 AppShell 布局有间隙/遮挡问题，需要在浏览器中实测 375/768/1440 断点下的表现。
- 批量删除通过 `Promise.all` 并发调用现有单条 `deleteTask`，沿用 `UserTable.tsx` 的 `handleBulkDelete` 实现模式，不引入新的批量删除 API。
