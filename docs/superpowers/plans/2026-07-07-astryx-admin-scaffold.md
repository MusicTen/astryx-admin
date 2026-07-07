# Astryx Admin 项目骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建可直接开发业务的 admin 骨架：登录 + 路由守卫 + AppShell 布局 + 仪表盘 + 用户 CRUD 示例。

**Architecture:** vite-plus 统一工具链（vp 命令），TanStack Router 文件式路由，ky+SWR 数据层，zustand+immer 客户端状态，MSW mock。UI 一律用 @astryxdesign/core 组件拼装。

**Tech Stack:** pnpm + Node 22 + TS strict + React 19 + vite-plus + @astryxdesign/core(StyleX) + @tanstack/react-router + ky + swr + zustand + immer + msw

## Global Constraints

- Node ≥ 22.13.0：本机执行一律 `export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH"`；写入 `.nvmrc`（内容 `22`）和 `package.json` `engines.node: ">=22.13.0"`
- 包管理仅 pnpm（本机 11.10.0）
- 工具链仅 `vite-plus`：脚本用 `vp dev` / `vp build` / `vp test` / `vp lint` / `vp fmt`，**不安装** eslint/prettier/jest
- 服务端状态仅 SWR，**不安装** @tanstack/react-query
- **Astryx 组件优先**：布局用 `AppShell/Stack/Grid/Section/Center`，文本用 `Text`，禁止无必要的自定义 div+CSS；对任何组件 props 不确定时先运行 `pnpm exec astryx component <Name> --dense --detail compact` 查证，不得凭记忆猜测
- 仅当 Astryx 无对应组件才允许 StyleX 自定义（`xstyle` prop），并加注释说明原因
- API 统一前缀 `/api`，mock 由 MSW 提供
- 每个 Task 结束必须 `git commit`

---

### Task 1: 工程底座与工具链

**Files:**

- Create: `package.json`, `.nvmrc`, `.gitignore`, `tsconfig.json`, `index.html`, `vite.config.ts`, `src/main.tsx`, `src/app/App.tsx`

**Interfaces:**

- Produces: `vp dev/build/test/lint/fmt` 可用的工程；`src/main.tsx` 挂载 `<App/>` 到 `#root`

- [ ] **Step 1: 初始化 package.json 与基础文件**

`package.json`：

```json
{
  "name": "astryx-admin",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": { "node": ">=22.13.0" },
  "scripts": {
    "dev": "vp dev",
    "build": "vp build",
    "preview": "vp preview",
    "test": "vp test run",
    "lint": "vp lint",
    "fmt": "vp fmt"
  }
}
```

`.nvmrc`：`22`

`.gitignore`：

```text
node_modules
dist
coverage
*.local
.DS_Store
src/routeTree.gen.ts
public/mockServiceWorker.js
```

- [ ] **Step 2: 安装依赖**

```bash
pnpm add react react-dom @tanstack/react-router ky swr zustand immer
pnpm add -D vite-plus typescript @types/react @types/react-dom @vitejs/plugin-react @tanstack/router-plugin msw
```

预期：安装成功，react 为 19.x。若 vite-plus 安装后 `pnpm exec vp --help` 报错，先运行 `pnpm exec vp --help` 查看实际子命令并相应调整 scripts。

