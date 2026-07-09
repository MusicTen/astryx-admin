import useSWR from "swr";
import type { DashboardTrend } from "./types";

export function useDashboardTrend() {
  const { data, isLoading } = useSWR<DashboardTrend>("dashboard/trend");
  return { trend: data, isLoading };
}
