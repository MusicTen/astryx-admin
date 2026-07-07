import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
import { Stack } from "@astryxdesign/core/Stack";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { useRouterState } from "@tanstack/react-router";
import { useUiStore } from "../../stores/ui";
import { ThemeModeControl } from "./ThemeModeControl";
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
          heading={<TopNavHeading heading="Astryx Admin" headingHref="/" />}
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