- [ ] **Step 3: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 4: vite.config.ts（最小可跑，Task 2/3 再加插件）**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 5: index.html + 入口**

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Astryx Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/app/App.tsx`（临时冒烟，Task 3 会替换为 RouterProvider）：

```tsx
export function App() {
  return <p>astryx-admin bootstrap ok</p>;
}
```

- [ ] **Step 6: 验证 dev/build**

```bash
pnpm build        # 预期：vp build 产出 dist/，无错误
pnpm exec vp dev  # 预期：dev server 启动（curl http://localhost:5173 返回 html 后 Ctrl-C）
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: vite-plus + react19 + ts 工程底座"
```

---

### Task 2: Astryx 设计系统接入

**Files:**

- Modify: `vite.config.ts`, `src/app/App.tsx`, `package.json`
- Create: `src/app/providers.tsx`

**Interfaces:**

- Produces: `<AppProviders>{children}</AppProviders>` —— 内含 Astryx `Theme`（mode 暂固定 `"system"`，Task 4 接 ui store）；全项目可 import `@astryxdesign/core/*` 组件

- [ ] **Step 1: 安装并初始化**

```bash
pnpm add @astryxdesign/core @stylexjs/stylex @astryxdesign/theme-neutral
pnpm add -D @astryxdesign/cli @astryxdesign/build
pnpm exec astryx init --all --agent claude
pnpm exec astryx doctor
```

预期：init 写入构建插件配置（postcss/vite），doctor 全绿。**若 doctor 报缺失项，按其 fix 提示逐条修复后重跑，直到全绿。** init 对 vite.config.ts 的改动以其生成结果为准（可能是 `@astryxdesign/build` 的 vite 或 postcss 插件）。

- [ ] **Step 2: providers + 冒烟渲染 Astryx 组件**

`src/app/providers.tsx`：

```tsx
import type { ReactNode } from "react";
import { Theme } from "@astryxdesign/core";
import { theme } from "@astryxdesign/theme-neutral";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Theme theme={theme} mode="system">
      {children}
    </Theme>
  );
}
```

（`@astryxdesign/theme-neutral` 的具体导出名以 `node_modules/@astryxdesign/theme-neutral/package.json` exports 与 README 为准，不对则改。）

`src/app/App.tsx` 改为：

```tsx
import { Button } from "@astryxdesign/core/Button";
import { AppProviders } from "./providers";

export function App() {
  return (
    <AppProviders>
      <Button label="astryx ok" variant="primary" />
    </AppProviders>
  );
}
```

- [ ] **Step 3: 验证**

```bash
pnpm build   # 预期成功
pnpm exec vp dev  # 浏览器/curl 确认按钮渲染（有 astryx-button 类名/属性）后停掉
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: 接入 astryx 设计系统与 neutral 主题"
```

---

### Task 3: TanStack Router 文件式路由骨架

**Files:**

- Modify: `vite.config.ts`, `src/main.tsx`
- Delete: `src/app/App.tsx`
- Create: `src/routes/__root.tsx`, `src/routes/login.tsx`, `src/routes/_auth.tsx`, `src/routes/_auth/index.tsx`, `src/routes/_auth/users.tsx`

**Interfaces:**

- Produces: 路由树 `/login`、`/`（\_auth 下 index）、`/users`；`src/routeTree.gen.ts` 自动生成；`Route.useNavigate()` 等类型可用

- [ ] **Step 1: vite 插件（router 插件必须在 react 插件之前）**

`vite.config.ts` 在 plugins 数组头部加：

```ts
import { tanstackRouter } from "@tanstack/router-plugin/vite";
// plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), ...astryx 插件保持不动]
```

- [ ] **Step 2: 根路由与页面**

`src/routes/__root.tsx`：

```tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppProviders } from "../app/providers";

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <Outlet />
    </AppProviders>
  ),
});
```

`src/routes/login.tsx`（占位，Task 7 完善）：

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@astryxdesign/core/Text";

export const Route = createFileRoute("/login")({
  component: () => <Text type="display-3">登录页占位</Text>,
});
```

`src/routes/_auth.tsx`（布局路由占位，Task 7 加守卫、Task 8 加 AppShell）：

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: () => <Outlet />,
});
```

`src/routes/_auth/index.tsx`：

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@astryxdesign/core/Text";

export const Route = createFileRoute("/_auth/")({
  component: () => <Text type="display-3">仪表盘占位</Text>,
});
```

`src/routes/_auth/users.tsx`：

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@astryxdesign/core/Text";

export const Route = createFileRoute("/_auth/users")({
  component: () => <Text type="display-3">用户管理占位</Text>,
});
```

- [ ] **Step 3: main.tsx 换 RouterProvider**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

删除 `src/app/App.tsx`。

- [ ] **Step 4: 验证 + Commit**

```bash
pnpm build   # 预期：生成 src/routeTree.gen.ts 且构建成功
git add -A && git commit -m "feat: tanstack router 文件式路由骨架"
```

---

### Task 4: 客户端状态 stores（zustand + immer）

**Files:**

- Create: `src/stores/auth.ts`, `src/stores/ui.ts`, `src/stores/auth.test.ts`, `src/stores/ui.test.ts`
- Modify: `src/app/providers.tsx`（Theme mode 接 ui store）

**Interfaces:**

- Produces:
  - `useAuthStore`: `{ token: string|null; user: AuthUser|null; login(token: string, user: AuthUser): void; logout(): void }`，`AuthUser = { id: string; name: string; email: string }`，persist key `astryx-admin-auth`
  - `useUiStore`: `{ themeMode: 'light'|'dark'|'system'; setThemeMode(m): void; isSideNavCollapsed: boolean; setSideNavCollapsed(v: boolean): void }`，persist key `astryx-admin-ui`

- [ ] **Step 1: 写失败测试**

`src/stores/auth.test.ts`：

```ts
import { beforeEach, expect, test } from "vitest";
import { useAuthStore } from "./auth";

beforeEach(() => {
  useAuthStore.getState().logout();
});

test("login 保存 token 与用户，logout 清空", () => {
  useAuthStore.getState().login("t1", { id: "1", name: "admin", email: "a@b.c" });
  expect(useAuthStore.getState().token).toBe("t1");
  expect(useAuthStore.getState().user?.name).toBe("admin");

  useAuthStore.getState().logout();
  expect(useAuthStore.getState().token).toBeNull();
  expect(useAuthStore.getState().user).toBeNull();
});
```

`src/stores/ui.test.ts`：

```ts
import { expect, test } from "vitest";
import { useUiStore } from "./ui";

test("主题模式与侧边栏折叠可更新", () => {
  useUiStore.getState().setThemeMode("dark");
  expect(useUiStore.getState().themeMode).toBe("dark");
  useUiStore.getState().setSideNavCollapsed(true);
  expect(useUiStore.getState().isSideNavCollapsed).toBe(true);
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
pnpm test
```

预期：FAIL（模块不存在）。若 vp test 因 DOM 环境报错，测试为纯 node 可忽略环境；persist 需要 localStorage —— 若报 localStorage undefined，在 vite.config.ts 加 `test: { environment: 'happy-dom' }` 并 `pnpm add -D happy-dom`。

- [ ] **Step 3: 实现**

`src/stores/auth.ts`：

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      token: null,
      user: null,
      login: (token, user) =>
        set((state) => {
          state.token = token;
          state.user = user;
        }),
      logout: () =>
        set((state) => {
          state.token = null;
          state.user = null;
        }),
    })),
    { name: "astryx-admin-auth" },
  ),
);
```

`src/stores/ui.ts`：

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type ThemeMode = "light" | "dark" | "system";

interface UiState {
  themeMode: ThemeMode;
  isSideNavCollapsed: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setSideNavCollapsed: (isCollapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    immer((set) => ({
      themeMode: "system",
      isSideNavCollapsed: false,
      setThemeMode: (mode) =>
        set((state) => {
          state.themeMode = mode;
        }),
      setSideNavCollapsed: (isCollapsed) =>
        set((state) => {
          state.isSideNavCollapsed = isCollapsed;
        }),
    })),
    { name: "astryx-admin-ui" },
  ),
);
```

- [ ] **Step 4: providers 接主题**

`src/app/providers.tsx` 中 `mode="system"` 改为：

```tsx
const themeMode = useUiStore((state) => state.themeMode);
// <Theme theme={theme} mode={themeMode}>
```

- [ ] **Step 5: 测试通过 + Commit**

```bash
pnpm test   # 预期 PASS
git add -A && git commit -m "feat: zustand+immer auth/ui stores"
```

---

### Task 5: HTTP 层（ky）与 SWR 配置

**Files:**

- Create: `src/lib/http.ts`, `src/lib/http.test.ts`, `src/lib/swr.tsx`
- Modify: `src/app/providers.tsx`

**Interfaces:**

- Consumes: `useAuthStore`（Task 4）
- Produces:
  - `http`: ky 实例，prefixUrl `/api`，自动注入 `Authorization: Bearer <token>`，401 时 `useAuthStore.getState().logout()`
  - `ApiError`: `class ApiError extends Error { status: number; code: string }`；所有非 2xx 抛 `ApiError`
  - `fetcher<T>(path: string): Promise<T>` —— SWR 全局 fetcher（path 不带前导 `/`，如 `users?page=1`）
  - `SwrProvider` 组件：包 `SWRConfig`（fetcher、onError 弹 Toast 由 Task 8 布局内的 useToast 处理，此处仅配置 fetcher 与 `shouldRetryOnError: false`）

- [ ] **Step 1: 写失败测试（msw/node 拦截）**

`src/lib/http.test.ts`：

```ts
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { HttpResponse, http as mswHttp } from "msw";
import { setupServer } from "msw/node";
import { useAuthStore } from "../stores/auth";
import { ApiError, fetcher, http } from "./http";

const server = setupServer(
  mswHttp.get("/api/ping", ({ request }) =>
    HttpResponse.json({ auth: request.headers.get("Authorization") }),
  ),
  mswHttp.get("/api/forbidden", () =>
    HttpResponse.json({ code: "FORBIDDEN", message: "无权限" }, { status: 403 }),
  ),
  mswHttp.get("/api/expired", () => HttpResponse.json({}, { status: 401 })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => useAuthStore.getState().logout());

test("自动注入 Authorization 头", async () => {
  useAuthStore.getState().login("tok", { id: "1", name: "a", email: "a@b.c" });
  const res = await fetcher<{ auth: string }>("ping");
  expect(res.auth).toBe("Bearer tok");
});

test("非 2xx 抛 ApiError（含 code/message）", async () => {
  const err = await http
    .get("forbidden")
    .json()
    .catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(403);
  expect((err as ApiError).code).toBe("FORBIDDEN");
  expect((err as ApiError).message).toBe("无权限");
});

test("401 清空登录态", async () => {
  useAuthStore.getState().login("tok", { id: "1", name: "a", email: "a@b.c" });
  await http
    .get("expired")
    .json()
    .catch(() => undefined);
  expect(useAuthStore.getState().token).toBeNull();
});
```

- [ ] **Step 2: 跑测试失败**

```bash
pnpm test src/lib/http.test.ts
```

预期：FAIL（http.ts 不存在）。注意：msw/node + ky 需要相对 URL 支持，若报 Invalid URL，测试环境改 happy-dom（其 location 为 http://localhost），或 prefixUrl 在测试中已被 msw 以 `/api/*` 匹配 —— 以实际报错调整 msw handler 为 `*/api/ping` 写法。

- [ ] **Step 3: 实现**

`src/lib/http.ts`：

```ts
import ky from "ky";
import { useAuthStore } from "../stores/auth";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const UNAUTHORIZED = 401;

