# shadcn-admin 风格布局优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 参照 shadcn-admin 的分组+嵌套侧边栏与面包屑模式，优化 astryx-admin 现有的 `AdminShell` 布局，接入 `lucide-react` 图标库，新增"系统设置"嵌套子菜单（个人资料/外观两个真实页面）。

**Architecture:** 侧边栏从平铺 2 项改为 `SideNavSection` 分组 + 一个不带 `href` 的可展开父项（系统设置），子项指向两个新路由。顶部导航新增基于 pathname 静态映射的面包屑组件。全部改动都在 Astryx 组件之上完成，不引入自定义 div/css。

**Tech Stack:** React 19 + TypeScript strict、`@astryxdesign/core`（SideNav/SideNavSection/Breadcrumbs/Card/Stack/Text/Button/Avatar）、`lucide-react`、TanStack Router 文件式路由、Vitest。

## Global Constraints

- 所有命令前必须先 `export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"`（Node ≥22.13，机器默认 shell 是 v16）。
- 只用 pnpm + vite-plus 统一命令：`pnpm dev/build/test/lint/fmt`（`vp` 包装），不引入 ESLint/Prettier/Jest。
- UI 一律优先用 `@astryxdesign/core` 组件，不写自定义 div+CSS。
- 图标库用 `lucide-react`（与 Astryx 的 `icon: ComponentType<SVGProps>` 类型原生兼容），只在 Task 3 首次使用时安装。
- lucide 图标只有单一风格，`icon` 与 `selectedIcon` 传同一个组件，不额外造 filled 图标集。
- `AuthUser`（`src/stores/auth.ts`）当前字段是 `{ id, name, email }`，**没有 role 字段**——个人资料卡片展示 name + email，不虚构角色 Badge（这是对设计文档的一处小修正，已在此计划中记录）。
- 面包屑不支持"顶层无父级页面"（仪表盘 `/`）——按 Astryx 最佳实践不显示。
- 不引入 CommandPalette，不新增 Settings 的其它子项，不做"当前路由自动展开父级菜单"的逻辑。
- 沿用本项目已有惯例：纯 UI 组合类任务（页面、卡片、导航结构）用 `tsc --noEmit` + `pnpm build` + 手动走查验证，不为其引入 React Testing Library；只有含真实逻辑分支的纯函数（如面包屑路径映射）写 Vitest 单测。
- 提交信息格式 `<type>: <description>`（feat/fix/refactor/docs/test/chore），不追加 Co-Authored-By（本仓库历史提交无此行）。

---

### Task 1: 新增"系统设置"子页面（个人资料 / 外观）

**Files:**
- Create: `src/features/settings/ProfileCard.tsx`
- Create: `src/features/settings/AppearanceCard.tsx`
- Create: `src/routes/_auth/settings/profile.tsx`
- Create: `src/routes/_auth/settings/appearance.tsx`

**Interfaces:**
- Consumes: `useAuthStore` from `src/stores/auth.ts` — `user: AuthUser | null`（`AuthUser = { id: string; name: string; email: string }`）、`logout: () => void`。
- Consumes: `ThemeModeControl` named export from `src/components/layout/ThemeModeControl.tsx`（无 props）。
- Produces: `ProfileCard`（named export，无 props）、`AppearanceCard`（named export，无 props），供 Task 3 的 SideNav 链接指向的路由 `/settings/profile`、`/settings/appearance` 使用。

- [ ] **Step 1: 编写 ProfileCard 组件**

```tsx
// src/features/settings/ProfileCard.tsx
import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth";

export function ProfileCard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <Card padding={6} width={420}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="horizontal" gap={3}>
          <Avatar name={user?.name ?? "?"} size="large" />
          <Stack direction="vertical" gap={1}>
            <Text type="large">{user?.name ?? "未登录"}</Text>
            <Text type="supporting" color="secondary">
              {user?.email ?? "-"}
            </Text>
          </Stack>
        </Stack>
        <Button label="退出登录" variant="secondary" clickAction={handleLogout} />
      </Stack>
    </Card>
  );
}
```

- [ ] **Step 2: 编写 AppearanceCard 组件**

