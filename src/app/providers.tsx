import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Theme } from "@astryxdesign/core";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Link as RouterLink } from "@tanstack/react-router";
import { SwrProvider } from "../lib/swr";
import { useUiStore } from "../stores/ui";
import { appTheme } from "../theme/appTheme";

const AppLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(function AppLink(
  { href, children, ...rest },
  ref,
) {
  return (
    <RouterLink to={href ?? "/"} ref={ref} {...rest}>
      {children}
    </RouterLink>
  );
});

export function AppProviders({ children }: { children: ReactNode }) {
  const themeMode = useUiStore((state) => state.themeMode);
  return (
    <Theme theme={appTheme} mode={themeMode}>
      <LinkProvider component={AppLink}>
        <SwrProvider>{children}</SwrProvider>
      </LinkProvider>
    </Theme>
  );
}