export const http = ky.create({
  prefixUrl: "/api",
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        const { token } = useAuthStore.getState();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response.status === UNAUTHORIZED) {
          useAuthStore.getState().logout();
        }
        const body = (await response
          .clone()
          .json()
          .catch(() => ({}))) as { code?: string; message?: string };
        throw new ApiError(
          response.status,
          body.code ?? "UNKNOWN",
          body.message ?? `请求失败（HTTP ${response.status}）`,
        );
      },
    ],
  },
});

export function fetcher<T>(path: string): Promise<T> {
  return http.get(path).json<T>();
}
```

`src/lib/swr.tsx`：

```tsx
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { fetcher } from "./http";

export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, shouldRetryOnError: false, revalidateOnFocus: false }}>
      {children}
    </SWRConfig>
  );
}
```

`src/app/providers.tsx`：Theme 内层包 `<SwrProvider>`。

- [ ] **Step 4: 测试通过 + Commit**

```bash
pnpm test   # 预期全部 PASS
git add -A && git commit -m "feat: ky http 封装(ApiError/token/401) + swr 全局配置"
```

---

### Task 6: MSW mock 接口

**Files:**

- Create: `src/mocks/data.ts`, `src/mocks/handlers.ts`, `src/mocks/browser.ts`
- Modify: `src/main.tsx`, `package.json`（msw 配置）

**Interfaces:**

- Produces（全部挂在 `/api` 下，响应体直接为数据对象，错误为 `{ code, message }`）：
  - `POST /api/auth/login` body `{ username, password }` → `{ token: string; user: { id; name; email } }`；密码 !== `admin123` 时 401 `{ code:'BAD_CREDENTIALS', message:'用户名或密码错误' }`
  - `GET /api/dashboard/stats` → `{ userTotal: number; activeToday: number; orderTotal: number; errorCount: number }`
  - `GET /api/users?page=1&pageSize=10&keyword=` → `{ items: User[]; total: number }`
  - `POST /api/users`、`PUT /api/users/:id`、`DELETE /api/users/:id`
  - `User = { id: string; name: string; email: string; role: 'admin'|'editor'|'viewer'; isActive: boolean; createdAt: string }`

- [ ] **Step 1: mock 数据与 handlers**

`src/mocks/data.ts`：

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

`src/mocks/handlers.ts`：

```ts
import { HttpResponse, http } from "msw";
import { createSeedUsers, type MockUser } from "./data";

