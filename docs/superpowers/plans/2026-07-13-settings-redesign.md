# Settings 页重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 参考 shadcn-admin，把 settings 重构为「布局路由 + 页内左侧二级导航 + 5 个子页（Profile/Account/Appearance/Notifications/Display）」。

**Architecture:** TanStack Router file-based 布局路由（`_auth/settings.tsx` 提供页头 + LayoutPanel 二级导航 + Outlet），5 个子路由各渲染 `features/settings/` 下的一个表单组件；表单为本地 state + useToast 反馈；Appearance 页接真实 ui store（主题/语言即时生效）。

**Tech Stack:** React 19、@astryxdesign/core（Layout/List/FormLayout/TextInput/TextArea/Selector/DateInput/RadioList/CheckboxInput/Switch/SelectableCard/Toast）、@tanstack/react-router、react-i18next、zustand、vitest。

**Spec:** `docs/superpowers/specs/2026-07-13-settings-redesign-design.md`

## Global Constraints

- 每个 shell 命令前必须先 `export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"`（本机默认 Node 16，项目要求 ≥22.13）。下文命令均省略这一行，执行时自己带上。
- 命令入口：`pnpm test`（= vp test run，可跟文件路径过滤）、`pnpm lint`、`pnpm build`、`pnpm dev`。
- curl 本地 dev server 必须加 `--noproxy '*'`（本机有 127.0.0.1:7890 系统代理）。
- 布局/间距只用 astryx 组件 props（gap/padding/width/maxWidth 都是组件 prop，数字即像素）；禁止 `<div>`、禁止 xstyle、禁止 Tailwind。仅 AppearanceForm 的主题预览缩略图允许 `style` 属性 + 固定色板（见 Task 7 说明）。
- i18n：zh/en 两份 locale 的 key 集合必须完全一致（`src/i18n/index.test.ts` 有 key 对等测试守护）。
- `src/routeTree.gen.ts` 由 `@tanstack/router-plugin` 在 `pnpm dev`/`pnpm build` 时自动重生成，改动路由文件后跑一次 `pnpm build` 再把 gen 文件一并提交。
- 分层规则（oxlint 强制）：feature 之间不互相 import 内部文件；`src/components`/`src/stores` 不得 import features；routes 层负责组装。
- 提交信息用 conventional commits 中文描述，不带 attribution footer（全局已禁用）。

## 组件 API 备忘（已用 astryx CLI 核实）

- `Stack`（`@astryxdesign/core/Stack`）：`direction="vertical"|"horizontal"`、`gap`(0|0.5|1|1.5|2|3|4|5|6|8|10)、`padding`、`width`/`height`/`maxWidth`（数字=px）、`vAlign`/`hAlign`，透传 `style`。
- `Layout`（`@astryxdesign/core/Layout`）：slots `header/start/content/end`，`height="auto"`；`LayoutPanel`：`width={260} padding={2} hasDivider`；`LayoutContent`：`padding`。
- `List`/`ListItem`（`@astryxdesign/core/List`）：ListItem `label`(必填)/`href`/`isSelected`/`startContent`。
- `TextInput`/`TextArea`：`label`(必填)/`value`(必填)/`onChange(value)`/`description`/`placeholder`/`isRequired`/`status={{type:'error',message}}`；TextArea 另有 `rows`/`maxLength`。
- `Selector`（不是 "Select"）：`label`/`options: string[] | {value,label}[]`/`value`/`onChange(value)`/`placeholder`/`description`。
- `DateInput`：`value?: ISODateString`（`import type { ISODateString } from "@astryxdesign/core/Calendar"`）/`onChange(value|undefined)`/`hasClear`/`max`。
- `RadioList`/`RadioListItem`（`@astryxdesign/core/RadioList`）：RadioList `label`/`value`/`onChange`(均必填)；`RadioListItem` `value`/`label`(均必填)、`description` 可选。
- `CheckboxInput`：`label`/`value: boolean`(必填)/`onChange(checked)`/`description`。
- `Switch`：`label`/`value`(必填)/`onChange(checked)`/`description`/`labelSpacing="spread"`（标签与开关两端对齐，适合整行布局）。
- `SelectableCard`：`label`/`isSelected`/`onChange(isSelected)`(均必填)/`padding`/`width`。
- `Button`：`label`(必填)/`variant="primary"`/`type="submit"`。
- `FormLayout`（`@astryxdesign/core/FormLayout`）：纯布局，默认 vertical；需自己包 `<form>`。
- `useToast`（`import { useToast } from "@astryxdesign/core/Toast"`）：`const showToast = useToast(); showToast({ body, uniqueID })`，info 类型 5s 自动消失。
- `Heading`（`@astryxdesign/core/Heading`）：`level`(必填 1-6)、`type="display-3"` 可覆盖视觉尺寸。
- radius token：`--radius-inner`(4px)/`--radius-element`(8px)/`--radius-container`(12px)/`--radius-full`。

---

### Task 1: i18n 新增 settings 文案（zh/en）

**Files:**
- Modify: `src/i18n/locales/zh.json`（settings 命名空间）
- Modify: `src/i18n/locales/en.json`（settings 命名空间）