```tsx
// src/features/settings/AppearanceCard.tsx
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { ThemeModeControl } from "../../components/layout/ThemeModeControl";

export function AppearanceCard() {
  return (
    <Card padding={6} width={420}>
      <Stack direction="vertical" gap={4}>
        <Stack direction="vertical" gap={1}>
          <Text type="large">外观</Text>
          <Text type="supporting" color="secondary">
            调整界面的主题模式
          </Text>
        </Stack>
        <ThemeModeControl />
      </Stack>
    </Card>
  );
}
```

- [ ] **Step 3: 新增两个路由文件**

```tsx
// src/routes/_auth/settings/profile.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { ProfileCard } from "../../../features/settings/ProfileCard";

export const Route = createFileRoute("/_auth/settings/profile")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">个人资料</Text>
      <ProfileCard />
    </Stack>
  ),
});
```

```tsx
// src/routes/_auth/settings/appearance.tsx
import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { AppearanceCard } from "../../../features/settings/AppearanceCard";

export const Route = createFileRoute("/_auth/settings/appearance")({
  component: () => (
    <Stack direction="vertical" gap={4}>
      <Text type="display-3">外观设置</Text>
      <AppearanceCard />
    </Stack>
  ),
});
```

- [ ] **Step 4: 构建以生成路由树并做类型检查**

Run:
```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
pnpm build
```
Expected: 构建成功，`src/routeTree.gen.ts` 中新增 `/_auth/settings/profile`、`/_auth/settings/appearance` 两条路由记录（该文件已在 `.gitignore`，无需手动查看/提交）。

- [ ] **Step 5: 手动走查**

Run:
```bash
pnpm dev
```
用浏览器直接访问 `http://localhost:5173/settings/profile` 和 `http://localhost:5173/settings/appearance`（此时侧边栏还没有入口，靠直接输入 URL 验证）。预期：两页均渲染成功，个人资料页显示登录用户名+邮箱+退出登录按钮，外观页显示主题切换控件且点击可切换主题。确认后停止 dev server。

- [ ] **Step 6: 提交**

```bash
git add src/features/settings/ProfileCard.tsx src/features/settings/AppearanceCard.tsx src/routes/_auth/settings/profile.tsx src/routes/_auth/settings/appearance.tsx
git commit -m "feat: 新增系统设置子页面（个人资料/外观）"
```

---

### Task 2: 面包屑路径映射（PageBreadcrumbs）

**Files:**
- Create: `src/components/layout/PageBreadcrumbs.tsx`
- Test: `src/components/layout/PageBreadcrumbs.test.ts`

**Interfaces:**
- Consumes: 无外部依赖（纯路径字符串输入）。
- Produces: `getBreadcrumbLabels(pathname: string): string[]`（named export，供测试和组件内部使用）、`PageBreadcrumbs`（named export，props `{ pathname: string }`，返回 `ReactNode`），供 Task 3 的 `AdminShell.tsx` 在 `TopNav` 的 `startContent` 中使用。

- [ ] **Step 1: 编写失败的测试**

```ts
// src/components/layout/PageBreadcrumbs.test.ts
import { describe, expect, it } from "vitest";
import { getBreadcrumbLabels } from "./PageBreadcrumbs";

describe("getBreadcrumbLabels", () => {
  it("returns an empty array for the dashboard root route", () => {
    expect(getBreadcrumbLabels("/")).toEqual([]);
  });

  it("returns a single label for a top-level route", () => {
    expect(getBreadcrumbLabels("/users")).toEqual(["用户管理"]);
  });

  it("returns a two-level trail for nested settings routes", () => {
    expect(getBreadcrumbLabels("/settings/appearance")).toEqual(["系统设置", "外观"]);
    expect(getBreadcrumbLabels("/settings/profile")).toEqual(["系统设置", "个人资料"]);
  });

  it("falls back to an empty array for unknown routes", () => {
    expect(getBreadcrumbLabels("/unknown")).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
pnpm test src/components/layout/PageBreadcrumbs.test.ts
```
Expected: FAIL（`PageBreadcrumbs.tsx` 不存在 / `getBreadcrumbLabels` 未定义）。

- [ ] **Step 3: 实现 PageBreadcrumbs**

