export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export interface ActiveUsersPoint {
  date: string;
  count: number;
}

export interface RecentEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
}

export function createRevenueTrend(): RevenueTrendPoint[] {
  const base = 82000;
  return Array.from({ length: 12 }, (_, index) => ({
    month: `2025-${String(index + 1).padStart(2, "0")}`,
    revenue: base + index * 3200 + (index % 3 === 0 ? 1500 : -800),
  }));
}

export function createActiveUsersTrend(): ActiveUsersPoint[] {
  const base = 1200;
  return Array.from({ length: 30 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 5, 1 + index)).toISOString().slice(0, 10),
    count: base + Math.round(Math.sin(index / 4) * 120) + index * 6,
  }));
}

const EVENT_ACTIONS = ["创建了任务", "连接了应用", "更新了资料", "邀请了成员"] as const;

export function createRecentEvents(count = 8): RecentEvent[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    actor: `用户${String((index % 43) + 1).padStart(2, "0")}`,
    action: EVENT_ACTIONS[index % EVENT_ACTIONS.length],
    target: `工作项 #${1000 + index}`,
    createdAt: new Date(Date.UTC(2026, 6, 8, 12 - index)).toISOString(),
  }));
}