let users = createSeedUsers();
let nextId = users.length + 1;

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
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

  http.get("/api/dashboard/stats", () =>
    HttpResponse.json({
      userTotal: users.length,
      activeToday: users.filter((u) => u.isActive).length,
      orderTotal: 1280,
      errorCount: 3,
    }),
  ),

  http.get("/api/users", ({ request }) => {
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

  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as Omit<MockUser, "id" | "createdAt">;
    const user: MockUser = {
      ...body,
      id: String(nextId++),
      createdAt: new Date().toISOString(),
    };
    users = [user, ...users];
    return HttpResponse.json(user, { status: 201 });
  }),

  http.put("/api/users/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<MockUser>;
    const existing = users.find((u) => u.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "用户不存在" }, { status: 404 });
    }
    const updated = { ...existing, ...body, id: existing.id };
    users = users.map((u) => (u.id === existing.id ? updated : u));
    return HttpResponse.json(updated);
  }),

  http.delete("/api/users/:id", ({ params }) => {
    users = users.filter((u) => u.id !== params.id);
    return HttpResponse.json({ ok: true });
  }),
];
```

`src/mocks/browser.ts`：

```ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

- [ ] **Step 2: 生成 service worker 并在 dev 启用**

```bash
pnpm exec msw init public --save
```

`src/main.tsx` render 前加：

```tsx
async function enableMocking() {
  if (!import.meta.env.DEV) return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(/* 原内容 */);
});
```

- [ ] **Step 3: 验证 + Commit**

```bash
pnpm build && pnpm test   # 预期均绿
git add -A && git commit -m "feat: msw mock（登录/统计/用户CRUD）"
```

---

### Task 7: 登录页 + 路由守卫

**Files:**

- Create: `src/features/auth/api.ts`, `src/features/auth/LoginForm.tsx`
- Modify: `src/routes/login.tsx`, `src/routes/_auth.tsx`

**Interfaces:**

- Consumes: `http`、`ApiError`（Task 5）、`useAuthStore`（Task 4）、mock `POST /api/auth/login`（Task 6）
- Produces: `login(input: { username: string; password: string }): Promise<{ token; user }>`；`/ _auth` 下所有路由未登录自动 redirect `/login?redirect=...`，登录成功回跳

- [ ] **Step 1: auth api**

`src/features/auth/api.ts`：

```ts
import { http } from "../../lib/http";
import type { AuthUser } from "../../stores/auth";

export interface LoginInput {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export function login(input: LoginInput): Promise<LoginResult> {
  return http.post("auth/login", { json: input }).json<LoginResult>();
}
```

- [ ] **Step 2: 登录表单（纯 Astryx 组件）**

`src/features/auth/LoginForm.tsx`：

```tsx
import { useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ApiError } from "../../lib/http";
import { useAuthStore } from "../../stores/auth";
import { login } from "./api";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const saveAuth = useAuthStore((state) => state.login);

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await login({ username, password });
      saveAuth(result.token, result.user);
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "登录失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card padding={6} width={380}>
      <Stack direction="column" gap={4}>
        <Text type="display-3">Astryx Admin</Text>
        <Text type="supporting" color="secondary">
          演示账号：任意用户名 / admin123
        </Text>
        {errorMessage ? <Banner status="error">{errorMessage}</Banner> : null}
        <FormLayout direction="vertical">
          <TextInput label="用户名" value={username} changeAction={setUsername} isRequired />
          <TextInput
            label="密码"
            type="password"
            value={password}
            changeAction={setPassword}
            isRequired
          />
        </FormLayout>
        <Button
          label="登录"
          variant="primary"
          isLoading={isLoading}
          isDisabled={!username || !password}
          clickAction={handleSubmit}
        />
      </Stack>
    </Card>
  );
}
```

