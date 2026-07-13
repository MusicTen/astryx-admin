import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { useTranslation } from "react-i18next";

const SETTINGS_PAGES = ["profile", "account", "appearance", "notifications", "display"] as const;

const BREADCRUMB_KEYS: Record<string, string[]> = {
  "/users": ["nav.users"],
  ...Object.fromEntries(
    SETTINGS_PAGES.map((page) => [`/settings/${page}`, ["nav.settings", `settings.nav.${page}`]]),
  ),
};

export function getBreadcrumbLabels(pathname: string): string[] {
  return BREADCRUMB_KEYS[pathname] ?? [];
}

export function PageBreadcrumbs({ pathname }: { pathname: string }) {
  const { t } = useTranslation();
  const keys = getBreadcrumbLabels(pathname);
  if (keys.length === 0) {
    return null;
  }

  return (
    <Breadcrumbs variant="supporting">
      {keys.map((key, index) => (
        <BreadcrumbItem key={key} isCurrent={index === keys.length - 1}>
          {t(key)}
        </BreadcrumbItem>
      ))}
    </Breadcrumbs>
  );
}