**Interfaces:**
- Produces: 后续所有任务引用的 i18n key：`settings.title`、`settings.description`、`settings.nav.{profile,account,appearance,notifications,display}`、`settings.{profile,account,appearance,notifications,display}.*`（详见下方 JSON）。
- 注意：**保留**现有旧 key（`nav.profile`、`nav.appearance`、`settings.profile.pageTitle/notLoggedIn`、`settings.appearance.pageTitle/cardTitle/cardDescription`），旧组件还在用，Task 9 才删。

- [ ] **Step 1: 改写 zh.json 的 settings 命名空间**

把 `zh.json` 的 `"settings"` 整体替换为（pageTitle/notLoggedIn/cardTitle/cardDescription 是暂留的旧 key）：

```json
"settings": {
  "title": "系统设置",
  "description": "管理你的账户设置与界面偏好",
  "nav": {
    "profile": "个人资料",
    "account": "账户",
    "appearance": "外观",
    "notifications": "通知",
    "display": "显示"
  },
  "profile": {
    "pageTitle": "个人资料",
    "notLoggedIn": "未登录",
    "description": "其他人将如何在站点上看到你",
    "username": "用户名",
    "usernameDescription": "这是你的公开显示名称，可以是真名或昵称",
    "usernameRequired": "用户名不能为空",
    "email": "邮箱",
    "emailPlaceholder": "选择要展示的邮箱",
    "emailDescription": "展示在个人主页上的联系邮箱",
    "bio": "简介",
    "bioPlaceholder": "介绍一下自己…",
    "bioDescription": "支持 @ 其他用户和组织",
    "urlWebsite": "网站",
    "urlSocial": "社交主页",
    "urlsDescription": "添加你的网站、博客或社交主页链接",
    "submit": "更新资料",
    "saved": "个人资料已更新"
  },
  "account": {
    "description": "更新账户信息，设置常用语言",
    "name": "姓名",
    "nameDescription": "用于账单等正式场合的名称",
    "dob": "出生日期",
    "dobDescription": "用于计算你的年龄",
    "language": "语言",
    "languagePlaceholder": "选择语言",
    "languageDescription": "演示字段，不影响界面语言",
    "submit": "更新账户",
    "saved": "账户信息已更新"
  },
  "appearance": {
    "pageTitle": "外观设置",
    "cardTitle": "外观",
    "cardDescription": "调整界面的主题模式与语言",
    "description": "自定义界面外观，修改后立即生效",
    "theme": "主题",
    "themeDescription": "选择仪表盘的主题模式",
    "language": "语言",
    "languageDescription": "界面显示语言，切换后立即生效"
  },
  "notifications": {
    "description": "配置接收通知的方式",
    "notifyAbout": "通知我…",
    "notifyAll": "全部新消息",
    "notifyMentions": "仅私信和 @ 提及",
    "notifyNone": "关闭通知",
    "emailTitle": "邮件通知",
    "emailCommunication": "沟通邮件",
    "emailCommunicationDescription": "接收账户活动相关的邮件",
    "emailMarketing": "营销邮件",
    "emailMarketingDescription": "接收新产品、新功能等推广邮件",
    "emailSocial": "社交邮件",
    "emailSocialDescription": "接收好友请求、关注等社交邮件",
    "submit": "更新通知",
    "saved": "通知偏好已更新"
  },
  "display": {
    "description": "控制侧边栏展示的模块",
    "sidebarTitle": "侧边栏模块",
    "sidebarDescription": "选择要在侧边栏中显示的模块（演示配置，不影响实际导航）",
    "itemDashboard": "仪表盘",
    "itemTasks": "任务看板",
    "itemApps": "应用集成",
    "itemUsers": "用户管理",
    "submit": "更新显示",
    "saved": "显示偏好已更新"
  }
}
```

- [ ] **Step 2: 改写 en.json 的 settings 命名空间（key 与 zh 完全一致）**

```json
"settings": {
  "title": "Settings",
  "description": "Manage your account settings and interface preferences",
  "nav": {
    "profile": "Profile",
    "account": "Account",
    "appearance": "Appearance",
    "notifications": "Notifications",
    "display": "Display"
  },
  "profile": {
    "pageTitle": "Profile",
    "notLoggedIn": "Not logged in",
    "description": "This is how others will see you on the site",
    "username": "Username",
    "usernameDescription": "This is your public display name. It can be your real name or a pseudonym",
    "usernameRequired": "Username cannot be empty",
    "email": "Email",
    "emailPlaceholder": "Select an email to display",
    "emailDescription": "The contact email shown on your profile",
    "bio": "Bio",
    "bioPlaceholder": "Tell us a little about yourself…",
    "bioDescription": "You can @mention other users and organizations",
    "urlWebsite": "Website",
    "urlSocial": "Social profile",
    "urlsDescription": "Add links to your website, blog, or social profiles",
    "submit": "Update profile",
    "saved": "Profile updated"
  },
  "account": {
    "description": "Update your account information and preferred language",
    "name": "Name",
    "nameDescription": "The name used for billing and other formal contexts",
    "dob": "Date of birth",
    "dobDescription": "Used to calculate your age",
    "language": "Language",
    "languagePlaceholder": "Select a language",
    "languageDescription": "Demo field; does not affect the interface language",
    "submit": "Update account",
    "saved": "Account updated"
  },
  "appearance": {
    "pageTitle": "Appearance",
    "cardTitle": "Appearance",
    "cardDescription": "Adjust the interface theme and language",
    "description": "Customize the interface appearance. Changes apply immediately",
    "theme": "Theme",
    "themeDescription": "Select the theme for the dashboard",
    "language": "Language",
    "languageDescription": "Interface language; switches immediately"
  },
  "notifications": {
    "description": "Configure how you receive notifications",
    "notifyAbout": "Notify me about…",
    "notifyAll": "All new messages",
    "notifyMentions": "Direct messages and mentions only",
    "notifyNone": "Nothing",
    "emailTitle": "Email notifications",
    "emailCommunication": "Communication emails",
    "emailCommunicationDescription": "Receive emails about your account activity",
    "emailMarketing": "Marketing emails",
    "emailMarketingDescription": "Receive emails about new products, features, and more",
    "emailSocial": "Social emails",
    "emailSocialDescription": "Receive emails for friend requests, follows, and more",
    "submit": "Update notifications",
    "saved": "Notification preferences updated"
  },
  "display": {
    "description": "Control which modules appear in the sidebar",
    "sidebarTitle": "Sidebar modules",
    "sidebarDescription": "Select the modules shown in the sidebar (demo only; does not change navigation)",
    "itemDashboard": "Dashboard",
    "itemTasks": "Task Board",
    "itemApps": "Integrations",
    "itemUsers": "Users",
    "submit": "Update display",
    "saved": "Display preferences updated"
  }
}
```

