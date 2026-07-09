import { http } from "../../lib/http";
import type { Integration, IntegrationListResult } from "./types";

export const appsKey = "apps";

export function fetchIntegrations(): Promise<IntegrationListResult> {
  return http.get(appsKey).json<IntegrationListResult>();
}

export function connectIntegration(id: string): Promise<Integration> {
  return http.post(`apps/${id}/connect`).json<Integration>();
}

export function disconnectIntegration(id: string): Promise<Integration> {
  return http.post(`apps/${id}/disconnect`).json<Integration>();
}
