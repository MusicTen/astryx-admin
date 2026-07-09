import { http } from "../../lib/http";
import type { DashboardTrend, RecentEventsResult } from "./types";

export function fetchDashboardTrend(): Promise<DashboardTrend> {
  return http.get("dashboard/trend").json<DashboardTrend>();
}

export function fetchRecentEvents(): Promise<RecentEventsResult> {
  return http.get("dashboard/events").json<RecentEventsResult>();
}
