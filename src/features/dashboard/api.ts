import type { PageResult } from "../../lib/api";
import { http } from "../../lib/http";
import type { DashboardTrend, RecentEvent } from "./types";

export function fetchDashboardTrend(): Promise<DashboardTrend> {
  return http.get("dashboard/trend").json<DashboardTrend>();
}

export function fetchRecentEvents(): Promise<PageResult<RecentEvent>> {
  return http.get("dashboard/events").json<PageResult<RecentEvent>>();
}
