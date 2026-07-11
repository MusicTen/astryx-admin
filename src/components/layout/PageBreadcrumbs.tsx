import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { useTranslation } from "react-i18next";

const BREADCRUMB_KEYS: Record<string, string[]> = {
  "/users": ["nav.users"],
  "/settings/profile": ["nav.settings", "nav.profile"],
  "/settings/appearance": ["nav.settings", "nav.appearance"],
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
