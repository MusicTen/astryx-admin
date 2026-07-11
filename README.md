# Astryx Admin

[English](./README.en.md) | 中文

基于最新前端技术栈的 admin 管理端项目骨架，内置中英双语与明暗主题。

## 功能

- **登录**：表单校验 + token 持久化，路由守卫拦截未登录访问
- **仪表盘**：统计卡片、营收趋势图、最近销售列表
- **任务看板**：按状态分列的看板，任务增删改与状态流转
- **用户管理**：搜索/筛选、分页、单个与批量删除、新增/编辑弹窗的完整 CRUD 示例
- **应用集成**：按分类筛选的集成应用陈列页
- **系统设置**：个人资料、外观设置（主题模式 + 语言）
- **国际化**：中英双语，首次访问按浏览器语言检测，切换后持久化；顶栏图标一键切换
- **主题**：亮色 / 暗色 / 跟随系统三态，顶栏图标切换

## 技术栈

| 层         | 选型                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| 包管理     | pnpm（Node ≥ 22.13，见 `.nvmrc`）                                                                            |
| 工具链     | [vite-plus](https://www.npmjs.com/package/vite-plus)（`vp` 统一命令：Vite 8 + Vitest 4 + Oxlint + Oxfmt）    |
| 框架       | React 19 + TypeScript strict                                                                                 |
| UI         | [@astryxdesign/core](https://www.npmjs.com/package/@astryxdesign/core)（StyleX）+ neutral 主题，内置明暗模式 |
| 路由       | TanStack Router（文件式路由，类型安全）                                                                      |
| 国际化     | i18next + react-i18next（`src/i18n/`，中英文案资源；语言状态存 ui store 并持久化）                           |
| HTTP       | ky（`src/lib/http.ts` 统一封装：token 注入 / 401 处理 / ApiError 归一化）                                    |
| 服务端状态 | SWR（全局 fetcher 走 ky）                                                                                    |
| 客户端状态 | zustand + immer（`src/stores/`，persist 持久化）                                                             |
| Mock       | MSW（开发环境自动开启）                                                                                      |

## 快速开始

```bash
nvm use            # Node 22
pnpm install
pnpm dev           # http://localhost:5173
```

登录页演示账号：**任意用户名 / admin123**（由 MSW mock 提供）。

## 常用命令

```bash
pnpm dev       # 开发服务器
pnpm build     # 生产构建
pnpm preview   # 预览构建产物
pnpm test      # 运行 Vitest 单测
pnpm lint      # Oxlint 检查
pnpm fmt       # Oxfmt 格式化
```

Astryx 组件文档（写 UI 前先查 props）：

```bash
pnpm exec astryx component <Name> --dense --detail compact
pnpm exec astryx search <query>
```

## 目录结构

```text
src/
├─ app/                 # AppProviders（Theme/LinkProvider/SWR/i18n 初始化与同步）
├─ routes/              # TanStack Router 文件式路由
│  ├─ __root.tsx        # 根路由（挂 providers）
│  ├─ login.tsx         # 登录页
│  └─ _auth/            # 需登录的布局路由（守卫 + AppShell）
│     ├─ index.tsx      # 仪表盘
│     ├─ tasks.tsx      # 任务看板
│     ├─ apps.tsx       # 应用集成
│     ├─ users.tsx      # 用户管理（CRUD 示例）
│     └─ settings/      # 系统设置（profile / appearance）
├─ features/            # 按业务域组织
│  ├─ auth/             # 登录表单 + api
│  ├─ dashboard/        # 统计卡片 / 趋势图 / 最近销售 + hooks
│  ├─ tasks/            # 看板 / 任务卡片 / 表单弹窗 / 分组逻辑
│  ├─ apps/             # 集成应用陈列 + 分类筛选
│  ├─ users/            # 类型 / api / useUsers / 表格 / 表单弹窗
│  └─ settings/         # 个人资料卡片、外观设置卡片
├─ components/layout/   # AdminShell（分组+嵌套 SideNav+TopNav+面包屑）、语言/主题切换、用户菜单
├─ i18n/                # i18next 初始化、语言检测、locales/{zh,en}.json 文案资源
├─ theme/               # defineTheme 扩展 neutral 主题
├─ lib/                 # http.ts（ky）、swr.tsx（SWRConfig）
├─ stores/              # auth.ts、ui.ts（zustand+immer+persist：主题/语言/侧边栏）
└─ mocks/               # MSW（data/ 内存数据源 + handlers/ 按域拆分）
```

## 约定

- **UI 一律优先使用 Astryx 组件**（布局用 `Stack`/`Grid`/`Section`，文本用 `Text`），仅当无对应组件时才用 StyleX `xstyle` 自定义并注释原因
- **所有用户可见文案走 `t()`**：新增文案同时补 `locales/zh.json` 与 `locales/en.json`（key 结构保持一致，有单测校验）；业务数据值（如分类枚举）保持原值，仅在显示层翻译
- 服务端状态只用 SWR；客户端状态放 zustand store；不要互相复制
- 新增接口：`features/<domain>/api.ts` 定义请求函数 + `src/mocks/handlers/` 补 mock
- 新增页面：在 `src/routes/` 下建文件即可（构建时自动生成 `routeTree.gen.ts`）
- 侧边栏图标统一用 `lucide-react`（与 Astryx 的 `icon: ComponentType<SVGProps>` 原生兼容，不用 iconify 是为了省掉一层适配器）

## 已知工程决策

- `vite` 以 devDependency 显式安装：插件生态（router-plugin、plugin-react、vitest）peer 依赖它做类型与运行时解析；日常命令仍统一走 `vp`
- `vite.config.ts` 中对两个 Astryx CSS 子路径做了 alias：rolldown 对含 `types` 条件的 CSS exports 解析有误，直接指向 dist 实际文件
- msw 的 postinstall 通过 `pnpm-workspace.yaml` 的 `allowBuilds` 放行
- 面包屑用 pathname 静态映射表（`PageBreadcrumbs.tsx`）而非通用路径解析器：路由总数少，写通用解析器是过度设计
- 顶栏的语言/主题切换与设置页复用同一组件（`isIconOnly` 属性区分图标态与文字态），避免两处状态逻辑漂移
