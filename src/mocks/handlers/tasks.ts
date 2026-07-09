import { HttpResponse, http } from "msw";
import { createSeedTasks, type MockTask } from "../data/tasks";

export let tasks = createSeedTasks();
let nextId = tasks.length + 1;

export const taskHandlers = [
  http.get("*/api/tasks", () => HttpResponse.json({ items: tasks })),

  http.post("*/api/tasks", async ({ request }) => {
    const body = (await request.json()) as Omit<MockTask, "id" | "createdAt">;
    const task: MockTask = { ...body, id: String(nextId++), createdAt: new Date().toISOString() };
    tasks = [task, ...tasks];
    return HttpResponse.json(task, { status: 201 });
  }),

  http.put("*/api/tasks/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<MockTask>;
    const existing = tasks.find((t) => t.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "任务不存在" }, { status: 404 });
    }
    const updated = { ...existing, ...body, id: existing.id };
    tasks = tasks.map((t) => (t.id === existing.id ? updated : t));
    return HttpResponse.json(updated);
  }),

  http.delete("*/api/tasks/:id", ({ params }) => {
    tasks = tasks.filter((t) => t.id !== params.id);
    return HttpResponse.json({ ok: true });
  }),
];
