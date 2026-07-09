import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { fetchDashboardTrend, fetchRecentEvents } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

test("获取仪表盘趋势数据", async () => {
  const trend = await fetchDashboardTrend();
  expect(trend.revenue).toHaveLength(12);
  expect(trend.activeUsers).toHaveLength(30);
});

test("获取最近活动事件", async () => {
  const events = await fetchRecentEvents();
  expect(events.items.length).toBeGreaterThan(0);
  expect(events.items[0]).toHaveProperty("actor");
});
