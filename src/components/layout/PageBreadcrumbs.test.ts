import { describe, expect, it } from "vitest";
import { getBreadcrumbLabels } from "./PageBreadcrumbs";

describe("getBreadcrumbLabels", () => {
  it("returns an empty array for the dashboard root route", () => {
    expect(getBreadcrumbLabels("/")).toEqual([]);
  });

  it("returns a single label for a top-level route", () => {
    expect(getBreadcrumbLabels("/users")).toEqual(["用户管理"]);
  });

  it("returns a two-level trail for nested settings routes", () => {
    expect(getBreadcrumbLabels("/settings/appearance")).toEqual(["系统设置", "外观"]);
    expect(getBreadcrumbLabels("/settings/profile")).toEqual(["系统设置", "个人资料"]);
  });

  it("falls back to an empty array for unknown routes", () => {
    expect(getBreadcrumbLabels("/unknown")).toEqual([]);
  });
});
