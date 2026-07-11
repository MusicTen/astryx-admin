# Astryx Admin

English | [中文](./README.md)

An admin dashboard skeleton built on a modern frontend stack, with Chinese/English i18n and light/dark theming built in.

## Features

- **Login**: form validation + persisted token, route guard blocks unauthenticated access
- **Dashboard**: stat cards, revenue trend chart, recent sales list
- **Task Board**: kanban columns grouped by status, with task CRUD and status transitions
- **Users**: full CRUD example — search/filter, pagination, single & batch delete, create/edit dialogs
- **Integrations**: app gallery filterable by category
- **Settings**: profile and appearance (theme mode + language)
- **i18n**: Chinese/English, detected from browser language on first visit and persisted after switching; one-click icon toggle in the top nav
- **Theming**: light / dark / system tri-state, icon toggle in the top nav

## Tech Stack

| Layer        | Choice                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Package mgmt | pnpm (Node ≥ 22.13, see `.nvmrc`)                                                                                |
| Toolchain    | [vite-plus](https://www.npmjs.com/package/vite-plus) (unified `vp` commands: Vite 8 + Vitest 4 + Oxlint + Oxfmt) |
| Framework    | React 19 + TypeScript strict                                                                                     |
| UI           | [@astryxdesign/core](https://www.npmjs.com/package/@astryxdesign/core) (StyleX) + neutral theme, light/dark built in |
| Routing      | TanStack Router (file-based, type-safe)                                                                          |
| i18n         | i18next + react-i18next (`src/i18n/`, zh/en resources; language state lives in the ui store and is persisted)    |
| HTTP         | ky (`src/lib/http.ts` wrapper: token injection / 401 handling / ApiError normalization)                          |
| Server state | SWR (global fetcher goes through ky)                                                                             |
| Client state | zustand + immer (`src/stores/`, persisted)                                                                       |
| Mocking      | MSW (enabled automatically in development)                                                                       |

## Getting Started

```bash
nvm use            # Node 22
pnpm install
pnpm dev           # http://localhost:5173
```

Demo login: **any username / admin123** (served by the MSW mock).

## Commands

```bash
pnpm dev       # dev server
pnpm build     # production build
pnpm preview   # preview the build output
pnpm test      # run Vitest unit tests
pnpm lint      # Oxlint
pnpm fmt       # Oxfmt
```

Astryx component docs (check props before writing UI):

```bash
pnpm exec astryx component <Name> --dense --detail compact
pnpm exec astryx search <query>
```

## Project Structure

```text
src/
├─ app/                 # AppProviders (Theme/LinkProvider/SWR/i18n init & sync)
├─ routes/              # TanStack Router file-based routes
│  ├─ __root.tsx        # root route (mounts providers)
│  ├─ login.tsx         # login page
│  └─ _auth/            # authenticated layout route (guard + AppShell)
│     ├─ index.tsx      # dashboard
│     ├─ tasks.tsx      # task board
│     ├─ apps.tsx       # integrations
│     ├─ users.tsx      # user management (CRUD example)
│     └─ settings/      # settings (profile / appearance)
├─ features/            # organized by business domain
│  ├─ auth/             # login form + api
│  ├─ dashboard/        # stat cards / trend chart / recent sales + hooks
│  ├─ tasks/            # board / task card / form dialog / grouping logic
│  ├─ apps/             # integration gallery + category filter
│  ├─ users/            # types / api / useUsers / table / form dialog
│  └─ settings/         # profile card, appearance card
├─ components/layout/   # AdminShell (grouped + nested SideNav + TopNav + breadcrumbs), language/theme toggles, user menu
├─ i18n/                # i18next init, language detection, locales/{zh,en}.json resources
├─ theme/               # defineTheme extending the neutral theme
├─ lib/                 # http.ts (ky), swr.tsx (SWRConfig)
├─ stores/              # auth.ts, ui.ts (zustand + immer + persist: theme/language/sidebar)
└─ mocks/               # MSW (data/ in-memory sources + handlers/ split by domain)
```

## Conventions

- **Always prefer Astryx components** (`Stack`/`Grid`/`Section` for layout, `Text` for typography); fall back to StyleX `xstyle` only when no component fits, with a comment explaining why
- **All user-facing copy goes through `t()`**: when adding copy, update both `locales/zh.json` and `locales/en.json` (key structure kept in sync, enforced by a unit test); business data values (e.g. category enums) keep their raw value and are translated at the display layer only
- Server state lives in SWR only; client state lives in zustand stores; never copy one into the other
- New API: define the request function in `features/<domain>/api.ts` + add a mock in `src/mocks/handlers/`
- New page: just add a file under `src/routes/` (`routeTree.gen.ts` is generated at build time)
- Sidebar icons use `lucide-react` exclusively (natively compatible with Astryx's `icon: ComponentType<SVGProps>`; iconify was skipped to avoid an adapter layer)

## Engineering Decisions

- `vite` is installed explicitly as a devDependency: the plugin ecosystem (router-plugin, plugin-react, vitest) peer-depends on it for type and runtime resolution; day-to-day commands still go through `vp`
- `vite.config.ts` aliases two Astryx CSS subpaths: rolldown mis-resolves CSS exports that carry a `types` condition, so they point straight at the dist files
- msw's postinstall script is allowed via the `allowBuilds` field in `pnpm-workspace.yaml`
- Breadcrumbs use a static pathname map (`PageBreadcrumbs.tsx`) instead of a generic path parser: the route count is small, and a generic parser would be over-engineering
- The top-nav language/theme toggles reuse the same components as the settings page (an `isIconOnly` prop switches between icon and text form), so the state logic can't drift between the two
