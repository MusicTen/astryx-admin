import useSWR from "swr";

export interface DashboardStats {
  userTotal: number;
  activeToday: number;
  orderTotal: number;
  errorCount: number;
}

export function useDashboardStats() {
  const { data, isLoading } = useSWR<DashboardStats>("dashboard/stats");
  return { stats: data, isLoading };
}
