import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { Stack } from "@astryxdesign/core/Stack";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { useRouterState } from "@tanstack/react-router";
import { Blocks, KanbanSquare, LayoutDashboard, Settings, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/ui";
import "./admin-shell.css";
import { LanguageControl } from "./LanguageControl";
import { PageBreadcrumbs } from "./PageBreadcrumbs";
import { ThemeModeControl } from "./ThemeModeControl";
import { UserMenu } from "./UserMenu";

export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
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
              <LanguageControl isIconOnly />
              <ThemeModeControl isIconOnly />
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
          <SideNavSection title={t("nav.sectionOverview")}>
            <SideNavItem
              label={t("nav.dashboard")}
              href="/"
              icon={LayoutDashboard}
              selectedIcon={LayoutDashboard}
              isSelected={pathname === "/"}
            />
          </SideNavSection>
          <SideNavSection title={t("nav.sectionWork")}>
            <SideNavItem
              label={t("nav.tasks")}
              href="/tasks"
              icon={KanbanSquare}
              selectedIcon={KanbanSquare}
              isSelected={pathname === "/tasks"}
            />
            <SideNavItem
              label={t("nav.apps")}
              href="/apps"
              icon={Blocks}
              selectedIcon={Blocks}
              isSelected={pathname === "/apps"}
            />
          </SideNavSection>
          <SideNavSection title={t("nav.sectionManagement")}>
            <SideNavItem
              label={t("nav.users")}
              href="/users"
              icon={Users}
              selectedIcon={Users}
              isSelected={pathname === "/users"}
            />
            <SideNavItem
              label={t("nav.settings")}
              href="/settings"
              icon={Settings}
              selectedIcon={Settings}
              isSelected={pathname.startsWith("/settings")}
            />
          </SideNavSection>
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
