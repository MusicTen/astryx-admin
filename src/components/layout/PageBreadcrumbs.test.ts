import { describe, expect, it } from "vitest";
import { getBreadcrumbLabels } from "./PageBreadcrumbs";

describe("getBreadcrumbLabels", () => {
  it("returns an empty array for the dashboard root route", () => {
    expect(getBreadcrumbLabels("/")).toEqual([]);
  });

  it("returns a single label key for a top-level route", () => {
    expect(getBreadcrumbLabels("/users")).toEqual(["nav.users"]);
  });

  it("returns a two-level trail for nested settings routes", () => {
    expect(getBreadcrumbLabels("/settings/appearance")).toEqual(["nav.settings", "nav.appearance"]);
    expect(getBreadcrumbLabels("/settings/profile")).toEqual(["nav.settings", "nav.profile"]);
  });

  it("falls back to an empty array for unknown routes", () => {
    expect(getBreadcrumbLabels("/unknown")).toEqual([]);
  });
});