```tsx
// src/components/layout/PageBreadcrumbs.tsx
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";

const BREADCRUMB_LABELS: Record<string, string[]> = {
  "/users": ["用户管理"],
  "/settings/profile": ["系统设置", "个人资料"],
  "/settings/appearance": ["系统设置", "外观"],
};

export function getBreadcrumbLabels(pathname: string): string[] {
  return BREADCRUMB_LABELS[pathname] ?? [];
}

export function PageBreadcrumbs({ pathname }: { pathname: string }) {
  const labels = getBreadcrumbLabels(pathname);
  if (labels.length === 0) {
    return null;
  }

  return (
    <Breadcrumbs variant="supporting">
      {labels.map((label, index) => (
        <BreadcrumbItem key={label} isCurrent={index === labels.length - 1}>
          {label}
        </BreadcrumbItem>
      ))}
    </Breadcrumbs>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
pnpm test src/components/layout/PageBreadcrumbs.test.ts
```
Expected: PASS（4 个用例全部通过）。

- [ ] **Step 5: 提交**

```bash
git add src/components/layout/PageBreadcrumbs.tsx src/components/layout/PageBreadcrumbs.test.ts
git commit -m "test: 面包屑路径映射（PageBreadcrumbs）"
```

---

### Task 3: 侧边栏分组 + 嵌套子菜单 + lucide 图标 + 接入面包屑

**Files:**
- Modify: `package.json`（新增依赖 `lucide-react`）
- Modify: `src/components/layout/AdminShell.tsx`（完整重写）

**Interfaces:**
- Consumes: `ProfileCard`/`AppearanceCard` 路由已存在（Task 1：`/settings/profile`、`/settings/appearance`）；`PageBreadcrumbs`（Task 2，props `{ pathname: string }`）；`ThemeModeControl`、`UserMenu`（已有，无改动）；`useUiStore` 的 `isSideNavCollapsed`/`setSideNavCollapsed`（已有，无改动）。
- Produces: 无新导出——`AdminShell` 的 `children: ReactNode` 签名不变，`_auth.tsx` 无需改动。

- [ ] **Step 1: 安装 lucide-react**

```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
pnpm add lucide-react
```
Expected: `package.json` 的 `dependencies` 新增 `"lucide-react": "^1.23.0"`（或 pnpm 解析到的实际最新版本号），`pnpm-lock.yaml` 更新。

- [ ] **Step 2: 重写 AdminShell.tsx**