（`Banner`/`Stack` gap/`Card` width 等 props 若与实际不符，先 `pnpm exec astryx component Banner --dense` 查证再改。）

- [ ] **Step 3: login 路由 + 守卫**

`src/routes/login.tsx`：

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Center } from "@astryxdesign/core/Center";
import { LoginForm } from "../features/auth/LoginForm";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  return (
    <Center minHeight="100dvh">
      <LoginForm onSuccess={() => navigate({ to: redirect ?? "/" })} />
    </Center>
  );
}
```

`src/routes/_auth.tsx` 加 `beforeLoad`：

```tsx
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../stores/auth";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ location }) => {
    if (!useAuthStore.getState().token) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
```

- [ ] **Step 4: 手动验证 + Commit**

```bash
pnpm exec vp dev
# 访问 / → 跳转 /login?redirect=%2F；错误密码显示 Banner；admin123 登录回跳 /
pnpm build && pnpm test
git add -A && git commit -m "feat: 登录页与路由守卫闭环"
```

---

### Task 8: AppShell 布局（SideNav + TopNav + 主题切换 + 用户菜单）

**Files:**

- Create: `src/components/layout/AdminShell.tsx`, `src/components/layout/ThemeModeButton.tsx`, `src/components/layout/UserMenu.tsx`
- Modify: `src/routes/_auth.tsx`, `src/app/providers.tsx`（LinkProvider）

**Interfaces:**

- Consumes: `useUiStore`、`useAuthStore`、TanStack `Link`/`useNavigate`、`useRouterState`
- Produces: `<AdminShell>{children}</AdminShell>` —— AppShell + 可折叠 SideNav（仪表盘/用户管理两项，当前路由高亮）+ TopNav（右侧主题切换、用户头像菜单含退出登录）

- [ ] **Step 1: LinkProvider 接管路由跳转**

`src/app/providers.tsx`：用 `LinkProvider` 把 Astryx 所有 `href` 跳转交给 TanStack Router：

```tsx
import { LinkProvider } from "@astryxdesign/core/Link";
import { createLink } from "@tanstack/react-router";
// 查证用法：pnpm exec astryx component LinkProvider --dense --detail full
// LinkProvider 需要一个 LinkComponentType；用 forwardRef 包 TanStack Link，href → to
```

具体实现（如 LinkProvider 的 component 签名不符，以查证结果为准）：

```tsx
import { forwardRef, type ComponentProps } from "react";
import { Link as RouterLink } from "@tanstack/react-router";

const AppLink = forwardRef<HTMLAnchorElement, ComponentProps<"a"> & { href: string }>(
  function AppLink({ href, children, ...rest }, ref) {
    return (
      <RouterLink to={href} ref={ref} {...rest}>
        {children}
      </RouterLink>
    );
  },
);
// <Theme ...><LinkProvider component={AppLink}><SwrProvider>...
```

- [ ] **Step 2: 主题切换按钮**

`src/components/layout/ThemeModeButton.tsx`：

```tsx
import { IconButton } from "@astryxdesign/core/IconButton";
import { useUiStore } from "../../stores/ui";

const NEXT_MODE = { light: "dark", dark: "system", system: "light" } as const;
const MODE_LABEL = { light: "亮色", dark: "暗色", system: "跟随系统" } as const;

export function ThemeModeButton() {
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);
  return (
    <IconButton
      label={`主题：${MODE_LABEL[themeMode]}（点击切换）`}
      clickAction={() => setThemeMode(NEXT_MODE[themeMode])}
      icon={/* 用 astryx Icon：pnpm exec astryx component Icon --dense 查图标用法，选 sun/moon/monitor */}
    />
  );
}
```

（IconButton 的 icon prop 形态先查证；Astryx 基于 lucide 图标。）

- [ ] **Step 3: 用户菜单**

`src/components/layout/UserMenu.tsx`：

```tsx
import { Avatar } from "@astryxdesign/core/Avatar";
import { DropdownMenu, DropdownMenuItem } from "@astryxdesign/core/DropdownMenu";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/auth";

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return (
    <DropdownMenu trigger={<Avatar name={user?.name ?? "?"} size="sm" />}>
      <DropdownMenuItem
        label="退出登录"
        onClick={() => {
          logout();
          navigate({ to: "/login" });
        }}
      />
    </DropdownMenu>
  );
}
```

（DropdownMenu trigger/onClick 具体 props 先查证。）

- [ ] **Step 4: AdminShell**

`src/components/layout/AdminShell.tsx`：

```tsx
import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { Stack } from "@astryxdesign/core/Stack";
import { useRouterState } from "@tanstack/react-router";
import { useUiStore } from "../../stores/ui";
import { ThemeModeButton } from "./ThemeModeButton";
import { UserMenu } from "./UserMenu";

