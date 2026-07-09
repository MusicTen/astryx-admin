import { HttpResponse, http } from "msw";
import { createActiveUsersTrend, createRecentEvents, createRevenueTrend } from "../data/dashboard";
import { users } from "./users";

export const dashboardHandlers = [
  http.get("*/api/dashboard/stats", () =>
    HttpResponse.json({
      userTotal: users.length,
      activeToday: users.filter((u) => u.isActive).length,
      orderTotal: 1280,
      errorCount: 3,
    }),
  ),

  http.get("*/api/dashboard/trend", () =>
    HttpResponse.json({
      revenue: createRevenueTrend(),
      activeUsers: createActiveUsersTrend(),
    }),
  ),

  http.get("*/api/dashboard/events", () => HttpResponse.json({ items: createRecentEvents() })),
];
