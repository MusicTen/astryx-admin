import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { resetTasks } from "../../mocks/handlers/tasks";
import { createTask, deleteTask, fetchTasks, updateTask } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetTasks();
});
afterAll(() => server.close());

test("任务 CRUD 全链路", async () => {
  const created = await createTask({
    title: "测试任务",
    status: "backlog",
    priority: "medium",
    assigneeId: "1",
    labels: ["bug"],
  });
  expect(created.id).toBeTruthy();
  expect(created.status).toBe("backlog");

  const updated = await updateTask(created.id, { status: "in-progress" });
  expect(updated.status).toBe("in-progress");

  const list = await fetchTasks({ page: 1, pageSize: 100, keyword: "" });
  expect(list.items.some((t) => t.id === created.id)).toBe(true);

  await deleteTask(created.id);
  const after = await fetchTasks({ page: 1, pageSize: 100, keyword: "" });
  expect(after.items.some((t) => t.id === created.id)).toBe(false);
});

test("按状态和优先级筛选任务列表", async () => {
  await createTask({
    title: "紧急缺陷",
    status: "in-review",
    priority: "urgent",
    assigneeId: "1",
    labels: ["bug"],
  });

  const result = await fetchTasks({
    page: 1,
    pageSize: 100,
    keyword: "",
    statuses: ["in-review"],
    priorities: ["urgent"],
  });

  expect(result.items.length).toBeGreaterThan(0);
  expect(result.items.every((t) => t.status === "in-review" && t.priority === "urgent")).toBe(
    true,
  );
});

test("按关键字分页任务列表", async () => {
  const page1 = await fetchTasks({ page: 1, pageSize: 5, keyword: "" });
  expect(page1.items.length).toBe(5);
  expect(page1.total).toBeGreaterThan(5);

  const filtered = await fetchTasks({ page: 1, pageSize: 100, keyword: "任务 01" });
  expect(filtered.items.every((t) => t.title.includes("任务 01"))).toBe(true);
});