- [ ] **Step 3: 跑 i18n 测试验证 key 对等**

Run: `pnpm test src/i18n/index.test.ts`
Expected: PASS（zh/en key 集合一致）

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/zh.json src/i18n/locales/en.json
git commit -m "feat: settings 重构 i18n 文案（新增 5 个子页命名空间）"
```

---

### Task 2: 二级导航配置 SETTINGS_NAV（TDD）

**Files:**
- Create: `src/features/settings/nav.ts`
- Test: `src/features/settings/nav.test.ts`

**Interfaces:**
- Consumes: Task 1 的 `settings.nav.*` key。
- Produces: `SETTINGS_NAV: SettingsNavItem[]`，`interface SettingsNavItem { key: SettingsNavKey; href: string; labelKey: string; icon: LucideIcon }`，`type SettingsNavKey = "profile" | "account" | "appearance" | "notifications" | "display"`。Task 3（布局路由）与 Task 9（breadcrumbs）消费。

- [ ] **Step 1: 写失败测试 `src/features/settings/nav.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import zh from "../../i18n/locales/zh.json";
import { SETTINGS_NAV } from "./nav";

describe("SETTINGS_NAV", () => {
  it("包含 5 个子页，href 与 key 一一对应且唯一", () => {
    expect(SETTINGS_NAV).toHaveLength(5);
    expect(new Set(SETTINGS_NAV.map((item) => item.href)).size).toBe(5);
    for (const item of SETTINGS_NAV) {
      expect(item.href).toBe(`/settings/${item.key}`);
    }
  });

  it("labelKey 指向 settings.nav 下的现存文案", () => {
    for (const item of SETTINGS_NAV) {
      expect(item.labelKey).toBe(`settings.nav.${item.key}`);
      expect(zh.settings.nav[item.key]).toBeTypeOf("string");
    }
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test src/features/settings/nav.test.ts`
Expected: FAIL（Cannot find module './nav'）

- [ ] **Step 3: 实现 `src/features/settings/nav.ts`**

```ts
import { Bell, Monitor, Palette, UserCircle, Wrench, type LucideIcon } from "lucide-react";

export type SettingsNavKey = "profile" | "account" | "appearance" | "notifications" | "display";

export interface SettingsNavItem {
  key: SettingsNavKey;
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

const NAV_ICONS: Record<SettingsNavKey, LucideIcon> = {
  profile: UserCircle,
  account: Wrench,
  appearance: Palette,
  notifications: Bell,
  display: Monitor,
};

const NAV_KEYS: SettingsNavKey[] = ["profile", "account", "appearance", "notifications", "display"];

export const SETTINGS_NAV: SettingsNavItem[] = NAV_KEYS.map((key) => ({
  key,
  href: `/settings/${key}`,
  labelKey: `settings.nav.${key}`,
  icon: NAV_ICONS[key],
}));
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test src/features/settings/nav.test.ts`
Expected: PASS（2 个用例）

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/nav.ts src/features/settings/nav.test.ts
git commit -m "feat: settings 二级导航配置 SETTINGS_NAV"
```

---

### Task 3: settings 布局路由 + index 重定向

**Files:**
- Create: `src/routes/_auth/settings.tsx`（布局路由）
- Create: `src/routes/_auth/settings/index.tsx`（重定向）
- Modify: `src/routeTree.gen.ts`（build 自动重生成，一并提交）

**Interfaces:**
- Consumes: `SETTINGS_NAV`（Task 2）、`settings.title`/`settings.description`（Task 1）。
- Produces: `/settings` 布局（页头 + 左侧 List 导航 + Outlet），子路由渲染进 `LayoutContent padding={4}`。本任务完成后旧的 profile/appearance 子页会自动嵌入新布局（旧卡片样式暂留，后续任务替换）。

- [ ] **Step 1: 创建布局路由 `src/routes/_auth/settings.tsx`**

```tsx
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Divider } from "@astryxdesign/core/Divider";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslation } from "react-i18next";
import { SETTINGS_NAV } from "../../features/settings/nav";

export const Route = createFileRoute("/_auth/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Stack direction="vertical" gap={4}>
      <Stack direction="vertical" gap={1}>
        <Text type="display-3">{t("settings.title")}</Text>
        <Text type="supporting" color="secondary">
          {t("settings.description")}
        </Text>
      </Stack>
      <Divider />
      <Layout
        height="auto"
        start={
          <LayoutPanel hasDivider={false} width={260} padding={2}>
            <List density="balanced">
              {SETTINGS_NAV.map(({ key, href, labelKey, icon: Icon }) => (
                <ListItem
                  key={key}
                  label={t(labelKey)}
                  href={href}
                  isSelected={pathname === href}
                  startContent={<Icon size={16} />}
                />
              ))}
            </List>
          </LayoutPanel>
        }
        content={
          <LayoutContent padding={4}>
            <Outlet />
          </LayoutContent>
        }
      />
    </Stack>
  );
}
```

说明：页标题沿用项目现有习惯 `Text type="display-3"`（与 dashboard 等页一致）。

- [ ] **Step 2: 创建重定向路由 `src/routes/_auth/settings/index.tsx`**

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/settings/")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/profile" });
  },
});
```

- [ ] **Step 3: 重生成路由树并做类型检查**

Run: `pnpm build`
Expected: 构建成功，`src/routeTree.gen.ts` 出现 `/_auth/settings` 与 `/_auth/settings/` 两个新节点

- [ ] **Step 4: 手工验证布局**

Run: `pnpm dev`（后台），浏览器/`curl --noproxy '*'` 访问 `http://localhost:5173/settings`
Expected: 重定向到 `/settings/profile`；页面出现「系统设置」页头 + 左侧 5 项二级导航（Profile 高亮）+ 旧的 ProfileCard 内容；点击「外观」能切到旧 AppearanceCard。

