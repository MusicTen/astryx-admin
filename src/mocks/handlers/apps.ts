import { HttpResponse, http } from "msw";
import { createSeedIntegrations } from "../data/apps";

export let apps = createSeedIntegrations();

export const appHandlers = [
  http.get("*/api/apps", () => HttpResponse.json({ items: apps })),

  http.post("*/api/apps/:id/connect", ({ params }) => {
    const existing = apps.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "应用不存在" }, { status: 404 });
    }
    const updated = { ...existing, isConnected: true };
    apps = apps.map((a) => (a.id === existing.id ? updated : a));
    return HttpResponse.json(updated);
  }),

  http.post("*/api/apps/:id/disconnect", ({ params }) => {
    const existing = apps.find((a) => a.id === params.id);
    if (!existing) {
      return HttpResponse.json({ code: "NOT_FOUND", message: "应用不存在" }, { status: 404 });
    }
    const updated = { ...existing, isConnected: false };
    apps = apps.map((a) => (a.id === existing.id ? updated : a));
    return HttpResponse.json(updated);
  }),
];