const NAV_ITEMS = [
  { label: "仪表盘", href: "/" },
  { label: "用户管理", href: "/users" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isSideNavCollapsed = useUiStore((state) => state.isSideNavCollapsed);
  const setSideNavCollapsed = useUiStore((state) => state.setSideNavCollapsed);

  return (
    <AppShell
      contentPadding={4}
      topNav={
        <TopNav
          heading={<TopNavHeading label="Astryx Admin" />}
          endContent={
            <Stack direction="row" gap={2}>
              <ThemeModeButton />
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
          {NAV_ITEMS.map((item) => (
            <SideNavItem
              key={item.href}
              label={item.label}
              href={item.href}
              isSelected={pathname === item.href}
            />
          ))}
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
```

`src/routes/_auth.tsx` component 改为 `() => <AdminShell><Outlet /></AdminShell>`。

- [ ] **Step 5: 验证 + Commit**

```bash
pnpm exec vp dev  # 登录后看到侧边栏+顶栏；折叠状态刷新保留；主题切换生效；退出登录回 /login
pnpm build && pnpm test
git add -A && git commit -m "feat: AppShell 管理布局（SideNav/TopNav/主题/用户菜单）"
```

---

### Task 9: 仪表盘

**Files:**

- Create: `src/features/dashboard/useDashboardStats.ts`, `src/features/dashboard/StatCards.tsx`
- Modify: `src/routes/_auth/index.tsx`

**Interfaces:**

- Consumes: SWR 全局 fetcher、mock `GET /api/dashboard/stats`
- Produces: `useDashboardStats(): { stats?: DashboardStats; isLoading: boolean }`，`DashboardStats = { userTotal; activeToday; orderTotal; errorCount }`

- [ ] **Step 1: hook**

`src/features/dashboard/useDashboardStats.ts`：

```ts
import useSWR from "swr";

export interface DashboardStats {
  userTotal: number;
  activeToday: number;
  orderTotal: number;
  errorCount: number;
}

export function useDashboardStats() {
  const { data, isLoading } = useSWR<DashboardStats>("dashboard/stats");
  return { stats: data, isLoading };
}
```

- [ ] **Step 2: 统计卡片（Grid + Card + Text + Skeleton）**

`src/features/dashboard/StatCards.tsx`：

```tsx
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useDashboardStats, type DashboardStats } from "./useDashboardStats";

const CARDS: {
  key: keyof DashboardStats;
  title: string;
  variant: "blue" | "green" | "purple" | "red";
}[] = [
  { key: "userTotal", title: "用户总数", variant: "blue" },
  { key: "activeToday", title: "今日活跃", variant: "green" },
  { key: "orderTotal", title: "订单总数", variant: "purple" },
  { key: "errorCount", title: "今日告警", variant: "red" },
];

export function StatCards() {
  const { stats, isLoading } = useDashboardStats();
  return (
    <Grid columns={4} gap={4}>
      {CARDS.map((card) => (
        <Card key={card.key} padding={4} variant={card.variant}>
          <Stack direction="column" gap={2}>
            <Text type="supporting" color="secondary">
              {card.title}
            </Text>
            {isLoading || !stats ? (
              <Skeleton />
            ) : (
              <Text type="display-2" hasTabularNumbers>
                {stats[card.key]}
              </Text>
            )}
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
```

（Grid columns/gap props 先查证 `astryx component Grid --dense`；不支持则用响应式写法。）

`src/routes/_auth/index.tsx`：

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { StatCards } from "../../features/dashboard/StatCards";

export const Route = createFileRoute("/_auth/")({
  component: () => (
    <Section>
      <Stack direction="column" gap={4}>
        <Text type="display-3">仪表盘</Text>
        <StatCards />
      </Stack>
    </Section>
  ),
});
```

- [ ] **Step 3: 验证 + Commit**

```bash
pnpm exec vp dev  # 4 张统计卡片渲染 mock 数据
pnpm build && pnpm test
git add -A && git commit -m "feat: 仪表盘统计卡片"
```

---

### Task 10: 用户管理 CRUD

**Files:**

- Create: `src/features/users/types.ts`, `src/features/users/api.ts`, `src/features/users/useUsers.ts`, `src/features/users/UserTable.tsx`, `src/features/users/UserFormDialog.tsx`, `src/features/users/api.test.ts`
- Modify: `src/routes/_auth/users.tsx`

**Interfaces:**

- Consumes: `http`、SWR、mock users 接口（Task 6）、Toast（`@astryxdesign/core/Toast` 的 useToast，用法先 `pnpm exec astryx hook useToast` 查证）
- Produces:
  - `User`/`UserInput` 类型（与 Task 6 mock 一致）
  - `useUsers(params: { page: number; pageSize: number; keyword: string })` → `{ users: User[]; total: number; isLoading: boolean; refresh(): Promise<unknown> }`
  - `createUser(input: UserInput)` / `updateUser(id: string, input: UserInput)` / `deleteUser(id: string)`

- [ ] **Step 1: 类型与 api + 失败测试**

`src/features/users/types.ts`：

```ts
export type UserRole = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type UserInput = Omit<User, "id" | "createdAt">;

export interface UserListParams {
  page: number;
  pageSize: number;
  keyword: string;
}

export interface UserListResult {
  items: User[];
  total: number;
}
```

`src/features/users/api.test.ts`（msw/node，复用 `src/mocks/handlers.ts`）：

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { createUser, deleteUser, fetchUsers, updateUser } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

test("用户 CRUD 全链路", async () => {
  const created = await createUser({
    name: "测试用户",
    email: "t@example.com",
    role: "viewer",
    isActive: true,
  });
  expect(created.id).toBeTruthy();

  const updated = await updateUser(created.id, { ...created, name: "改名" });
  expect(updated.name).toBe("改名");

  const list = await fetchUsers({ page: 1, pageSize: 10, keyword: "改名" });
  expect(list.total).toBe(1);

  await deleteUser(created.id);
  const after = await fetchUsers({ page: 1, pageSize: 10, keyword: "改名" });
  expect(after.total).toBe(0);
});
```

- [ ] **Step 2: 跑测试失败，然后实现 api**

`src/features/users/api.ts`：

```ts
import { http } from "../../lib/http";
import type { User, UserInput, UserListParams, UserListResult } from "./types";

export function usersKey(params: UserListParams): string {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    keyword: params.keyword,
  });
  return `users?${search.toString()}`;
}

export function fetchUsers(params: UserListParams): Promise<UserListResult> {
  return http.get(usersKey(params)).json<UserListResult>();
}

export function createUser(input: UserInput): Promise<User> {
  return http.post("users", { json: input }).json<User>();
}

export function updateUser(id: string, input: UserInput): Promise<User> {
  return http.put(`users/${id}`, { json: input }).json<User>();
}

export function deleteUser(id: string): Promise<void> {
  return http.delete(`users/${id}`).json();
}
```

```bash
pnpm test src/features/users/api.test.ts   # 预期 PASS
```

- [ ] **Step 3: useUsers hook**

`src/features/users/useUsers.ts`：

```ts
import useSWR from "swr";
import { usersKey } from "./api";
import type { UserListParams, UserListResult } from "./types";

export function useUsers(params: UserListParams) {
  const { data, isLoading, mutate } = useSWR<UserListResult>(usersKey(params));
  return {
    users: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    refresh: mutate,
  };
}
```

- [ ] **Step 4: 表单 Dialog（新建/编辑共用）**

`src/features/users/UserFormDialog.tsx`：

```tsx
import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Selector } from "@astryxdesign/core/Selector";
import { Stack } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { TextInput } from "@astryxdesign/core/TextInput";
import type { User, UserInput, UserRole } from "./types";

const ROLE_OPTIONS = [
  { label: "管理员", value: "admin" },
  { label: "编辑", value: "editor" },
  { label: "访客", value: "viewer" },
];

const EMPTY: UserInput = { name: "", email: "", role: "viewer", isActive: true };

interface UserFormDialogProps {
  isOpen: boolean;
  editingUser: User | null;
  isSubmitting: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (input: UserInput) => void;
}

export function UserFormDialog({
  isOpen,
  editingUser,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const [form, setForm] = useState<UserInput>(EMPTY);

  useEffect(() => {
    if (isOpen) {
      setForm(
        editingUser
          ? {
              name: editingUser.name,
              email: editingUser.email,
              role: editingUser.role,
              isActive: editingUser.isActive,
            }
          : EMPTY,
      );
    }
  }, [isOpen, editingUser]);

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
      <DialogHeader title={editingUser ? "编辑用户" : "新建用户"} />
      <Stack direction="column" gap={4}>
        <FormLayout direction="vertical">
          <TextInput
            label="姓名"
            value={form.name}
            changeAction={(name) => setForm((f) => ({ ...f, name }))}
            isRequired
          />
          <TextInput
            label="邮箱"
            type="email"
            value={form.email}
            changeAction={(email) => setForm((f) => ({ ...f, email }))}
            isRequired
          />
          <Selector
            label="角色"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(role) => setForm((f) => ({ ...f, role: role as UserRole }))}
          />
          <Switch
            label="启用"
            isChecked={form.isActive}
            onChange={(isActive) => setForm((f) => ({ ...f, isActive }))}
          />
        </FormLayout>
        <Stack direction="row" gap={2} justify="end">
          <Button label="取消" variant="secondary" clickAction={() => onOpenChange(false)} />
          <Button
            label={editingUser ? "保存" : "创建"}
            variant="primary"
            isLoading={isSubmitting}
            isDisabled={!form.name || !form.email}
            clickAction={() => onSubmit(form)}
          />
        </Stack>
      </Stack>
    </Dialog>
  );
}
```

（Dialog/DialogHeader/Switch/Selector 具体 props 用 astryx CLI 查证后修正；Stack 的 justify 若不存在改用其他排列方式或 Toolbar。）

- [ ] **Step 5: 列表页（Table + Toolbar + Pagination + EmptyState + AlertDialog + Toast）**

`src/features/users/UserTable.tsx`：

```tsx
import { useState } from "react";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Pagination } from "@astryxdesign/core/Pagination";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Stack } from "@astryxdesign/core/Stack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Table } from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Timestamp } from "@astryxdesign/core/Timestamp";
import { Toolbar } from "@astryxdesign/core/Toolbar";
import { ApiError } from "../../lib/http";
import { createUser, deleteUser, updateUser } from "./api";
import { useUsers } from "./useUsers";
import { UserFormDialog } from "./UserFormDialog";
import type { User, UserInput } from "./types";

const PAGE_SIZE = 10;
const ROLE_LABEL = { admin: "管理员", editor: "编辑", viewer: "访客" } as const;

export function UserTable() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const { users, total, isLoading, refresh } = useUsers({ page, pageSize: PAGE_SIZE, keyword });
  // Toast：用法以 `pnpm exec astryx hook useToast` 查证结果为准
  // const { showToast } = useToast();

  const notify = (message: string, type: "info" | "error" = "info") => {
    // showToast({ body: message, type });
  };

  const handleSubmit = async (input: UserInput) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, input);
        notify("用户已更新");
      } else {
        await createUser(input);
        notify("用户已创建");
      }
      setFormOpen(false);
      await refresh();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "操作失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      notify("用户已删除");
      setDeletingUser(null);
      await refresh();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "删除失败", "error");
    }
  };

  return (
    <Stack direction="column" gap={4}>
      <Toolbar>
        <TextInput
          label="搜索"
          isLabelHidden
          placeholder="按姓名或邮箱搜索"
          value={keyword}
          hasClear
          changeAction={(value) => {
            setKeyword(value);
            setPage(1);
          }}
        />
        <Button
          label="新建用户"
          variant="primary"
          clickAction={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
        />
      </Toolbar>

      {isLoading ? (
        <Skeleton />
      ) : users.length === 0 ? (
        <EmptyState title="暂无用户" description="调整搜索条件或新建用户" />
      ) : (
        <Table<User & Record<string, unknown>>
          data={users}
          idKey="id"
          hasHover
          columns={[
            { key: "name", header: "姓名" },
            { key: "email", header: "邮箱" },
            {
              key: "role",
              header: "角色",
              renderCell: (user) => <Badge label={ROLE_LABEL[user.role]} />,
            },
            {
              key: "isActive",
              header: "状态",
              renderCell: (user) => (
                <StatusDot
                  status={user.isActive ? "success" : "inactive"}
                  label={user.isActive ? "启用" : "停用"}
                />
              ),
            },
            {
              key: "createdAt",
              header: "创建时间",
              renderCell: (user) => <Timestamp value={user.createdAt} />,
            },
            {
              key: "actions",
              header: "操作",
              renderCell: (user) => (
                <Stack direction="row" gap={2}>
                  <Button
                    label="编辑"
                    variant="ghost"
                    size="sm"
                    clickAction={() => {
                      setEditingUser(user);
                      setFormOpen(true);
                    }}
                  />
                  <Button
                    label="删除"
                    variant="destructive"
                    size="sm"
                    clickAction={() => setDeletingUser(user)}
                  />
                </Stack>
              ),
            },
          ]}
        />
      )}

      <Pagination
        page={page}
        totalItems={total}
        pageSize={PAGE_SIZE}
        changeAction={setPage}
        variant="pages"
      />

      <UserFormDialog
        isOpen={isFormOpen}
        editingUser={editingUser}
        isSubmitting={isSubmitting}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        isOpen={deletingUser !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingUser(null);
        }}
        title="删除用户"
        description={`确定删除「${deletingUser?.name ?? ""}」吗？此操作不可撤销。`}
        actionLabel="删除"
        actionVariant="destructive"
        cancelLabel="取消"
        onAction={handleDelete}
      />
    </Stack>
  );
}
```

（Badge/StatusDot/Timestamp/Toolbar/EmptyState props 逐个查证修正；Toast 接好后替换 notify 注释。）

`src/routes/_auth/users.tsx`：

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@astryxdesign/core/Section";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { UserTable } from "../../features/users/UserTable";

export const Route = createFileRoute("/_auth/users")({
  component: () => (
    <Section>
      <Stack direction="column" gap={4}>
        <Text type="display-3">用户管理</Text>
        <UserTable />
      </Stack>
    </Section>
  ),
});
```

