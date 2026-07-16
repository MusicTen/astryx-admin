import { HttpResponse, http } from "msw";
import { createSeedTasks, type MockTask } from "../data/tasks";

export let tasks = createSeedTasks();
let nextId = tasks.length + 1;

export function resetTasks(): void {
  tasks = createSeedTasks();
  nextId = tasks.length + 1;
}

export const taskHandlers = [
  http.get("*/api/tasks", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const keyword = url.searchParams.get("keyword") ?? "";
    const statuses = url.searchParams.getAll("status");
    const priorities = url.searchParams.getAll("priority");

    let filtered = tasks;
    if (keyword) {
      filtered = filtered.filter(
        (t) => t.title.includes(keyword) || `TASK-${t.id.padStart(4, "0")}`.includes(keyword),
      );
    }
    if (statuses.length > 0) {
      filtered = filtered.filter((t) => statuses.includes(t.status));
    }
    if (priorities.length > 0) {
      filtered = filtered.filter((t) => priorities.includes(t.priority));
    }

    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
    });
  }),

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
