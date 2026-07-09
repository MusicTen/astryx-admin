import { HttpResponse, http } from "msw";

export const authHandlers = [
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
];
