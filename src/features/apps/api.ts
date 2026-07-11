import type { PageResult } from "../../lib/api";
import { http } from "../../lib/http";
import type { Integration } from "./types";

export const appsKey = "apps";

export function fetchIntegrations(): Promise<PageResult<Integration>> {
  return http.get(appsKey).json<PageResult<Integration>>();
}

export function connectIntegration(id: string): Promise<Integration> {
  return http.post(`apps/${id}/connect`).json<Integration>();
}

export function disconnectIntegration(id: string): Promise<Integration> {
  return http.post(`apps/${id}/disconnect`).json<Integration>();
}