```tsx
// src/components/layout/AdminShell.tsx
import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { Stack } from "@astryxdesign/core/Stack";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Palette, Settings, UserCircle, Users } from "lucide-react";
import { useUiStore } from "../../stores/ui";
import { PageBreadcrumbs } from "./PageBreadcrumbs";
import { ThemeModeControl } from "./ThemeModeControl";
import { UserMenu } from "./UserMenu";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isSideNavCollapsed = useUiStore((state) => state.isSideNavCollapsed);
  const setSideNavCollapsed = useUiStore((state) => state.setSideNavCollapsed);

  return (
    <AppShell
      contentPadding={4}
      topNav={
        <TopNav
          heading={<TopNavHeading heading="Astryx Admin" headingHref="/" />}
          startContent={<PageBreadcrumbs pathname={pathname} />}
          endContent={
            <Stack direction="horizontal" gap={3}>
              <ThemeModeControl />
              <UserMenu />
            </Stack>
          }
        />
      }
      sideNav={
        <SideNav
          collapsible={{
            isCollapsed: isSideNavCollapsed,
            onCollapsedChange: setSideNavCollapsed,
          }}
        >
          <SideNavSection title="概览">
            <SideNavItem
              label="仪表盘"
              href="/"
              icon={LayoutDashboard}
              selectedIcon={LayoutDashboard}
              isSelected={pathname === "/"}
            />
          </SideNavSection>
          <SideNavSection title="管理">
            <SideNavItem
              label="用户管理"
              href="/users"
              icon={Users}
              selectedIcon={Users}
              isSelected={pathname === "/users"}
            />
            <SideNavItem
              label="系统设置"
              icon={Settings}
              selectedIcon={Settings}
              collapsible={{ defaultIsCollapsed: false }}
            >
              <SideNavItem
                label="个人资料"
                href="/settings/profile"
                icon={UserCircle}
                selectedIcon={UserCircle}
                isSelected={pathname === "/settings/profile"}
              />
              <SideNavItem
                label="外观"
                href="/settings/appearance"
                icon={Palette}
                selectedIcon={Palette}
                isSelected={pathname === "/settings/appearance"}
              />
            </SideNavItem>
          </SideNavSection>
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 3: 类型检查**

Run:
```bash
pnpm exec tsc --noEmit
```
Expected: 无报错。若 `lucide-react` 某个图标名报 "has no exported member"，用 `grep -o 'export declare const [A-Za-z]*' node_modules/lucide-react/dist/lucide-react.d.ts | grep -iE "dashboard|users|settings|circle|palette"` 找到实际导出名并替换。

- [ ] **Step 4: 构建**

Run:
```bash
pnpm build
```
Expected: 构建成功。

- [ ] **Step 5: 手动走查**

Run:
```bash
pnpm dev
```
浏览器打开 `http://localhost:5173`，登录后确认：
1. 侧边栏显示"概览"/"管理"两个分组标题，每项都有图标。
2. "系统设置"默认展开，点击可收起/展开其下"个人资料"/"外观"两个子项。
3. 点击"个人资料"/"外观"能正确导航，顶部出现"系统设置 / 个人资料"或"系统设置 / 外观"面包屑。
4. 访问仪表盘 `/` 和用户管理 `/users` 时，仪表盘顶部无面包屑，用户管理顶部显示"用户管理"面包屑。
5. 侧边栏折叠按钮仍正常工作。

确认后停止 dev server。

- [ ] **Step 6: 提交**

```bash
git add package.json pnpm-lock.yaml src/components/layout/AdminShell.tsx
git commit -m "feat: 侧边栏分组+嵌套子菜单+lucide 图标+接入面包屑"
```

---

### Task 4: 全量验证与文档更新

**Files:**
- Modify: `README.md`（目录结构、约定、已知工程决策三处补充新增内容）

**Interfaces:**
- Consumes: 无新接口，纯文档 + 全仓库验证。
- Produces: 无。

- [ ] **Step 1: 更新 README 目录结构说明**

在 `README.md` 的目录结构代码块中，把：
```text
├─ features/            # 按业务域组织
│  ├─ auth/             # 登录表单 + api
│  ├─ dashboard/        # 统计卡片 + hook
│  └─ users/            # 类型 / api / useUsers / 表格 / 表单弹窗
├─ components/layout/   # AdminShell（AppShell+SideNav+TopNav）、主题切换、用户菜单
```
替换为：
```text
├─ features/            # 按业务域组织
│  ├─ auth/             # 登录表单 + api
│  ├─ dashboard/        # 统计卡片 + hook
│  ├─ users/            # 类型 / api / useUsers / 表格 / 表单弹窗
│  └─ settings/         # 个人资料卡片、外观设置卡片
├─ components/layout/   # AdminShell（分组+嵌套 SideNav+TopNav+面包屑）、主题切换、用户菜单、面包屑映射
```

- [ ] **Step 2: 更新 README 约定与已知工程决策**

在"约定"小节末尾追加一行：
```markdown
- 侧边栏图标统一用 `lucide-react`（与 Astryx 的 `icon: ComponentType<SVGProps>` 原生兼容，不用 iconify 是为了省掉一层适配器）
```

在"已知工程决策"小节末尾追加一行：
```markdown
- 面包屑用 pathname 静态映射表（`PageBreadcrumbs.tsx`）而非通用路径解析器：路由总数少，写通用解析器是过度设计
```

- [ ] **Step 3: 全量验证**

Run:
```bash
export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"
pnpm fmt
pnpm lint
pnpm test
pnpm build
pnpm exec tsc --noEmit
```
Expected: 五条命令全部成功退出（`fmt` 可能重新格式化文件，需要 `git status` 确认改动在预期范围内——只应涉及本次新增/修改的文件）。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "docs: 更新 README 反映侧边栏与设置页改动"
```
