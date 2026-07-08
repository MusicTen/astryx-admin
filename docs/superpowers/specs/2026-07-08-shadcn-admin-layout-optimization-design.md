# shadcn-admin 风格布局优化设计

日期：2026-07-08
状态：已确认

## 目标

参照 [shadcn-admin](https://github.com/satnaing/shadcn-admin) 的布局与导航模式，优化 astryx-admin 现有的 `AdminShell` 侧边栏/顶部导航，并确定图标库选型。约束：项目已有 `@astryxdesign/core` 组件库，UI 优先用 Astryx 组件实现；shadcn-admin 是 Tailwind+shadcn 技术栈，只参考其布局结构/交互模式，不照搬组件代码。

## 图标库：lucide-react

Astryx `Icon` / `SideNavItem` 的 `icon`、`selectedIcon` 属性类型是 `ComponentType<SVGProps>`（或极少数内置语义名，仅覆盖 UI 图标如 chevron/close，不含业务图标）。`lucide-react` 导出的图标本身就是 SVGProps 兼容的 React 组件，可直接传入，无需适配层。`iconify`（`@iconify/react`）的 `Icon` 是接受 `icon` 字符串的包装组件，需额外写适配器才能塞进 Astryx 的 `icon` 属性，多一层封装成本。

因 lucide 图标只有单一风格（无 outline/filled 两套），`icon` 与 `selectedIcon` 传同一个组件，选中态视觉完全依赖 `SideNavItem` 自带的 `isSelected` 背景色/文字色变化。

## 侧边栏结构

参照 shadcn-admin 的分组 + 嵌套模式，用 `SideNavSection` 分组、`SideNavItem` 的 `children`+`collapsible` 做嵌套：

```
概览 (SideNavSection)
  LayoutDashboard  仪表盘        /
管理 (SideNavSection)
  Users            用户管理      /users
  Settings         系统设置 (无 href，纯分组开关，defaultIsCollapsed: false)
    UserCircle       个人资料    /settings/profile
    Palette          外观        /settings/appearance
```

- "系统设置"是不带 `href` 的父项，仅用 `children` + `collapsible={{ defaultIsCollapsed: false }}` 做手风琴展开，不引入额外状态管理（YAGNI：只有 2 个子项，默认展开即可，不做"当前路由自动展开"之类的逻辑）。
- 新增的两个子页面是真实可用的内容，不是占位空壳：
  - **个人资料** `/settings/profile`：`Card` 展示当前登录用户（`Avatar` + 用户名 + 角色 `Badge`）+ 退出登录按钮，复用现有 `useAuthStore`。
  - **外观** `/settings/appearance`：`Card` 承载现有的 `ThemeModeControl`（`SegmentedControl`）。TopNav 上的主题切换保留不动；这里是"系统设置里也能找到外观设置"的第二入口，复用同一个 `ThemeModeControl` 组件，不重复实现。

## 面包屑

`TopNav` 的 `startContent` 插槽用于放 `Breadcrumbs`。按 Astryx 官方最佳实践"顶层页面（无父级）不展示面包屑"：

| 路由                   | 面包屑              |
| ---------------------- | ------------------- |
| `/`（仪表盘）          | 不显示              |
| `/users`               | 用户管理            |
| `/settings/profile`    | 系统设置 / 个人资料 |
| `/settings/appearance` | 系统设置 / 外观     |

用一张 `pathname → crumbs` 的静态映射表实现（路由总共 4 个，没必要写通用路径解析器，符合 YAGNI）。

## 文件改动

| 文件                                                | 改动                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `package.json`                                      | 新增依赖 `lucide-react`                                          |
| `src/components/layout/AdminShell.tsx`              | 侧边栏改为分组+图标+嵌套子菜单；TopNav `startContent` 接入面包屑 |
| `src/components/layout/PageBreadcrumbs.tsx`（新增） | pathname → `Breadcrumbs` 映射组件                                |
| `src/routes/_auth/settings/profile.tsx`（新增）     | 个人资料页路由                                                   |
| `src/routes/_auth/settings/appearance.tsx`（新增）  | 外观设置页路由                                                   |
| `src/features/settings/ProfileCard.tsx`（新增）     | 个人资料卡片：用户信息 + 退出登录                                |
| `src/features/settings/AppearanceCard.tsx`（新增）  | 外观设置卡片：承载 `ThemeModeControl`                            |

## 测试

- Vitest：`PageBreadcrumbs` 的 pathname → crumbs 映射逻辑做单测（覆盖 4 个已知路由 + 未知路由兜底）。
- 手工验证：`pnpm build` + `pnpm exec tsc --noEmit` + dev server 走查侧边栏分组/嵌套展开/面包屑/两个新页面。骨架阶段不追求覆盖率。

## 不做的事

- 不引入 Cmd+K CommandPalette（用户已选择"标准对齐"而非"标准对齐 + 命令面板"）。
- 不新增 Settings 的其它子项（Account/Notifications/Display 等），避免指向空页面。
- 不做"当前路由自动展开父级嵌套菜单"的逻辑，默认展开即可满足现有 2 个子项的场景。
