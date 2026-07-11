export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export interface ActiveUsersPoint {
  date: string;
  count: number;
}

export interface DashboardTrend {
  revenue: RevenueTrendPoint[];
  activeUsers: ActiveUsersPoint[];
}

export interface RecentEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}
