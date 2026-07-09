import useSWR from "swr";
import { appsKey } from "./api";
import type { IntegrationListResult } from "./types";

export function useIntegrations() {
  const { data, isLoading, mutate } = useSWR<IntegrationListResult>(appsKey);
  return {
    apps: data?.items ?? [],
    isLoading,
    refresh: mutate,
  };
}
