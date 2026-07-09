import { HttpResponse, http } from "msw";
import { createSeedUsers, type MockUser } from "../data/users";

export let users = createSeedUsers();
let nextId = users.length + 1;

export const userHandlers = [
  http.get("*/api/users", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const keyword = url.searchParams.get("keyword") ?? "";
    const statuses = url.searchParams.getAll("status");
    const roles = url.searchParams.getAll("role");

    let filtered = users;
    if (keyword) {
      filtered = filtered.filter(
        (u) =>
          u.name.includes(keyword) ||
          u.email.includes(keyword) ||
          u.username.includes(keyword),
      );
    }
    if (statuses.length > 0) {
      filtered = filtered.filter((u) => statuses.includes(u.status));
    }
    if (roles.length > 0) {
      filtered = filtered.filter((u) => roles.includes(u.role));
    }

    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
    });
  }),

  http.post("*/api/users", async ({ request }) => {
    const body = (await request.json()) as Omit<MockUser, "id" | "createdAt">;
    const user: MockUser = {
      ...body,
      id: String(nextId++),
      createdAt: new Date().toISOString(),
    };
    users = [user, ...users];
    return HttpResponse.json(user, { status: 201 });
  }),

  http.put("*/api/users/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<MockUser>;
    const existing = users.find((u) => u.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "用户不存在" }, { status: 404 });
    }
    const updated = { ...existing, ...body, id: existing.id };
    users = users.map((u) => (u.id === existing.id ? updated : u));
    return HttpResponse.json(updated);
  }),

  http.delete("*/api/users/:id", ({ params }) => {
    users = users.filter((u) => u.id !== params.id);
    return HttpResponse.json({ ok: true });
  }),
];
