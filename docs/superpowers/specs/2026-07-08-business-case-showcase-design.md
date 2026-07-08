# 业务案例化 Astryx 组件展示设计

日期：2026-07-08
状态：待确认

## 目标

参照 [shadcn-admin](https://shadcn-admin.netlify.app) 的板块划分，把 astryx-admin 从"仪表盘+用户管理"的骨架，扩展成覆盖 Dashboard 图表、Tasks、Apps、Settings 补全、Auth 补全、Errors 六大板块的业务案例演示站，用尽量多样的 astryx 组件覆盖真实业务场景。业务定位统一为**通用 SaaS 内部运营控制台**（沿用现有"用户管理"设定）。

沿用现状约定：TanStack Router 文件路由（`src/routes/_auth/...`）、feature 目录（`types.ts`+`api.ts`+`useX.ts`+组件）、swr+ky、MSW mock、中文文案、`AlertDialog`/`Dialog`+`Toast` 的增删改交互模式。

## 实施节奏

一次性完成本设计，分两批实施，每批各自走完整流程（写代码→自测→提交）：

- **第一批**：Dashboard 图表升级、Tasks 看板、Apps 集成市场
- **第二批**：Settings 补全（通知/账户）、Auth 补全（注册/忘记密码/OTP）、Errors 错误页

## 导航结构（在现有基础上扩展）

```
概览 (SideNavSection)
  仪表盘                    /
工作 (SideNavSection，新增)
  任务看板                  /tasks
  应用集成                  /apps
管理 (SideNavSection)
  用户管理                  /users
系统设置 (嵌套，扩展)
  个人资料                  /settings/profile
  外观                      /settings/appearance
  通知 (新增)               /settings/notifications
  账户 (新增)               /settings/account
错误页示例 (SideNavSection，新增，演示用途)
  401 未授权                /errors/401
  403 无权限                /errors/403
  404 未找到                /errors/404
  500 服务器错误            /errors/500
```

Auth 相关页面（`/register`、`/forgot-password`、`/verify-otp`）与现有 `/login` 一样，不进 `AdminShell`，走独立的极简布局。

404 同时接入 TanStack Router 的 `notFoundComponent`，是应用的真实兜底行为；401/403/500 在这个 mock 应用里没有自然触发路径，作为可从侧边栏直接访问的演示页面存在（这点和 shadcn-admin 自己在侧边栏暴露 Errors 分组的做法一致）。

## 新依赖：recharts

astryx `dashboard` 模板的图表（`BarChart`/`LineChart`/`CartesianGrid`/`XAxis`/`YAxis`/`ResponsiveContainer`）是直接从 `recharts` 导入的原生组件，不是 `@astryxdesign/core` 的封装。需要：

- `package.json` 新增 `recharts` 依赖
- 把模板自带的 `@heroicons/react` 图标替换成项目已用的 `lucide-react`，保持图标库统一

## 数据模型

### Tasks

```ts
type TaskStatus = "backlog" | "in-progress" | "in-review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface MockTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string; // 关联 MockUser.id
  labels: string[];
  createdAt: string;
}
```

`createSeedTasks(count = 32)`：跨 4 个状态、4 个优先级、现有种子用户均匀分布生成。

### Apps（固定精选目录，非随机生成）

```ts
type AppCategory = "沟通协作" | "开发工具" | "支付" | "自动化" | "数据分析";

interface MockIntegration {
  id: string;
  name: string;
  description: string;
  category: AppCategory;
  icon: string; // lucide-react 图标组件名
  isConnected: boolean;
}
```

`createSeedIntegrations()`：约 10-12 个真实可辨识的 SaaS 工具（如 Slack、GitHub、Notion、Figma、Stripe、Zapier、Linear、Google Drive 等命名风格，非真实商标细节复刻，仅借用品类认知）。

### Dashboard v2（新增接口，不替换现有 `/api/dashboard/stats`）

```ts
interface RevenueTrendPoint { month: string; revenue: number; }
interface ActiveUsersPoint { date: string; count: number; }
interface RecentEvent { id: string; actor: string; action: string; target: string; createdAt: string; }
```

新增 `GET /api/dashboard/trend`（近 12 个月营收 + 近 30 天活跃）、`GET /api/dashboard/events`（最近活动列表）。

### mocks 目录拆分

`data.ts`/`handlers.ts` 单文件会因为新增 4 个业务域而变得臃肿，按域拆分：

```
mocks/
  data/
    index.ts       # 重新导出
    users.ts       # 现有 createSeedUsers 迁入
    tasks.ts
    apps.ts
    dashboard.ts
  handlers/
    index.ts       # 汇总数组
    users.ts       # 现有用户 CRUD handler 迁入
    tasks.ts
    apps.ts
    dashboard.ts
    auth.ts        # 现有登录 + 新增注册/忘记密码/OTP mock
```

## 页面级设计

### Tasks 看板 `/tasks`

**方案：Kanban 看板**（而非数据表格）。理由：Users 页已经用 `Table`+`Toolbar`+`TextInput` 展示过表格模式，Tasks 改用 astryx `kanban-board` 模板的 `Board`/`BoardColumn`/`BoardCard` 拖拽看板，能覆盖表格覆盖不到的组件族，视觉上也和 Users 形成差异化。

- 4 列对应 4 个 `TaskStatus`，拖拽卡片跨列 = 改状态（乐观更新 + 失败回滚，遵循现有 `notifyError` 模式）
- 卡片：标题、`Badge`（优先级颜色映射，仿 `UserTable` 的 `ROLE_BADGE` 写法）、`Avatar`（负责人）、标签
- 卡片右上 `MoreMenu`：编辑/删除
- 新建/编辑走 `Dialog` 表单（复用 `UserFormDialog` 的受控表单模式），删除走 `AlertDialog`（复用 `UserTable` 的删除确认模式）

### Apps 集成市场 `/apps`

无现成页面模板，组合：`Grid`（响应式卡片网格）+ `SelectableCard`（点击切换已连接/未连接状态）+ `Badge`（分类标签）+ `TabList` 或 `SegmentedControl`（按分类筛选）+ `EmptyState`（筛选无结果）。连接/断开走乐观更新 + `Toast` 反馈，不弹确认对话框（非破坏性操作）。

### Dashboard v2 `/`

**增量式增强，不替换现有 `StatCards`**：

1. 保留现有 `StatCards`（4 个 KPI 卡）
2. 新增图表行：`LineChart`（近 12 个月营收趋势）+ `BarChart`（近 30 天活跃用户），每个包在 astryx `Card` 里，来自 `recharts`
3. 新增"最近活动" `Table`：动作人、动作、对象、时间（`Timestamp`）

### Settings 补全

- **通知** `/settings/notifications`：`NotificationsCard`，`Card` 内一组 `Switch`（邮件通知/产品更新/安全告警等），结构仿 `AppearanceCard`
- **账户** `/settings/account`：`AccountCard`，危险区：`destructive` variant 的 `Button` + `AlertDialog` 二次确认的"删除账户"mock 操作（仅前端状态，不真的登出）

### Auth 补全

- **注册** `/register`：改编 `login-split` 模板（表单 + 封面图分栏），字段：姓名/邮箱/密码/确认密码
- **忘记密码** `/forgot-password`：复用 `LoginForm` 的卡片结构，仅邮箱字段 + 提交后的成功态提示（`Banner` 或 `EmptyState` "邮件已发送"）
- **验证码 OTP** `/verify-otp`：6 位输入，具体用 `TextInput` 序列还是其它输入组件，实现阶段先跑 `astryx search "otp" / "pin code"` 确认有没有专用组件，没有就退化成分段 `TextInput`

### Errors 错误页

`401`/`403`/`404`/`500` 四个路由，统一结构：无 `SideNav`/`TopNav` 的极简壳（`AppShellContentOnly` 或直接 `Center`）+ `EmptyState`（状态码标题 + 说明文案 + "返回首页" `Button`）。404 额外接入路由器的 `notFoundComponent`。

## 文件改动清单

```
src/features/tasks/          types.ts, api.ts, useTasks.ts, TaskBoard.tsx, TaskCard.tsx, TaskFormDialog.tsx
src/features/apps/           types.ts, api.ts, useIntegrations.ts, AppsGrid.tsx
src/features/dashboard/      TrendCharts.tsx, RecentActivityTable.tsx, useDashboardTrend.ts, useDashboardEvents.ts（StatCards.tsx 保留不动）
src/features/settings/       NotificationsCard.tsx, AccountCard.tsx
src/features/auth/           RegisterForm.tsx, ForgotPasswordForm.tsx, OtpForm.tsx（LoginForm.tsx 保留不动）
src/routes/_auth/            tasks.tsx, apps.tsx, settings/notifications.tsx, settings/account.tsx
src/routes/                  register.tsx, forgot-password.tsx, verify-otp.tsx, errors/401.tsx, errors/403.tsx, errors/500.tsx, errors/404.tsx
src/mocks/data/              index.ts, users.ts, tasks.ts, apps.ts, dashboard.ts（原 data.ts 拆分）
src/mocks/handlers/          index.ts, users.ts, tasks.ts, apps.ts, dashboard.ts, auth.ts（原 handlers.ts 拆分）
src/components/layout/       AdminShell.tsx（导航扩展）
package.json                 新增 recharts
```

## 测试

沿用现有仓库模式：只对纯逻辑写 co-located `*.test.ts`（如 `tasks/api.test.ts` 仿 `users/api.test.ts`，`useDashboardTrend` 的数据整形逻辑如果有的话）。不引入 Playwright/E2E——仓库目前没有 E2E 基建，不顺手夹带新的重量级依赖。Vitest（`vp test`）保持唯一测试运行器。

## 不做的事

- Chats 会话页（用户已明确排除，本轮不做）
- Tasks 不做表格视图/看板视图切换，只做看板一种呈现
- Apps 集成的"连接"不做真实 OAuth 流程，纯前端 mock 状态切换
- Errors 页不做"真实触发条件"（比如真的用中间件返回 401），只做可直接访问的静态演示页
- 不追求这批新增页面的测试覆盖率数字达标，遵循现状（骨架/演示阶段以类型检查+构建+手工走查为主要验证手段）
