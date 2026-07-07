# Astryx Admin 项目骨架设计

日期：2026-07-07
状态：待用户确认

## 目标

搭建一个可直接开发业务的 admin 管理端项目骨架，技术栈：

| 层         | 选型                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| 包管理     | pnpm（Node ≥ 22.13，写入 `.nvmrc` + `engines`）                                                                             |
| 工具链     | `vite-plus`（VoidZero 统一工具链：`vp dev/build/test/lint/fmt`，内置 Vitest、Oxlint、Oxfmt，不再引入 ESLint/Prettier/Jest） |
| 框架       | React 19 + TypeScript（strict）                                                                                             |
| UI         | `@astryxdesign/core`（StyleX）+ 官方主题包，经 `astryx init` 接入                                                           |
| 路由       | TanStack Router（文件式路由，类型安全）                                                                                     |
| HTTP       | ky（统一实例封装）                                                                                                          |
| 服务端状态 | SWR（不引入 TanStack Query，避免双缓存体系）                                                                                |
| 客户端状态 | zustand + immer middleware                                                                                                  |
| Mock       | MSW（Service Worker 拦截，开发环境默认开启）                                                                                |

## 核心约束：Astryx 组件优先

**UI 一律优先使用 `@astryxdesign/core` 现成组件，禁止无必要的自定义 `div` + CSS。**

- 页面布局：`AppShell` + `SideNav`/`SideNavItem` + `TopNav`，不手写侧边栏
- 间距排版：`Stack` / `Grid` / `Section` / `Center` / `Layout` 系列组件，不写 margin/padding 样式
- 文本：`Text` 组件，不裸写标签样式
- 仅当 Astryx 确无对应组件时才允许 StyleX 自定义样式，且需注释说明原因

## 页面与组件映射

| 页面              | 使用的 Astryx 组件                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 登录 `/login`     | `Center` + `Card` + `FormLayout` + `Field` + `TextInput` + `Button` + `Banner`（错误提示）                                |
| 布局壳            | `AppShell` + `SideNav`（含 `SideNavCollapseButton`）+ `TopNav`（含主题切换 `IconButton`、用户 `Avatar` + `DropdownMenu`） |
| 仪表盘 `/`        | `Grid` + `Card` + `Text` + `Badge` + `StatusDot`（统计卡片）                                                              |
| 用户管理 `/users` | `Toolbar` + `TextInput`(搜索) + `Table` 系列 + `Pagination` + `Skeleton`(加载) + `EmptyState`(空态)                       |
| 用户新建/编辑     | `Dialog` + `FormLayout` + `Field` + `TextInput` + `Selector` + `Switch`                                                   |
| 删除确认          | `AlertDialog`                                                                                                             |
| 操作反馈          | `Toast`                                                                                                                   |

## 目录结构

```text
src/
├─ app/                 # 入口、Theme/SWR providers、路由实例
├─ routes/              # TanStack Router 文件式路由
│  ├─ __root.tsx        # 根路由（providers 挂载点）
│  ├─ login.tsx
│  └─ _auth/            # 需登录的布局路由（AppShell + 守卫）
│     ├─ index.tsx      # 仪表盘
│     └─ users.tsx      # 用户管理
├─ features/
│  ├─ auth/             # 登录表单、useLogin、类型
│  ├─ dashboard/        # 统计卡片
│  └─ users/            # api.ts + hooks + 表格/表单组件
├─ components/          # 跨 feature 复用的组合组件（保持最少）
├─ lib/
│  ├─ http.ts           # ky 实例：baseUrl、token 注入、401 跳登录、错误归一化
│  └─ swr.ts            # 全局 SWRConfig：fetcher 走 ky、错误 Toast
├─ stores/
│  ├─ auth.ts           # zustand+immer+persist：token、用户信息
│  └─ ui.ts             # 主题模式、侧边栏折叠
└─ mocks/               # MSW handlers：登录 + 用户 CRUD
```

## 关键数据流

- **认证**：登录 → mock 返回 token → 存入 `stores/auth`（persist）→ ky beforeRequest 注入 `Authorization` → 路由 `_auth` 布局 `beforeLoad` 校验，未登录 redirect `/login`（携带 redirect 参数回跳）→ 任意接口 401 时清空 store 并跳登录。
- **列表 CRUD**：`useUsers(params)` 用 SWR key 携带分页/搜索参数；新建/编辑/删除成功后 `mutate` 失效列表 + Toast 反馈。
- **主题**：`stores/ui` 保存 light/dark/system → Astryx `Theme` 组件消费。

## 错误处理

- ky 层统一把 HTTP 错误归一化为 `ApiError`（含 code/message）
- SWR 全局 `onError` 弹 Toast（401 除外，走跳转逻辑）
- 路由层 `defaultErrorComponent` 用 `EmptyState` 展示兜底错误

## 测试

- Vitest（vp 内置）：`lib/http`、`stores/*`、users API hooks（配 MSW node 端）
- 组件示例测试 1-2 个，验证测试链路可用即可（骨架阶段不追求覆盖率）

## 实施顺序

1. 工程底座：pnpm init、vite-plus、TS 配置、vp 脚本、.nvmrc/.gitignore
2. `astryx init` 接入设计系统与主题
3. TanStack Router 文件式路由 + 基础页面壳
4. lib（ky/swr）+ stores（auth/ui）+ MSW mock
5. 登录 + 路由守卫
6. AppShell 布局 + 仪表盘
7. 用户 CRUD 示例页
8. 测试 + `vp build` 验证
