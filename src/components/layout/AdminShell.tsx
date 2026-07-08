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
