import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { createTask, deleteTask, fetchTasks, updateTask } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
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

  const list = await fetchTasks();
  expect(list.items.some((t) => t.id === created.id)).toBe(true);

  await deleteTask(created.id);
  const after = await fetchTasks();
  expect(after.items.some((t) => t.id === created.id)).toBe(false);
});
