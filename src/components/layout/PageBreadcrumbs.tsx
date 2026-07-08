import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";

const BREADCRUMB_LABELS: Record<string, string[]> = {
  "/users": ["用户管理"],
  "/settings/profile": ["系统设置", "个人资料"],
  "/settings/appearance": ["系统设置", "外观"],
};

export function getBreadcrumbLabels(pathname: string): string[] {
  return BREADCRUMB_LABELS[pathname] ?? [];
}

export function PageBreadcrumbs({ pathname }: { pathname: string }) {
  const labels = getBreadcrumbLabels(pathname);
  if (labels.length === 0) {
    return null;
  }

  return (
    <Breadcrumbs variant="supporting">
      {labels.map((label, index) => (
        <BreadcrumbItem key={label} isCurrent={index === labels.length - 1}>
          {label}
        </BreadcrumbItem>
      ))}
    </Breadcrumbs>
  );
}