- [ ] **Step 6: 验证 + Commit**

```bash
pnpm exec vp dev  # 列表分页/搜索/新建/编辑/删除全链路 + Toast 反馈
pnpm build && pnpm test
git add -A && git commit -m "feat: 用户管理 CRUD 示例（Table/Dialog/AlertDialog/Toast）"
```

---

### Task 11: 收尾验证与 README

**Files:**

- Create: `README.md`

- [ ] **Step 1: 全量检查**

```bash
pnpm fmt && pnpm lint && pnpm test && pnpm build
```

预期全绿；lint/fmt 产生的改动一并提交。

- [ ] **Step 2: README（技术栈、命令、目录结构、mock 账号说明）+ Commit**

```bash
git add -A && git commit -m "docs: README 与收尾"
```

## Self-Review 记录

- Spec 覆盖：登录/守卫(T7)、AppShell(T8)、仪表盘(T9)、CRUD(T10)、ky/SWR(T5)、stores(T4)、MSW(T6)、主题切换(T4/T8)、测试(T4/T5/T10)、vp 工具链(T1/T11) —— 全覆盖
- 类型一致性：`AuthUser`/`User`/`UserInput`/`usersKey` 跨任务签名已对齐；mock `MockUser` 与 `User` 字段一致
- 已知不确定点（非占位，是执行时校准点）：astryx init 对 vite.config 的具体改动、个别组件 props（Banner/Grid/Switch/DropdownMenu/Toast 等）—— 计划中均给出查证命令，以 CLI 文档为准修正
