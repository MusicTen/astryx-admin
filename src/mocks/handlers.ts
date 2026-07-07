import { HttpResponse, http } from "msw";
import { createSeedUsers, type MockUser } from "./data";

let users = createSeedUsers();
let nextId = users.length + 1;

export const handlers = [
  http.post("*/api/auth/login", async ({ request }) => {
    const { username, password } = (await request.json()) as {
      username: string;
      password: string;
    };
    if (password !== "admin123") {
      return HttpResponse.json(
        { code: "BAD_CREDENTIALS", message: "用户名或密码错误" },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      token: `mock-token-${Date.now()}`,
      user: { id: "1", name: username, email: `${username}@example.com` },
    });
  }),

  http.get("*/api/dashboard/stats", () =>
    HttpResponse.json({
      userTotal: users.length,
      activeToday: users.filter((u) => u.isActive).length,
      orderTotal: 1280,
      errorCount: 3,
    }),
  ),

  http.get("*/api/users", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const keyword = url.searchParams.get("keyword") ?? "";
    const filtered = keyword
      ? users.filter((u) => u.name.includes(keyword) || u.email.includes(keyword))
      : users;
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
