# Settings 页重构设计（参考 shadcn-admin）

日期：2026-07-13
状态：已确认

## 目标

参考 shadcn-admin 的 settings 页面结构，把现有两个平级的设置子页（profile / appearance）重构为
「Settings 布局页 + 页内左侧二级导航 + 5 个子页」的结构，视觉与交互对齐参考截图，
数据层保持轻量（本地 state + toast）。

## 已确认的决策

- 子页范围：完整 5 个子页 —— Profile / Account / Appearance / Notifications / Display。
- 数据层：表单用本地 state，提交时 `useToast()` 弹成功提示，不新增 msw handler；
  Appearance 页的主题与语言接真实 ui store / i18n，改动立即生效。
- 侧边栏：AdminShell 里 Settings 不再嵌套子项，只留一个指向 `/settings` 的入口；
  子页切换全部由页内二级导航承担。
- 布局参照 astryx 官方 `settings` 页面模板的结构（Layout + LayoutPanel + LayoutContent）。

## 路由结构（TanStack Router file-based）

```
src/routes/_auth/settings.tsx            ← 新增：布局路由（页头 + 二级导航 + Outlet）
src/routes/_auth/settings/index.tsx      ← 新增：/settings 重定向到 /settings/profile
src/routes/_auth/settings/profile.tsx    ← 重写：只渲染 ProfileForm
src/routes/_auth/settings/account.tsx    ← 新增
src/routes/_auth/settings/appearance.tsx ← 重写
src/routes/_auth/settings/notifications.tsx ← 新增
src/routes/_auth/settings/display.tsx    ← 新增
```

路由文件保持薄：只做 `createFileRoute` + 渲染对应 feature 组件。

## 布局（settings.tsx 布局路由）

- 页头：`Heading`（设置）+ `Text`（描述副标题）+ `Divider`。
- 主体：`Layout` 结构 ——
  - `LayoutPanel width={260}`：`List` 二级导航，5 个 `ListItem`，各带图标
    （UserCircle / Wrench / Palette / Bell / Monitor，lucide-react），
    以当前 pathname 高亮选中项，点击走路由跳转。
  - `LayoutContent`：`<Outlet />` 渲染子页。
- 二级导航的「配置数组」（key/icon/href/i18n key）作为独立导出，便于单测。

## 子页内容（features/settings/ 下每页一个组件）

每页统一骨架：节标题（Heading）+ 描述（Text secondary）+ Divider + `FormLayout` 表单。

### ProfileForm
- 用户名：TextInput，必填（空值提交时组件 validation 提示），默认取 auth store 的 user.name。
- 邮箱：Select，选项为当前用户邮箱（单选项即可）。
- 简介：TextArea，带「可 @mention」说明文案。
- URLs：两个固定 TextInput（不做动态增删，YAGNI）。
- 提交按钮「更新资料」→ toast 成功。

### AccountForm
- 姓名：TextInput。
- 出生日期：DateInput。
- 语言：Select（纯演示字段，不接 i18n）。
- 提交按钮「更新账户」→ toast 成功。

### AppearanceForm
- 主题：两张 `SelectableCard` 做 Light / Dark 预览卡（卡内用 astryx 组件画简化的界面缩略示意），
  选择即调用 ui store 真实切换主题。
- 语言：复用现有 `LanguageControl`，立即生效。
- 无提交按钮（即时生效控件不需要）。

### NotificationsForm
- 「通知我…」RadioInput 组：全部新消息 / 仅私信和提及 / 关闭。
- 邮件通知：三行带边框的行（Card 或带 Divider 的 List），每行标题 + 描述 + `Switch`
  （沟通邮件 / 营销邮件 / 社交邮件）。
- 提交按钮「更新通知」→ toast 成功。

### DisplayForm
- 侧边栏显示项：CheckboxInput 组（演示字段：概览 / 任务 / 应用 / 用户 等）。
- 提交按钮「更新显示」→ toast 成功。

## 清理与适配

- 删除 `features/settings/ProfileCard.tsx`、`features/settings/AppearanceCard.tsx`。
- `AdminShell`：Settings 改为单个 `SideNavItem`，href=`/settings`，
  `isSelected` 按 `pathname.startsWith("/settings")` 判断；移除 UserCircle/Palette 子项引用。
- `PageBreadcrumbs`：适配新路由集合（settings 下 5 个子页 + /settings 本身），同步更新其测试。
- 原 ProfileCard 里的「退出登录」按钮不迁移（UserMenu 已有退出入口）。

## i18n

- `zh.json` / `en.json` 重写 `settings` 命名空间：布局页标题/描述、5 个子页的节标题/描述、
  全部字段 label / 说明 / 选项 / 按钮 / toast 文案。子页标题文案统一放在
  `settings.nav.*`（profile/account/appearance/notifications/display），
  供页内二级导航与 breadcrumbs 共用；`nav` 命名空间下删除 `profile`、`appearance`。

## 测试

- 二级导航配置数组：单测（项数、href、i18n key 完整性）。
- PageBreadcrumbs 测试更新为新路由。
- 表单组件的纯逻辑（如有提取的默认值/选项构造函数）补单测；页面渲染层沿用项目现状（不强行加渲染测试）。
- 手工验证：`vp dev` 起服务后过一遍 5 个子页 + 主题/语言即时切换 + toast。

## 验收标准

- `/settings` 及 5 个子路由可直达、刷新保持、二级导航与侧边栏高亮正确。
- Appearance 的主题/语言切换立即生效且与顶栏控件状态一致。
- 各表单提交弹出成功 toast；用户名为空时有校验提示。
- `vp lint`、`vp test`、`vp build` 全绿；中英文案完整无缺 key。