- [ ] **Step 5: Commit**

```bash
git add src/routes/_auth/settings.tsx src/routes/_auth/settings/index.tsx src/routeTree.gen.ts
git commit -m "feat: settings 布局路由（页头 + 二级导航 + Outlet）与默认重定向"
```

---

### Task 4: SettingsSection 骨架 + ProfileForm

**Files:**
- Create: `src/features/settings/SettingsSection.tsx`
- Create: `src/features/settings/ProfileForm.tsx`
- Modify: `src/routes/_auth/settings/profile.tsx`（改为渲染 ProfileForm）
- Delete: `src/features/settings/ProfileCard.tsx`

**Interfaces:**
- Consumes: Task 1 的 `settings.profile.*`、`settings.nav.profile`；`useAuthStore`（`user: { id; name; email } | null`）。
- Produces: `SettingsSection({ title: string; description: string; children: ReactNode })` —— Task 5-8 的所有表单复用；`ProfileForm()` 无 props。

- [ ] **Step 1: 创建 `src/features/settings/SettingsSection.tsx`**

```tsx
import type { ReactNode } from "react";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <Stack direction="vertical" gap={4}>
      <Stack direction="vertical" gap={1}>
        <Heading level={2}>{title}</Heading>
        <Text type="supporting" color="secondary">
          {description}
        </Text>
      </Stack>
      <Divider />
      {children}
    </Stack>
  );
}
```

- [ ] **Step 2: 创建 `src/features/settings/ProfileForm.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";
import { SettingsSection } from "./SettingsSection";

const BIO_MAX_LENGTH = 240;
const FORM_MAX_WIDTH = 640;

export function ProfileForm() {
  const { t } = useTranslation();
  const showToast = useToast();
  const user = useAuthStore((state) => state.user);

  const [username, setUsername] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isUsernameMissing = username.trim() === "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    if (isUsernameMissing) {
      return;
    }
    showToast({ body: t("settings.profile.saved"), uniqueID: "settings-profile-saved" });
  };

  return (
    <SettingsSection title={t("settings.nav.profile")} description={t("settings.profile.description")}>
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <FormLayout>
            <TextInput
              label={t("settings.profile.username")}
              value={username}
              onChange={setUsername}
              description={t("settings.profile.usernameDescription")}
              isRequired
              status={
                hasSubmitted && isUsernameMissing
                  ? { type: "error", message: t("settings.profile.usernameRequired") }
                  : undefined
              }
            />
            <Selector
              label={t("settings.profile.email")}
              value={email}
              onChange={setEmail}
              options={user ? [user.email] : []}
              placeholder={t("settings.profile.emailPlaceholder")}
              description={t("settings.profile.emailDescription")}
            />
            <TextArea
              label={t("settings.profile.bio")}
              value={bio}
              onChange={setBio}
              placeholder={t("settings.profile.bioPlaceholder")}
              description={t("settings.profile.bioDescription")}
              maxLength={BIO_MAX_LENGTH}
            />
            <TextInput
              label={t("settings.profile.urlWebsite")}
              value={websiteUrl}
              onChange={setWebsiteUrl}
              description={t("settings.profile.urlsDescription")}
              placeholder="https://example.com"
            />
            <TextInput
              label={t("settings.profile.urlSocial")}
              value={socialUrl}
              onChange={setSocialUrl}
              placeholder="https://x.com/username"
            />
          </FormLayout>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.profile.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
```

