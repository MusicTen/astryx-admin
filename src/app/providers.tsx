import { useEffect, forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { Theme } from "@astryxdesign/core";
import { LinkProvider } from "@astryxdesign/core/Link";
import { Link as RouterLink } from "@tanstack/react-router";
import i18n from "i18next";
import { SwrProvider } from "../lib/swr";
import { useUiStore } from "../stores/ui";
import { astryxAdminTheme } from "../theme/astryx-admin";
import "../theme/astryx-admin.css";

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
  const language = useUiStore((state) => state.language);

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  return (
    <Theme theme={astryxAdminTheme} mode={themeMode}>
      <LinkProvider component={AppLink}>
        <SwrProvider>{children}</SwrProvider>
      </LinkProvider>
    </Theme>
  );
}
