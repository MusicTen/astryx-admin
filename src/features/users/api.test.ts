import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { createUser, deleteUser, fetchUsers, updateUser } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

test("用户 CRUD 全链路", async () => {
  const created = await createUser({
    username: "test.user",
    name: "测试用户",
    email: "t@example.com",
    phone: "+12025550100",
    role: "viewer",
    status: "active",
  });
  expect(created.id).toBeTruthy();

  const updated = await updateUser(created.id, { ...created, name: "改名" });
  expect(updated.name).toBe("改名");

  const list = await fetchUsers({ page: 1, pageSize: 10, keyword: "改名" });
  expect(list.total).toBe(1);

  await deleteUser(created.id);
  const after = await fetchUsers({ page: 1, pageSize: 10, keyword: "改名" });
  expect(after.total).toBe(0);
});