- [ ] **Step 3: 重写 `src/routes/_auth/settings/profile.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { ProfileForm } from "../../../features/settings/ProfileForm";

export const Route = createFileRoute("/_auth/settings/profile")({
  component: ProfileForm,
});
```

- [ ] **Step 4: 删除旧组件**

```bash
git rm src/features/settings/ProfileCard.tsx
```

- [ ] **Step 5: 构建 + 手工验证**

Run: `pnpm build`
Expected: 成功（若 ProfileCard 还有别处引用会在此暴露——按报错移除引用）

Run: dev server 访问 `/settings/profile`
Expected: 新表单渲染；清空用户名点「更新资料」出现红色校验；填上后提交弹出「个人资料已更新」toast。

- [ ] **Step 6: Commit**

```bash
git add -A src/features/settings src/routes/_auth/settings/profile.tsx
git commit -m "feat: settings Profile 子页改为分节表单，移除旧 ProfileCard"
```

---

### Task 5: AccountForm + account 路由

**Files:**
- Create: `src/features/settings/AccountForm.tsx`
- Create: `src/routes/_auth/settings/account.tsx`
- Modify: `src/routeTree.gen.ts`（自动）

**Interfaces:**
- Consumes: `SettingsSection`（Task 4）、`settings.account.*`（Task 1）、`useAuthStore`。
- Produces: `AccountForm()` 无 props。

- [ ] **Step 1: 创建 `src/features/settings/AccountForm.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import type { ISODateString } from "@astryxdesign/core/Calendar";
import { DateInput } from "@astryxdesign/core/DateInput";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";
import { SettingsSection } from "./SettingsSection";

const FORM_MAX_WIDTH = 640;
// 演示字段：与界面语言无关，所以直接用语言自称，不走 i18n
const DEMO_LANGUAGE_OPTIONS = ["中文", "English", "Español", "Français", "日本語"];

export function AccountForm() {
  const { t } = useTranslation();
  const showToast = useToast();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState(user?.name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState<ISODateString | undefined>(undefined);
  const [language, setLanguage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast({ body: t("settings.account.saved"), uniqueID: "settings-account-saved" });
  };

  return (
    <SettingsSection title={t("settings.nav.account")} description={t("settings.account.description")}>
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <FormLayout>
            <TextInput
              label={t("settings.account.name")}
              value={name}
              onChange={setName}
              description={t("settings.account.nameDescription")}
            />
            <DateInput
              label={t("settings.account.dob")}
              value={dateOfBirth}
              onChange={setDateOfBirth}
              description={t("settings.account.dobDescription")}
              hasClear
            />
            <Selector
              label={t("settings.account.language")}
              value={language}
              onChange={setLanguage}
              options={DEMO_LANGUAGE_OPTIONS}
              placeholder={t("settings.account.languagePlaceholder")}
              description={t("settings.account.languageDescription")}
            />
          </FormLayout>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.account.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
```

- [ ] **Step 2: 创建 `src/routes/_auth/settings/account.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { AccountForm } from "../../../features/settings/AccountForm";

export const Route = createFileRoute("/_auth/settings/account")({
  component: AccountForm,
});
```

- [ ] **Step 3: 构建 + 手工验证**

Run: `pnpm build`，然后 dev server 访问 `/settings/account`
Expected: 构建成功；二级导航「账户」高亮；日期选择器可选日期并可清除；提交弹「账户信息已更新」toast。

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/AccountForm.tsx src/routes/_auth/settings/account.tsx src/routeTree.gen.ts
git commit -m "feat: settings 新增 Account 子页"
```

---

### Task 6: NotificationsForm + notifications 路由

**Files:**
- Create: `src/features/settings/NotificationsForm.tsx`
- Create: `src/routes/_auth/settings/notifications.tsx`
- Modify: `src/routeTree.gen.ts`（自动）

**Interfaces:**
- Consumes: `SettingsSection`（Task 4）、`settings.notifications.*`（Task 1）。
- Produces: `NotificationsForm()` 无 props。

- [ ] **Step 1: 创建 `src/features/settings/NotificationsForm.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Stack } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingsSection";

const FORM_MAX_WIDTH = 640;

type NotifyMode = "all" | "mentions" | "none";

interface EmailToggle {
  key: "communication" | "marketing" | "social";
  labelKey: string;
  descriptionKey: string;
}

const EMAIL_TOGGLES: EmailToggle[] = [
  {
    key: "communication",
    labelKey: "settings.notifications.emailCommunication",
    descriptionKey: "settings.notifications.emailCommunicationDescription",
  },
  {
    key: "marketing",
    labelKey: "settings.notifications.emailMarketing",
    descriptionKey: "settings.notifications.emailMarketingDescription",
  },
  {
    key: "social",
    labelKey: "settings.notifications.emailSocial",
    descriptionKey: "settings.notifications.emailSocialDescription",
  },
];

