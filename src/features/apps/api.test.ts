import { afterAll, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mocks/handlers";
import { connectIntegration, disconnectIntegration, fetchIntegrations } from "./api";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

test("应用连接与断开", async () => {
  const before = await fetchIntegrations();
  const target = before.items.find((a) => !a.isConnected);
  expect(target).toBeTruthy();
  if (!target) return;

  const connected = await connectIntegration(target.id);
  expect(connected.isConnected).toBe(true);

  const disconnected = await disconnectIntegration(target.id);
  expect(disconnected.isConnected).toBe(false);
});