export function NotificationsForm() {
  const { t } = useTranslation();
  const showToast = useToast();

  const [notifyMode, setNotifyMode] = useState<NotifyMode>("all");
  const [emailPrefs, setEmailPrefs] = useState<Record<EmailToggle["key"], boolean>>({
    communication: false,
    marketing: false,
    social: true,
  });

  const setEmailPref = (key: EmailToggle["key"], value: boolean) => {
    setEmailPrefs((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast({ body: t("settings.notifications.saved"), uniqueID: "settings-notifications-saved" });
  };

  return (
    <SettingsSection
      title={t("settings.nav.notifications")}
      description={t("settings.notifications.description")}
    >
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <RadioList
            label={t("settings.notifications.notifyAbout")}
            value={notifyMode}
            onChange={(value) => setNotifyMode(value as NotifyMode)}
          >
            <RadioListItem value="all" label={t("settings.notifications.notifyAll")} />
            <RadioListItem value="mentions" label={t("settings.notifications.notifyMentions")} />
            <RadioListItem value="none" label={t("settings.notifications.notifyNone")} />
          </RadioList>
          <Stack direction="vertical" gap={3}>
            <Heading level={3}>{t("settings.notifications.emailTitle")}</Heading>
            {EMAIL_TOGGLES.map(({ key, labelKey, descriptionKey }) => (
              <Card key={key} padding={4}>
                <Switch
                  label={t(labelKey)}
                  description={t(descriptionKey)}
                  value={emailPrefs[key]}
                  onChange={(checked) => setEmailPref(key, checked)}
                  labelPosition="start"
                  labelSpacing="spread"
                />
              </Card>
            ))}
          </Stack>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.notifications.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
```

- [ ] **Step 2: 创建 `src/routes/_auth/settings/notifications.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { NotificationsForm } from "../../../features/settings/NotificationsForm";

export const Route = createFileRoute("/_auth/settings/notifications")({
  component: NotificationsForm,
});
```

- [ ] **Step 3: 构建 + 手工验证**

Run: `pnpm build`，dev server 访问 `/settings/notifications`
Expected: 单选组三项可切换；三张邮件卡片的 Switch 标签在左、开关在右；提交弹「通知偏好已更新」toast。

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/NotificationsForm.tsx src/routes/_auth/settings/notifications.tsx src/routeTree.gen.ts
git commit -m "feat: settings 新增 Notifications 子页"
```

---

### Task 7: AppearanceForm（接真实主题/语言）+ appearance 路由重写

**Files:**
- Create: `src/features/settings/AppearanceForm.tsx`
- Modify: `src/routes/_auth/settings/appearance.tsx`（改为渲染 AppearanceForm）
- Delete: `src/features/settings/AppearanceCard.tsx`

**Interfaces:**
- Consumes: `SettingsSection`（Task 4）、`settings.appearance.*` 与既有 `theme.light`/`theme.dark`（i18n）、`useUiStore`（`themeMode/setThemeMode`）、`LanguageControl`（`src/components/layout/`，分层规则允许 feature 依赖共享层）。
- Produces: `AppearanceForm()` 无 props。

- [ ] **Step 1: 创建 `src/features/settings/AppearanceForm.tsx`**

```tsx
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useTranslation } from "react-i18next";
import { LanguageControl } from "../../components/layout/LanguageControl";
import { useUiStore } from "../../stores/ui";
import { SettingsSection } from "./SettingsSection";

// 预览色板刻意固定：两张卡各自展示目标主题的样子，不随当前主题切换，
// 语义 token 会跟随 light-dark() 变化导致两张卡长得一样，所以这里例外地使用固定色值。
const THEME_PREVIEW_PALETTES = {
  light: { surface: "#ECEDEF", card: "#FFFFFF", bar: "#D9DCE0" },
  dark: { surface: "#111112", card: "#28292C", bar: "#5A5E66" },
} as const;

type PreviewMode = keyof typeof THEME_PREVIEW_PALETTES;

const FORM_MAX_WIDTH = 640;

function ThemePreview({ mode }: { mode: PreviewMode }) {
  const palette = THEME_PREVIEW_PALETTES[mode];
  const barStyle = { backgroundColor: palette.bar, borderRadius: "var(--radius-inner)" };
  return (
    <Stack
      direction="vertical"
      gap={1.5}
      padding={2}
      width={172}
      style={{ backgroundColor: palette.surface, borderRadius: "var(--radius-element)" }}
    >
      <Stack
        direction="vertical"
        gap={1}
        padding={2}
        style={{ backgroundColor: palette.card, borderRadius: "var(--radius-inner)" }}
      >
        <Stack height={8} width={72} style={barStyle} />
        <Stack height={8} width={104} style={barStyle} />
      </Stack>
      <Stack
        direction="horizontal"
        gap={1}
        padding={2}
        vAlign="center"
        style={{ backgroundColor: palette.card, borderRadius: "var(--radius-inner)" }}
      >
        <Stack height={12} width={12} style={{ backgroundColor: palette.bar, borderRadius: "var(--radius-full)" }} />
        <Stack height={8} width={88} style={barStyle} />
      </Stack>
    </Stack>
  );
}

export function AppearanceForm() {
  const { t } = useTranslation();
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);

  return (
    <SettingsSection
      title={t("settings.nav.appearance")}
      description={t("settings.appearance.description")}
    >
      <Stack direction="vertical" gap={6} maxWidth={FORM_MAX_WIDTH}>
        <Stack direction="vertical" gap={2}>
          <Text type="large">{t("settings.appearance.theme")}</Text>
          <Text type="supporting" color="secondary">
            {t("settings.appearance.themeDescription")}
          </Text>
          <Stack direction="horizontal" gap={4} wrap="wrap">
            {(["light", "dark"] as const).map((mode) => (
              <Stack key={mode} direction="vertical" gap={1.5} hAlign="center">
                <SelectableCard
                  label={t(`theme.${mode}`)}
                  isSelected={themeMode === mode}
                  onChange={() => setThemeMode(mode)}
                  padding={1.5}
                >
                  <ThemePreview mode={mode} />
                </SelectableCard>
                <Text type="supporting">{t(`theme.${mode}`)}</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
        <Stack direction="vertical" gap={2}>
          <Text type="large">{t("settings.appearance.language")}</Text>
          <Text type="supporting" color="secondary">
            {t("settings.appearance.languageDescription")}
          </Text>
          <Stack direction="horizontal">
            <LanguageControl />
          </Stack>
        </Stack>
      </Stack>
    </SettingsSection>
  );
}
```

说明：主题为即时生效控件，无提交按钮；`themeMode === "system"` 时两张卡都不高亮，属预期（system 仍可通过顶栏切换）。

- [ ] **Step 2: 重写 `src/routes/_auth/settings/appearance.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { AppearanceForm } from "../../../features/settings/AppearanceForm";

export const Route = createFileRoute("/_auth/settings/appearance")({
  component: AppearanceForm,
});
```

- [ ] **Step 3: 删除旧组件**

```bash
git rm src/features/settings/AppearanceCard.tsx
```

- [ ] **Step 4: 构建 + 手工验证**

Run: `pnpm build`，dev server 访问 `/settings/appearance`
Expected: 两张预览卡（左亮右暗）；点暗色卡整站立即变暗且顶栏主题控件同步；语言切换立即改变界面文案；两张卡的缩略图在暗色模式下外观不变（固定色板）。

- [ ] **Step 5: Commit**

```bash
git add -A src/features/settings src/routes/_auth/settings/appearance.tsx
git commit -m "feat: settings Appearance 子页改为主题预览卡 + 即时语言切换"
```

---

### Task 8: DisplayForm + display 路由

**Files:**
- Create: `src/features/settings/DisplayForm.tsx`
- Create: `src/routes/_auth/settings/display.tsx`
- Modify: `src/routeTree.gen.ts`（自动）

**Interfaces:**
- Consumes: `SettingsSection`（Task 4）、`settings.display.*`（Task 1）。
- Produces: `DisplayForm()` 无 props。

- [ ] **Step 1: 创建 `src/features/settings/DisplayForm.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useToast } from "@astryxdesign/core/Toast";
import { useTranslation } from "react-i18next";
import { SettingsSection } from "./SettingsSection";

const FORM_MAX_WIDTH = 640;

type SidebarItemKey = "dashboard" | "tasks" | "apps" | "users";

const SIDEBAR_ITEMS: { key: SidebarItemKey; labelKey: string }[] = [
  { key: "dashboard", labelKey: "settings.display.itemDashboard" },
  { key: "tasks", labelKey: "settings.display.itemTasks" },
  { key: "apps", labelKey: "settings.display.itemApps" },
  { key: "users", labelKey: "settings.display.itemUsers" },
];

export function DisplayForm() {
  const { t } = useTranslation();
  const showToast = useToast();

  const [visibleItems, setVisibleItems] = useState<Record<SidebarItemKey, boolean>>({
    dashboard: true,
    tasks: true,
    apps: true,
    users: true,
  });

  const setItemVisible = (key: SidebarItemKey, value: boolean) => {
    setVisibleItems((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    showToast({ body: t("settings.display.saved"), uniqueID: "settings-display-saved" });
  };

  return (
    <SettingsSection title={t("settings.nav.display")} description={t("settings.display.description")}>
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" gap={5} maxWidth={FORM_MAX_WIDTH}>
          <Stack direction="vertical" gap={2}>
            <Text type="large">{t("settings.display.sidebarTitle")}</Text>
            <Text type="supporting" color="secondary">
              {t("settings.display.sidebarDescription")}
            </Text>
            <Stack direction="vertical" gap={2}>
              {SIDEBAR_ITEMS.map(({ key, labelKey }) => (
                <CheckboxInput
                  key={key}
                  label={t(labelKey)}
                  value={visibleItems[key]}
                  onChange={(checked) => setItemVisible(key, checked)}
                />
              ))}
            </Stack>
          </Stack>
          <Stack direction="horizontal" gap={3}>
            <Button label={t("settings.display.submit")} variant="primary" type="submit" />
          </Stack>
        </Stack>
      </form>
    </SettingsSection>
  );
}
```

- [ ] **Step 2: 创建 `src/routes/_auth/settings/display.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { DisplayForm } from "../../../features/settings/DisplayForm";

export const Route = createFileRoute("/_auth/settings/display")({
  component: DisplayForm,
});
```

- [ ] **Step 3: 构建 + 手工验证**

Run: `pnpm build`，dev server 访问 `/settings/display`
Expected: 4 个复选框可勾选；提交弹「显示偏好已更新」toast。

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/DisplayForm.tsx src/routes/_auth/settings/display.tsx src/routeTree.gen.ts
git commit -m "feat: settings 新增 Display 子页"
```

---

### Task 9: 侧边栏单入口 + breadcrumbs 适配 + 旧 i18n key 清理（TDD）

**Files:**
- Modify: `src/components/layout/AdminShell.tsx`
- Modify: `src/components/layout/PageBreadcrumbs.tsx`
- Test: `src/components/layout/PageBreadcrumbs.test.ts`
- Modify: `src/i18n/locales/zh.json`、`src/i18n/locales/en.json`（删旧 key）

**Interfaces:**
- Consumes: `SETTINGS_NAV` 不可用（`components` 层禁止 import features）——breadcrumbs 用自己的路由映射，label 引用 `settings.nav.*` 字符串 key。
- Produces: `getBreadcrumbLabels(pathname)` 覆盖 5 个 settings 子路由。

- [ ] **Step 1: 先改测试 `src/components/layout/PageBreadcrumbs.test.ts`（RED）**

整体替换为：

```ts
import { describe, expect, it } from "vitest";
import { getBreadcrumbLabels } from "./PageBreadcrumbs";

describe("getBreadcrumbLabels", () => {
  it("returns an empty array for the dashboard root route", () => {
    expect(getBreadcrumbLabels("/")).toEqual([]);
  });

  it("returns a single label key for a top-level route", () => {
    expect(getBreadcrumbLabels("/users")).toEqual(["nav.users"]);
  });

  it("returns a two-level trail for every settings sub page", () => {
    for (const key of ["profile", "account", "appearance", "notifications", "display"]) {
      expect(getBreadcrumbLabels(`/settings/${key}`)).toEqual(["nav.settings", `settings.nav.${key}`]);
    }
  });

  it("falls back to an empty array for unknown routes", () => {
    expect(getBreadcrumbLabels("/unknown")).toEqual([]);
  });
});
```

Run: `pnpm test src/components/layout/PageBreadcrumbs.test.ts`
Expected: FAIL（account/notifications/display 无映射，且 profile/appearance 的 key 前缀不对）

- [ ] **Step 2: 更新 `src/components/layout/PageBreadcrumbs.tsx` 的映射（GREEN）**

把 `BREADCRUMB_KEYS` 替换为：

```ts
const SETTINGS_PAGES = ["profile", "account", "appearance", "notifications", "display"] as const;

const BREADCRUMB_KEYS: Record<string, string[]> = {
  "/users": ["nav.users"],
  ...Object.fromEntries(
    SETTINGS_PAGES.map((page) => [`/settings/${page}`, ["nav.settings", `settings.nav.${page}`]]),
  ),
};
```

Run: `pnpm test src/components/layout/PageBreadcrumbs.test.ts`
Expected: PASS

- [ ] **Step 3: AdminShell 侧边栏改单入口**

`src/components/layout/AdminShell.tsx`：
1. 把嵌套的 Settings `SideNavItem`（带 `collapsible` 与两个子项的整块）替换为：

```tsx
<SideNavItem
  label={t("nav.settings")}
  href="/settings"
  icon={Settings}
  selectedIcon={Settings}
  isSelected={pathname.startsWith("/settings")}
/>
```

2. import 行删去不再使用的 `Palette, UserCircle`。

- [ ] **Step 4: 删除两份 locale 中的旧 key**

zh.json / en.json 同步删除：
- `nav.profile`、`nav.appearance`
- `settings.profile.pageTitle`、`settings.profile.notLoggedIn`
- `settings.appearance.pageTitle`、`settings.appearance.cardTitle`、`settings.appearance.cardDescription`

Run: `grep -rn "nav.profile\|nav.appearance\|notLoggedIn\|cardTitle\|cardDescription\|pageTitle" src/`
Expected: 无任何源码引用残留

- [ ] **Step 5: 全量测试**

Run: `pnpm test`
Expected: 全部 PASS（含 i18n key 对等测试）

- [ ] **Step 6: 手工验证**

dev server：侧边栏 Settings 无子项，点击进入 `/settings/profile` 且高亮；5 个子页顶栏 breadcrumbs 均为「系统设置 / <子页名>」；切英文后 breadcrumbs 同步。

- [ ] **Step 7: Commit**

```bash
git add src/components/layout src/i18n/locales
git commit -m "refactor: 侧边栏 Settings 单入口，breadcrumbs 适配新子页，清理旧文案"
```

---

### Task 10: 全量验证收尾

**Files:** 无新增（只跑验证，必要时小修）

- [ ] **Step 1: 全量校验**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: 三项全绿。lint 若报分层/未用 import 问题按提示修复。

- [ ] **Step 2: 浏览器过一遍验收标准（对照 spec）**

- `/settings` 重定向到 `/settings/profile`；5 个子路由直达 + 刷新保持。
- 二级导航高亮跟随路由；侧边栏 Settings 在所有子页保持选中。
- Profile 表单校验 + toast；Account/Notifications/Display 提交 toast。
- Appearance 主题/语言即时生效，与顶栏控件状态一致。
- 中英切换所有 settings 文案无缺 key（界面上不出现 `settings.` 字样的裸 key）。
- 320/768/1440 宽度下无横向溢出（窄屏下左侧面板与内容的表现以不溢出为底线）。

- [ ] **Step 3: 如有修复则提交**

```bash
git add -A && git commit -m "fix: settings 重构验收问题修复"
```

（无修复则跳过。）
